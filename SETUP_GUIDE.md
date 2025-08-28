# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → "New Project"
3. Choose organization and fill in project details:
   - Name: `kairos-todos` (or any name)
   - Database Password: Generate a strong password
   - Region: Choose closest to you
4. Click "Create new project"
5. Wait for setup to complete (~2 minutes)

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (under Project URL)
   - **anon public** key (under Project API keys)

## 3. Set Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 4. Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click **Run** to execute the schema

## 5. Configure Google OAuth

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click the toggle to enable it
3. You'll need Google OAuth credentials:

### Option A: Use Existing Google Project
If you have a Google Cloud project with OAuth setup:
- Add your **Client ID** and **Client Secret**

### Option B: Create New Google OAuth (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" → Enable it
4. Create OAuth credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Name: `Kairos Todo App`
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production - when deployed)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/auth/callback`
     - `https://yourdomain.com/auth/callback`
   - Click **Create**
5. Copy **Client ID** and **Client Secret** to Supabase

### Configure Redirect URLs in Supabase:
1. Go to **Authentication** → **URL Configuration**
2. **Site URL:** `http://localhost:3000` (change to your domain when deployed)
3. **Redirect URLs:** Add these URLs:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (when deployed)

## 6. Test the Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. You should be redirected to the sign-in page
4. Click "Continue with Google"
5. Complete Google OAuth flow
6. You should land on the dashboard with working todo functionality

## Troubleshooting

### "Could not find table 'public.todos'"
- Make sure you ran the SQL schema from `supabase/schema.sql`
- Check that the query executed successfully (no red error messages)

### Google OAuth not working
- Verify **Client ID** and **Client Secret** in Supabase
- Check that JavaScript origins and redirect URIs match exactly
- Make sure Google+ API is enabled

### Environment variables not loading
- Restart your development server after changing `.env.local`
- Make sure `.env.local` is in your project root (same level as `package.json`)

### Still having issues?
- Check the browser console for detailed error messages
- Check the Supabase dashboard logs under **Logs** → **Database**