import { createClient } from '@/lib/supabase/client'
import { DailyGoal, NewDailyGoal } from '@/types/database.types'
import { format, parseISO, startOfDay, isToday } from 'date-fns'

export class DailyGoalsService {
  /**
   * Predefined categories of daily goals that can be automatically suggested
   */
  private static readonly GOAL_CATEGORIES = {
    productivity: [
      'Complete 3 high-priority tasks',
      'Review and organize task list',
      'Spend 2 hours in deep focus work',
      'Clear email inbox',
      'Update project status',
      'Plan tomorrow\'s priorities'
    ],
    health: [
      'Drink 8 glasses of water',
      'Take a 30-minute walk',
      'Do 15 minutes of stretching',
      'Get 7+ hours of sleep',
      'Eat 3 balanced meals',
      'Take breaks every hour'
    ],
    learning: [
      'Read for 30 minutes',
      'Complete one online course module',
      'Practice a new skill for 20 minutes',
      'Watch an educational video',
      'Write in a learning journal',
      'Review yesterday\'s notes'
    ],
    personal: [
      'Practice gratitude - write 3 things you\'re grateful for',
      'Meditate for 10 minutes',
      'Connect with a friend or family member',
      'Tidy up workspace',
      'Review and reflect on the day',
      'Do something creative for 15 minutes'
    ]
  }

  /**
   * Generate automatic daily goals based on user's activity patterns
   */
  static async generateAutomaticGoals(userId: string): Promise<NewDailyGoal[]> {
    const today = format(new Date(), 'yyyy-MM-dd')
    
    // Get user's existing goals to understand their preferences
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentGoals, error } = await (supabase as any)
      .from('daily_goals')
      .select('goal')
      .eq('user_id', userId)
      .gte('date', format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
      .limit(50)
    
    if (error) {
      console.error('Error fetching recent goals:', error)
    }

    // Analyze patterns and suggest relevant goals
    const suggestedGoals = this.selectSmartGoals(recentGoals || [])
    
    return suggestedGoals.map(goal => ({
      user_id: userId,
      goal,
      date: today,
      completed: false
    }))
  }

  /**
   * Smart goal selection based on user patterns and day of week
   */
  private static selectSmartGoals(recentGoals: any[]): string[] {
    const dayOfWeek = new Date().getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Extract keywords from recent goals to understand user preferences
    const recentGoalTexts = recentGoals.map(g => g.goal?.toLowerCase() || '')
    const hasProductivityFocus = recentGoalTexts.some(g => 
      g.includes('task') || g.includes('work') || g.includes('project') || g.includes('focus')
    )
    const hasHealthFocus = recentGoalTexts.some(g => 
      g.includes('walk') || g.includes('exercise') || g.includes('water') || g.includes('sleep')
    )
    const hasLearningFocus = recentGoalTexts.some(g => 
      g.includes('read') || g.includes('learn') || g.includes('study') || g.includes('skill')
    )

    const selectedGoals: string[] = []
    
    // Always include at least one from each category, weighted by user preferences and day type
    if (!isWeekend || hasProductivityFocus) {
      selectedGoals.push(this.getRandomFromCategory('productivity'))
    }
    
    // Health goals are always relevant
    selectedGoals.push(this.getRandomFromCategory('health'))
    
    // Learning goals more likely on weekdays or if user has shown interest
    if (!isWeekend || hasLearningFocus) {
      selectedGoals.push(this.getRandomFromCategory('learning'))
    }
    
    // Personal goals more likely on weekends
    if (isWeekend || selectedGoals.length < 3) {
      selectedGoals.push(this.getRandomFromCategory('personal'))
    }

    // Ensure we have 3-4 goals
    while (selectedGoals.length < 3) {
      const categories = Object.keys(this.GOAL_CATEGORIES)
      const randomCategory = categories[Math.floor(Math.random() * categories.length)] as keyof typeof this.GOAL_CATEGORIES
      const goal = this.getRandomFromCategory(randomCategory)
      if (!selectedGoals.includes(goal)) {
        selectedGoals.push(goal)
      }
    }

    return selectedGoals.slice(0, 4) // Maximum 4 goals per day
  }

