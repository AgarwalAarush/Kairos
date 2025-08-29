export interface GoogleOAuthConfig {
  clientId: string
  redirectUri: string
  scopes: string[]
}

export class GoogleOAuthService {
  private static readonly GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
  private static readonly GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
  
  static getConfig(): GoogleOAuthConfig {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    if (!clientId || clientId === 'your_google_client_id_here') {
      throw new Error('Google Client ID is not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file. See CALENDAR_SETUP.md for setup instructions.')
    }

    return {
      clientId,
      redirectUri: `${baseUrl}/api/auth/google/callback`,
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    }
  }

  static getAuthUrl(state?: string): string {
    const config = this.getConfig()
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state })
    })

    return `${this.GOOGLE_AUTH_URL}?${params.toString()}`
  }

  static async exchangeCodeForTokens(code: string, _state?: string): Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
  }> {
    const config = this.getConfig()
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientSecret || clientSecret === 'your_google_client_secret_here') {
      throw new Error('Google Client Secret is not configured. Please add GOOGLE_CLIENT_SECRET to your .env.local file. See CALENDAR_SETUP.md for setup instructions.')
    }

    const response = await fetch(this.GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to exchange code for tokens: ${error}`)
    }

    return response.json()
  }

  static async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string
    expires_in: number
  }> {
    const config = this.getConfig()
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientSecret || clientSecret === 'your_google_client_secret_here') {
      throw new Error('Google Client Secret is not configured. Please add GOOGLE_CLIENT_SECRET to your .env.local file. See CALENDAR_SETUP.md for setup instructions.')
    }

    const response = await fetch(this.GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to refresh access token: ${error}`)
    }

    return response.json()
  }
}