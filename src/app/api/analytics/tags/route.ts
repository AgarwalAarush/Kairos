import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsService } from '@/lib/services/analyticsService'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tagStats = await AnalyticsService.getTagStats(supabase, user.id)
    
    return NextResponse.json(tagStats)
  } catch (error) {
    console.error('Error fetching tag analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag analytics data' },
      { status: 500 }
    )
  }
}