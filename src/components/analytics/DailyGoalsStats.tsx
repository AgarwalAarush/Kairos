'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Target, TrendingUp, Zap, Calendar, RefreshCw } from 'lucide-react'
import { DailyGoalsService } from '@/lib/services/dailyGoalsService'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface DailyGoalsStatsProps {
  userId: string
}

interface GoalStats {
  totalGoals: number
  completedGoals: number
  completionRate: number
  streak: number
  dailyBreakdown: Array<{
    date: string
    total: number
    completed: number
    completionRate: number
  }>
}

export default function DailyGoalsStats({ userId }: DailyGoalsStatsProps) {
  const [stats, setStats] = useState<GoalStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    try {
      setLoading(true)
      const goalStats = await DailyGoalsService.getGoalStats(userId, 30)
      setStats(goalStats)
    } catch (error) {
      console.error('Error loading daily goals stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [userId])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No daily goals data available
      </div>
    )
  }

  // Prepare chart data
  const chartData = stats.dailyBreakdown.map(day => ({
    date: format(parseISO(day.date), 'MMM d'),
    fullDate: day.date,
    completionRate: day.completionRate,
    completed: day.completed,
    total: day.total
  }))

  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: { 
    active?: boolean, 
    payload?: Array<{ value?: number, payload?: { completed?: number, total?: number } }>, 
    label?: string 
  }) => {
    if (active && payload && payload.length && label) {
      const data = payload[0]?.payload
      return (
        <div className="bg-card border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-primary rounded-full mr-2"></span>
              Completion Rate: <span className="font-medium">{payload[0]?.value?.toFixed(1)}%</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Goals: {data?.completed}/{data?.total}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.completedGoals}</div>
            <p className="text-xs text-muted-foreground">Goals achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completionRate.toFixed(1)}%
            </div>
            <Progress value={stats.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.streak}</div>
            <p className="text-xs text-muted-foreground">Days with 100% completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Daily Goals Completion Trend
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your goal completion rate over the last 30 days
            </p>
          </div>
          <Button
            onClick={loadStats}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="completionRate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No goal completion data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.completionRate >= 80 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Excellent Performance!</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You're maintaining a high goal completion rate of {stats.completionRate.toFixed(1)}%. Keep up the great work!
                  </p>
                </div>
              </div>
            )}
            
            {stats.streak >= 3 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-l-4 border-amber-500">
                <Zap className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">On Fire! 🔥</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    You're on a {stats.streak}-day streak of perfect goal completion. You're building great habits!
                  </p>
                </div>
              </div>
            )}
            
            {stats.completionRate < 50 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">Room for Improvement</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your completion rate is {stats.completionRate.toFixed(1)}%. Try setting smaller, more achievable daily goals to build momentum.
                  </p>
                </div>
              </div>
            )}

            {stats.totalGoals === 0 && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg border-l-4 border-gray-500">
                <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Get Started</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    You haven't set any daily goals yet. The system will automatically generate personalized goals for you each day!
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}