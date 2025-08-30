'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import Navbar from '@/components/layout/Navbar'
import StatsCards from '@/components/analytics/StatsCards'
import DailyChart from '@/components/analytics/DailyChart'
import ProjectStats from '@/components/analytics/ProjectStats'
import TagStats from '@/components/analytics/TagStats'
import WeeklyChart from '@/components/analytics/WeeklyChart'
import GoalStats from '@/components/analytics/GoalStats'
import { Button } from '@/components/ui/button'
import { RefreshCw, Calendar, BarChart3, TrendingUp } from 'lucide-react'
import { 
  OverallStats, 
  DailyStats, 
  ProjectStats as ProjectStatsType, 
  TagStats as TagStatsType, 
  WeeklyStats 
} from '@/lib/services/analyticsService'
import { toast } from 'sonner'

interface AnalyticsClientProps {
  user: User
}

export default function AnalyticsClient({ user }: AnalyticsClientProps) {
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([])
  const [projectStats, setProjectStats] = useState<ProjectStatsType[]>([])
  const [tagStats, setTagStats] = useState<TagStatsType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      
      const [overviewRes, dailyRes, weeklyRes, projectRes, tagRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch('/api/analytics/daily?days=30'),
        fetch('/api/analytics/weekly?weeks=12'),
        fetch('/api/analytics/projects'),
        fetch('/api/analytics/tags')
      ])

      if (!overviewRes.ok) throw new Error('Failed to load overview stats')
      if (!dailyRes.ok) throw new Error('Failed to load daily stats')
      if (!weeklyRes.ok) throw new Error('Failed to load weekly stats')
      if (!projectRes.ok) throw new Error('Failed to load project stats')
      if (!tagRes.ok) throw new Error('Failed to load tag stats')

      const [overview, daily, weekly, projects, tags] = await Promise.all([
        overviewRes.json(),
        dailyRes.json(),
        weeklyRes.json(),
        projectRes.json(),
        tagRes.json()
      ])

      setOverallStats(overview)
      setDailyStats(daily)
      setWeeklyStats(weekly)
      setProjectStats(projects)
      setTagStats(tags)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
    toast.success('Analytics data refreshed!')
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        user={user} 
        title="Analytics Dashboard"
        subtitle="Track your productivity and task completion patterns"
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Productivity Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Insights into your task completion patterns and productivity trends
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading your analytics...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats Cards */}
            {overallStats && <StatsCards stats={overallStats} />}

            {/* Goal Analytics Section */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Goal Tracking Analytics</h3>
              <GoalStats userId={user.id} />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Activity Chart */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-lg border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Daily Activity (Last 30 Days)</h3>
                  </div>
                  <DailyChart data={dailyStats} />
                </div>
              </div>

              {/* Weekly Trends */}
              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Weekly Trends (Last 12 Weeks)</h3>
                </div>
                <WeeklyChart data={weeklyStats} />
              </div>

              {/* Project Performance */}
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Project Performance</h3>
                <ProjectStats data={projectStats} />
              </div>

              {/* Tag Analysis */}
              {tagStats.length > 0 && (
                <div className="lg:col-span-2 bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">Tag Analysis</h3>
                  <TagStats data={tagStats} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}