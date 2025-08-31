import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsService } from '@/lib/services/analyticsService'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get days parameter from query string (default to 30)
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      )
    }

    const dailyStats = await AnalyticsService.getDailyStats(supabase, user.id, days)
    
    return NextResponse.json(dailyStats)
  } catch (error) {
    console.error('Error fetching daily analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily analytics data' },
      { status: 500 }
    )
  }
}