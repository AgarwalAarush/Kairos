import { NextRequest, NextResponse } from 'next/server'
import { GoogleOAuthService } from '@/lib/services/googleOAuthService'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // This should be the user ID
    const error = searchParams.get('error')

    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(new URL('/calendar?error=oauth_denied', request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/calendar?error=invalid_request', request.url))
    }

    // Exchange code for tokens
    const tokens = await GoogleOAuthService.exchangeCodeForTokens(code, state)
    
    // Store tokens in Supabase for the user
    const supabase = await createClient()
    
    const integrationData = {
      user_id: state,
      integration_type: 'google_calendar' as const,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (supabase as any)
      .from('user_integrations')
      .upsert([integrationData], {
        onConflict: 'user_id,integration_type'
      })

    if (dbError) {
      console.error('Error storing Google tokens:', dbError)
      return NextResponse.redirect(new URL('/calendar?error=storage_failed', request.url))
    }

    return NextResponse.redirect(new URL('/calendar?connected=true', request.url))
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error)
    return NextResponse.redirect(new URL('/calendar?error=callback_failed', request.url))
  }
}