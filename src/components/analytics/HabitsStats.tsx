'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, TrendingUp, Target, Calendar, RefreshCw, Flame } from 'lucide-react'
import { HabitsService } from '@/lib/services/habitsService'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface HabitsStatsProps {
  userId: string
}

interface HabitStats {
  totalHabits: number
  activeStreak: Record<string, number>
  completionRate: Record<string, number>
  dailyBreakdown: Array<{
    date: string
    habits: Record<string, { completed: number, target: number }>
  }>
}

export default function HabitsStats({ userId }: HabitsStatsProps) {
  const [stats, setStats] = useState<HabitStats | null>(null)
  const [habits, setHabits] = useState<Array<{ id: string; name: string; [key: string]: unknown }>>([])
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    try {
      setLoading(true)
      const [statsData, habitsData] = await Promise.all([
        HabitsService.getHabitStats(userId, 30),
        HabitsService.getUserHabits(userId)
      ])
      setStats(statsData)
      setHabits(habitsData)
    } catch (error) {
      console.error('Error loading habits stats:', error)
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

  if (!stats || !habits.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No habit data available</h3>
        <p className="text-sm">Start tracking habits on the home page to see analytics here!</p>
      </div>
    )
  }

  // Prepare chart data
  const trendData = stats.dailyBreakdown.map(day => {
    const totalCompleted = Object.values(day.habits).reduce((sum, habit) => sum + habit.completed, 0)
    const totalTarget = Object.values(day.habits).reduce((sum, habit) => sum + habit.target, 0)
    const completionRate = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0

    return {
      date: format(parseISO(day.date), 'MMM d'),
      fullDate: day.date,
      completionRate,
      completed: totalCompleted,
      target: totalTarget
    }
  }).slice(-14) // Show last 14 days

  // Habit performance data
  const habitPerformanceData = habits.map(habit => ({
    name: habit.name.length > 15 ? habit.name.substring(0, 15) + '...' : habit.name,
    fullName: habit.name,
    completionRate: stats.completionRate[habit.id] || 0,
    streak: stats.activeStreak[habit.id] || 0,
    color: habit.color
  })).sort((a, b) => b.completionRate - a.completionRate)

  // Calculate overall stats
  const totalCompletionRate = habits.length > 0 ? 
    Object.values(stats.completionRate).reduce((sum, rate) => sum + rate, 0) / habits.length : 0
  
  const bestStreak = Math.max(...Object.values(stats.activeStreak), 0)
  const activeHabits = habits.filter(h => stats.completionRate[h.id] > 0).length

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: { 
    active?: boolean, 
    payload?: Array<{ value?: number, payload?: { name: string; [key: string]: unknown } }>, 
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
              Progress: {String(data?.completed || 0)}/{String(data?.target || 0)}
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
            <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHabits}</div>
            <p className="text-xs text-muted-foreground">Active habits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{bestStreak}</div>
            <p className="text-xs text-muted-foreground">Consecutive days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeHabits}</div>
            <p className="text-xs text-muted-foreground">With progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Daily Completion Trend
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your overall habit completion rate over the last 14 days
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
          {trendData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
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
              No completion data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Habit Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Individual Habit Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {habitPerformanceData.map((habit, index) => (
              <div key={habit.fullName} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: String(habit.color || COLORS[index % COLORS.length]) }}
                    />
                    <span className="font-medium" title={habit.fullName}>
                      {habit.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-xs">
                      {habit.streak} day streak
                    </Badge>
                    <span className="text-sm font-medium">
                      {habit.completionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Progress value={habit.completionRate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {totalCompletionRate >= 80 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Outstanding Consistency!</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You&apos;re maintaining an excellent {totalCompletionRate.toFixed(1)}% completion rate across all habits. Keep up the amazing work!
                  </p>
                </div>
              </div>
            )}
            
            {bestStreak >= 7 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-l-4 border-amber-500">
                <Flame className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">Streak Champion! 🔥</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Your best streak is {bestStreak} days! You&apos;re building incredible discipline and consistency.
                  </p>
                </div>
              </div>
            )}
            
            {totalCompletionRate < 50 && habits.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">Room for Growth</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your completion rate is {totalCompletionRate.toFixed(1)}%. Try focusing on 1-2 key habits first to build momentum before adding more.
                  </p>
                </div>
              </div>
            )}

            {stats.totalHabits === 0 && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg border-l-4 border-gray-500">
                <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Ready to Start</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    No habits tracked yet! Head to the home page to add your first habit and start building positive routines.
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