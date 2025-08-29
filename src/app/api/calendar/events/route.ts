import { NextRequest, NextResponse } from 'next/server'
import { GoogleCalendarService } from '@/lib/services/googleCalendarService'
import { GoogleOAuthService } from '@/lib/services/googleOAuthService'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get stored Google tokens
    // @ts-expect-error - Table will be created after running the migration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_type', 'google_calendar')
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ 
        error: 'Google Calendar not connected',
        needsAuth: true 
      }, { status: 400 })
    }

    let accessToken = integration.access_token

    // Check if token is expired and refresh if needed
    if (new Date() >= new Date(integration.expires_at)) {
      if (!integration.refresh_token) {
        return NextResponse.json({ 
          error: 'Token expired and no refresh token available',
          needsAuth: true 
        }, { status: 400 })
      }

      try {
        const refreshedTokens = await GoogleOAuthService.refreshAccessToken(integration.refresh_token)
        
        // Update stored tokens
            // @ts-expect-error - Table will be created after running the migration
        await supabase
          .from('user_integrations')
          .update({
            access_token: refreshedTokens.access_token,
            expires_at: new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('integration_type', 'google_calendar')

        accessToken = refreshedTokens.access_token
      } catch (refreshError) {
        console.error('Error refreshing Google token:', refreshError)
        return NextResponse.json({ 
          error: 'Failed to refresh token',
          needsAuth: true 
        }, { status: 400 })
      }
    }

    // Fetch calendar events
    const events = await GoogleCalendarService.getEvents(accessToken)
    
    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}