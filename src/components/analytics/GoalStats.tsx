'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target, Calendar, TrendingUp, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfWeek, startOfMonth, subDays, eachDayOfInterval } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface GoalStatsProps {
  userId: string
}

interface DailyGoalStats {
  total_daily_goals: number
  completed_daily_goals: number
  daily_completion_rate: number
  streak_days: number
  goals_this_week: number
  goals_this_month: number
  weekly_completion_rate: number
  monthly_completion_rate: number
}

interface LongTermGoalStats {
  total_long_term_goals: number
  completed_long_term_goals: number
  avg_progress: number
  goals_due_soon: number
  overdue_goals: number
}

interface WeeklyGoalData {
  week: string
  goals: number
  completed: number
  rate: number
}

export default function GoalStats({ userId }: GoalStatsProps) {
  const [dailyStats, setDailyStats] = useState<DailyGoalStats | null>(null)
  const [longTermStats, setLongTermStats] = useState<LongTermGoalStats | null>(null)
  const [weeklyData, setWeeklyData] = useState<WeeklyGoalData[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()


  const loadDailyGoalStats = useCallback(async () => {
    const today = new Date()
    const weekStart = startOfWeek(today)
    const monthStart = startOfMonth(today)
    const last30Days = subDays(today, 30)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allGoals } = await (supabase as any)
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .gte('date', format(last30Days, 'yyyy-MM-dd'))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: weekGoals } = await (supabase as any)
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .gte('date', format(weekStart, 'yyyy-MM-dd'))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: monthGoals } = await (supabase as any)
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .gte('date', format(monthStart, 'yyyy-MM-dd'))

    // Calculate streak
    let streak = 0
    const dates = eachDayOfInterval({ start: last30Days, end: today }).reverse()
    
    for (const date of dates) {
      const dateStr = format(date, 'yyyy-MM-dd')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dayGoals = allGoals?.filter((g: any) => g.date === dateStr) || []
      
      if (dayGoals.length === 0) break
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completedCount = dayGoals.filter((g: any) => g.completed).length
      if (completedCount === dayGoals.length && dayGoals.length > 0) {
        streak++
      } else {
        break
      }
    }

    const totalGoals = allGoals?.length || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completedGoals = allGoals?.filter((g: any) => g.completed).length || 0
    const weekTotal = weekGoals?.length || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const weekCompleted = weekGoals?.filter((g: any) => g.completed).length || 0
    const monthTotal = monthGoals?.length || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monthCompleted = monthGoals?.filter((g: any) => g.completed).length || 0

    setDailyStats({
      total_daily_goals: totalGoals,
      completed_daily_goals: completedGoals,
      daily_completion_rate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
      streak_days: streak,
      goals_this_week: weekTotal,
      goals_this_month: monthTotal,
      weekly_completion_rate: weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0,
      monthly_completion_rate: monthTotal > 0 ? (monthCompleted / monthTotal) * 100 : 0
    })
  }, [userId, supabase])

  const loadLongTermGoalStats = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const oneWeekFromNow = format(subDays(new Date(), -7), 'yyyy-MM-dd')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allLongTermGoals } = await (supabase as any)
      .from('long_term_goals')
      .select('*')
      .eq('user_id', userId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dueSoonGoals } = await (supabase as any)
      .from('long_term_goals')
      .select('*')
      .eq('user_id', userId)
      .lte('target_date', oneWeekFromNow)
      .eq('completed', false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: overdueGoals } = await (supabase as any)
      .from('long_term_goals')
      .select('*')
      .eq('user_id', userId)
      .lt('target_date', today)
      .eq('completed', false)

    const total = allLongTermGoals?.length || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completed = allLongTermGoals?.filter((g: any) => g.completed).length || 0
    const avgProgress = total > 0 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? allLongTermGoals!.reduce((sum: any, g: any) => sum + g.progress, 0) / total 
      : 0

    setLongTermStats({
      total_long_term_goals: total,
      completed_long_term_goals: completed,
      avg_progress: avgProgress,
      goals_due_soon: dueSoonGoals?.length || 0,
      overdue_goals: overdueGoals?.length || 0
    })
  }, [supabase, userId])

  const loadWeeklyGoalData = useCallback(async () => {
    const last8Weeks = subDays(new Date(), 56)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: goals } = await (supabase as any)
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .gte('date', format(last8Weeks, 'yyyy-MM-dd'))

    // Group by week
    const weeklyMap = new Map<string, { goals: number, completed: number }>()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    goals?.forEach((goal: any) => {
      const goalDate = new Date(goal.date)
      const weekStart = startOfWeek(goalDate)
      const weekKey = format(weekStart, 'MMM d')
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, { goals: 0, completed: 0 })
      }
      
      const week = weeklyMap.get(weekKey)!
      week.goals++
      if (goal.completed) week.completed++
    })

    const weeklyArray = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      goals: data.goals,
      completed: data.completed,
      rate: data.goals > 0 ? Math.round((data.completed / data.goals) * 100) : 0
    }))

    setWeeklyData(weeklyArray.slice(-8))
  }, [supabase, userId])

  useEffect(() => {
    const loadGoalStats = async () => {
      try {
        await Promise.all([
          loadDailyGoalStats(),
          loadLongTermGoalStats(),
          loadWeeklyGoalData()
        ])
      } catch (error) {
        console.error('Error loading goal stats:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadGoalStats()
  }, [loadDailyGoalStats, loadLongTermGoalStats, loadWeeklyGoalData])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Daily Goals Stats Cards */}
      {dailyStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Daily Goal Rate</p>
                  <p className="text-2xl font-bold">{Math.round(dailyStats.daily_completion_rate)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {dailyStats.completed_daily_goals} of {dailyStats.total_daily_goals} completed
                  </p>
                </div>
                <div className="bg-green-50 text-green-600 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">{dailyStats.streak_days}</p>
                  <p className="text-xs text-muted-foreground">days in a row</p>
                </div>
                <div className="bg-orange-50 text-orange-600 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{Math.round(dailyStats.weekly_completion_rate)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {dailyStats.goals_this_week} goals set
                  </p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-full">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{Math.round(dailyStats.monthly_completion_rate)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {dailyStats.goals_this_month} goals set
                  </p>
                </div>
                <div className="bg-purple-50 text-purple-600 p-3 rounded-full">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Long-term Goals Overview */}
        {longTermStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Long-term Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Progress</span>
                <Badge variant="secondary">{Math.round(longTermStats.avg_progress)}%</Badge>
              </div>
              <Progress value={longTermStats.avg_progress} className="h-2" />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {longTermStats.total_long_term_goals}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {longTermStats.completed_long_term_goals}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {longTermStats.goals_due_soon}
                  </div>
                  <div className="text-xs text-muted-foreground">Due Soon</div>
                </div>
              </div>

              {longTermStats.overdue_goals > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-red-800">
                      {longTermStats.overdue_goals} overdue goals need attention
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Weekly Goal Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Goal Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'rate' ? `${value}%` : value,
                    name === 'rate' ? 'Completion Rate' : name === 'goals' ? 'Total Goals' : 'Completed'
                  ]}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}