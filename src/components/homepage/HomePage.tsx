'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Circle, Target, TrendingUp, Plus, Check, X, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import quotes from '@/data/motivationalQuotes.json'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'

interface DailyGoal {
  id: string
  user_id: string
  goal: string
  completed: boolean
  date: string
  created_at: string
}

interface LongTermGoal {
  id: string
  user_id: string
  title: string
  description: string
  target_date: string
  progress: number
  completed: boolean
  created_at: string
}

interface HomePageProps {
  user: User
}

export default function HomePage({ user }: HomePageProps) {
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([])
  const [longTermGoals, setLongTermGoals] = useState<LongTermGoal[]>([])
  const [newDailyGoal, setNewDailyGoal] = useState('')
  const [newLongTermGoal, setNewLongTermGoal] = useState({
    title: '',
    description: '',
    targetDate: ''
  })
  const [showNewLongTermForm, setShowNewLongTermForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  
  // Get daily motivational quote (same as pomodoro but simpler)
  const getDailyQuote = () => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    return quotes.quotes[dayOfYear % quotes.quotes.length]
  }
  
  const dailyQuote = getDailyQuote()

  const loadGoals = useCallback(async () => {
    try {
      // Load today's daily goals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dailyData, error: dailyError } = await (supabase as any)
        .from('daily_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false })

      if (dailyError) throw dailyError
      setDailyGoals(dailyData || [])

      // Load active long-term goals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: longTermData, error: longTermError } = await (supabase as any)
        .from('long_term_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false })

      if (longTermError) throw longTermError
      setLongTermGoals(longTermData || [])
    } catch (error) {
      console.error('Error loading goals:', error)
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }, [user.id, today, supabase])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const addDailyGoal = async () => {
    if (!newDailyGoal.trim()) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('daily_goals')
        .insert({
          user_id: user.id,
          goal: newDailyGoal.trim(),
          date: today,
          completed: false
        })
        .select()
        .single()

      if (error) throw error
      
      setDailyGoals([data, ...dailyGoals])
      setNewDailyGoal('')
      toast.success('Daily goal added!')
    } catch (error) {
      console.error('Error adding daily goal:', error)
      toast.error('Failed to add daily goal')
    }
  }

  const toggleDailyGoal = async (goalId: string, completed: boolean) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('daily_goals')
        .update({ completed })
        .eq('id', goalId)

      if (error) throw error

      setDailyGoals(dailyGoals.map(goal => 
        goal.id === goalId ? { ...goal, completed } : goal
      ))
      
      if (completed) {
        toast.success('Great job! Goal completed! 🎉')
      }
    } catch (error) {
      console.error('Error updating daily goal:', error)
      toast.error('Failed to update goal')
    }
  }

  const addLongTermGoal = async () => {
    if (!newLongTermGoal.title.trim() || !newLongTermGoal.targetDate) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('long_term_goals')
        .insert({
          user_id: user.id,
          title: newLongTermGoal.title.trim(),
          description: newLongTermGoal.description.trim(),
          target_date: newLongTermGoal.targetDate,
          progress: 0,
          completed: false
        })
        .select()
        .single()

      if (error) throw error
      
      setLongTermGoals([data, ...longTermGoals])
      setNewLongTermGoal({ title: '', description: '', targetDate: '' })
      setShowNewLongTermForm(false)
      toast.success('Long-term goal added!')
    } catch (error) {
      console.error('Error adding long-term goal:', error)
      toast.error('Failed to add long-term goal')
    }
  }

  const updateLongTermProgress = async (goalId: string, progress: number) => {
    try {
      const completed = progress >= 100
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('long_term_goals')
        .update({ progress, completed })
        .eq('id', goalId)

      if (error) throw error

      setLongTermGoals(longTermGoals.map(goal => 
        goal.id === goalId ? { ...goal, progress, completed } : goal
      ))
      
      if (completed) {
        toast.success('Long-term goal completed! Amazing work! 🚀')
      }
    } catch (error) {
      console.error('Error updating long-term goal:', error)
      toast.error('Failed to update progress')
    }
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </main>
    )
  }

  const completedDailyGoals = dailyGoals.filter(goal => goal.completed).length
  const dailyCompletionRate = dailyGoals.length > 0 ? (completedDailyGoals / dailyGoals.length) * 100 : 0

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome back! 👋</h1>
        <p className="text-xl text-muted-foreground mb-6">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </p>
      </div>

      {/* Daily Quote - Pomodoro Style */}
      <div className="text-center max-w-2xl mx-auto py-8 mb-8">
        <blockquote className="text-lg text-muted-foreground italic leading-relaxed mb-3">
          &ldquo;{dailyQuote.text}&rdquo;
        </blockquote>
        <cite className="text-sm font-medium text-muted-foreground/80">
          — {dailyQuote.author}
        </cite>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Goals Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle>Today&apos;s Goals</CardTitle>
                  </div>
                  <Badge variant={dailyCompletionRate === 100 ? "default" : "secondary"}>
                    {completedDailyGoals}/{dailyGoals.length} completed
                  </Badge>
                </div>
                {dailyGoals.length > 0 && (
                  <Progress value={dailyCompletionRate} className="mt-2" />
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new daily goal */}
                <div className="flex gap-2">
                  <Input
                    placeholder="What do you want to accomplish today?"
                    value={newDailyGoal}
                    onChange={(e) => setNewDailyGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addDailyGoal()}
                  />
                  <Button onClick={addDailyGoal} disabled={!newDailyGoal.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Daily goals list */}
                <div className="space-y-2">
                  {dailyGoals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No goals set for today. Add one above to get started!
                    </p>
                  ) : (
                    dailyGoals.map((goal) => (
                      <div
                        key={goal.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          goal.completed 
                            ? 'bg-muted/50 border-primary/20' 
                            : 'bg-card hover:bg-muted/30'
                        } transition-colors`}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-6 w-6"
                          onClick={() => toggleDailyGoal(goal.id, !goal.completed)}
                        >
                          {goal.completed ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                        <span className={`text-base md:text-sm ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {goal.goal}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Long Term Goals Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <CardTitle>Long-term Goals</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewLongTermForm(!showNewLongTermForm)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Goal
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new long-term goal form */}
                {showNewLongTermForm && (
                  <Card className="border-dashed">
                    <CardContent className="pt-4 space-y-3">
                      <Input
                        placeholder="Goal title"
                        value={newLongTermGoal.title}
                        onChange={(e) => setNewLongTermGoal({ ...newLongTermGoal, title: e.target.value })}
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={newLongTermGoal.description}
                        onChange={(e) => setNewLongTermGoal({ ...newLongTermGoal, description: e.target.value })}
                        rows={2}
                      />
                      <Input
                        type="date"
                        value={newLongTermGoal.targetDate}
                        onChange={(e) => setNewLongTermGoal({ ...newLongTermGoal, targetDate: e.target.value })}
                        min={today}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={addLongTermGoal}
                          disabled={!newLongTermGoal.title.trim() || !newLongTermGoal.targetDate}
                          className="flex-1"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Add Goal
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowNewLongTermForm(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Long-term goals list */}
                <div className="space-y-4">
                  {longTermGoals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No long-term goals yet. Add one to start tracking your big objectives!
                    </p>
                  ) : (
                    longTermGoals.map((goal) => (
                      <Card key={goal.id} className="border-primary/20">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-base md:text-sm">{goal.title}</h4>
                              {goal.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {goal.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Badge variant={goal.progress >= 100 ? "default" : "secondary"}>
                              {goal.progress}%
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <Progress value={goal.progress} />
                            <div className="flex gap-1">
                              {[10, 25, 50, 75, 100].map((percent) => (
                                <Button
                                  key={percent}
                                  variant={goal.progress >= percent ? "default" : "outline"}
                                  size="sm"
                                  className="flex-1 text-xs h-8"
                                  onClick={() => updateLongTermProgress(goal.id, percent)}
                                >
                                  {percent}%
                                </Button>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Quick Stats */}
      {(dailyGoals.length > 0 || longTermGoals.length > 0) && (
        <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Today&apos;s Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{completedDailyGoals}</div>
                  <div className="text-sm text-muted-foreground">Goals completed today</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{Math.round(dailyCompletionRate)}%</div>
                  <div className="text-sm text-muted-foreground">Daily completion rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{longTermGoals.length}</div>
                  <div className="text-sm text-muted-foreground">Active long-term goals</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </main>
  )
}