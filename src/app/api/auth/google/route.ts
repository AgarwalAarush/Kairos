import { NextRequest, NextResponse } from 'next/server'
import { GoogleOAuthService } from '@/lib/services/googleOAuthService'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authUrl = GoogleOAuthService.getAuthUrl(user.id)
    
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error starting Google OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to start Google OAuth' },
      { status: 500 }
    )
  }
}