# Google Calendar Integration Setup

This guide will help you set up Google Calendar integration for Kairos.

## Database Setup

1. Run the SQL migration in your Supabase SQL editor:

```sql
-- Copy and paste the contents of user_integrations_migration.sql
```

## Google API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)

5. Download the credentials JSON file

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change for production
```

## Features

- **OAuth Integration**: Secure authentication with Google Calendar
- **Event Viewing**: Display calendar events in multiple views (day, week, month, year)
- **Real-time Sync**: Automatic token refresh for continuous access
- **Multiple Views**: Switch between different calendar views
- **Responsive Design**: Works on desktop and mobile devices

## Usage

1. Navigate to the Calendar page from the dashboard
2. Click "Connect Google Calendar" if not already connected
3. Authorize Kairos to access your Google Calendar
4. View your calendar events in different views
5. Use keyboard shortcuts:
   - `m` - Month view
   - `w` - Week view  
   - `d` - Day view
   - `y` - Year view
   - `t` - Today
   - `←/→` - Navigate between dates

## Security Notes

- Access tokens are encrypted and stored securely in your Supabase database
- Refresh tokens are used to maintain access without re-authentication
- Row Level Security (RLS) ensures users can only see their own calendar data
- All API communications use HTTPS

## Troubleshooting

### "Google Calendar not connected" error
- Check that your Google OAuth credentials are correctly configured
- Verify the redirect URI matches exactly what you set in Google Cloud Console
- Make sure the Google Calendar API is enabled in your project

### "Failed to refresh token" error  
- The user needs to reconnect their Google Calendar account
- This can happen if the refresh token expires or is revoked

### "Token expired" error
- This is automatically handled by the system
- If it persists, try disconnecting and reconnecting your Google Calendar