  private static getRandomFromCategory(category: keyof typeof this.GOAL_CATEGORIES): string {
    const goals = this.GOAL_CATEGORIES[category]
    return goals[Math.floor(Math.random() * goals.length)]
  }

  /**
   * Get daily goals for a specific date
   */
  static async getDailyGoals(userId: string, date: Date): Promise<DailyGoal[]> {
    const dateString = format(date, 'yyyy-MM-dd')
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: goals, error } = await (supabase as any)
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateString)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching daily goals:', error)
      return []
    }
    
    return goals || []
  }

  /**
   * Get or create today's daily goals (auto-generates if none exist)
   */
  static async getTodayGoalsOrCreate(userId: string): Promise<DailyGoal[]> {
    const today = new Date()
    const existingGoals = await this.getDailyGoals(userId, today)
    
    // If goals already exist for today, return them
    if (existingGoals.length > 0) {
      return existingGoals
    }
    
    // Generate automatic goals for today
    const automaticGoals = await this.generateAutomaticGoals(userId)
    
    // Insert the goals into the database
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: createdGoals, error } = await (supabase as any)
      .from('daily_goals')
      .insert(automaticGoals)
      .select('*')
    
    if (error) {
      console.error('Error creating daily goals:', error)
      return []
    }
    
    return createdGoals || []
  }

  /**
   * Mark a daily goal as completed or incomplete
   */
  static async toggleGoalCompletion(goalId: string, completed: boolean): Promise<void> {
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('daily_goals')
      .update({ completed, updated_at: new Date().toISOString() })
      .eq('id', goalId)
    
    if (error) {
      console.error('Error updating goal completion:', error)
      throw error
    }
  }

  /**
   * Delete a daily goal
   */
  static async deleteGoal(goalId: string): Promise<void> {
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('daily_goals')
      .delete()
      .eq('id', goalId)
    
    if (error) {
      console.error('Error deleting goal:', error)
      throw error
    }
  }

  /**
   * Add a custom daily goal
   */
  static async addCustomGoal(userId: string, goalText: string, date?: Date): Promise<DailyGoal | null> {
    const targetDate = date || new Date()
    const dateString = format(targetDate, 'yyyy-MM-dd')
    
    const newGoal: NewDailyGoal = {
      user_id: userId,
      goal: goalText.trim(),
      date: dateString,
      completed: false
    }
    
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('daily_goals')
      .insert([newGoal])
      .select('*')
      .single()
    
    if (error) {
      console.error('Error adding custom goal:', error)
      throw error
    }
    
    return data
  }

  /**
   * Get daily goal completion stats for analytics
   */
  static async getGoalStats(userId: string, days: number = 30): Promise<{
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
  }> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)
    
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: goals, error } = await (supabase as any)
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true })
    
    if (error) {
      console.error('Error fetching goal stats:', error)
      return {
        totalGoals: 0,
        completedGoals: 0,
        completionRate: 0,
        streak: 0,
        dailyBreakdown: []
      }
    }
    
    const totalGoals = goals?.length || 0
    const completedGoals = goals?.filter((g: any) => g.completed).length || 0
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0
    
    // Calculate daily breakdown
    const dailyMap = new Map<string, { total: number; completed: number }>()
    
    goals?.forEach((goal: any) => {
      const date = goal.date
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { total: 0, completed: 0 })
      }
      const day = dailyMap.get(date)!
      day.total++
      if (goal.completed) {
        day.completed++
      }
    })
    
    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      total: stats.total,
      completed: stats.completed,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    }))
    
    // Calculate current streak
    let streak = 0
    const sortedDays = dailyBreakdown.sort((a, b) => b.date.localeCompare(a.date))
    
    for (const day of sortedDays) {
      if (day.completionRate === 100 && day.total > 0) {
        streak++
      } else {
        break
      }
    }
    
    return {
      totalGoals,
      completedGoals,
      completionRate,
      streak,
      dailyBreakdown: dailyBreakdown.sort((a, b) => a.date.localeCompare(b.date))
    }
  }
}