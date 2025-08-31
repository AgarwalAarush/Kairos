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

    // Get weeks parameter from query string (default to 12)
    const { searchParams } = new URL(request.url)
    const weeks = parseInt(searchParams.get('weeks') || '12')
    
    if (weeks < 1 || weeks > 52) {
      return NextResponse.json(
        { error: 'Weeks parameter must be between 1 and 52' },
        { status: 400 }
      )
    }

    const weeklyStats = await AnalyticsService.getWeeklyStats(supabase, user.id, weeks)
    
    return NextResponse.json(weeklyStats)
  } catch (error) {
    console.error('Error fetching weekly analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weekly analytics data' },
      { status: 500 }
    )
  }
}