import { createClient } from '@/lib/supabase/client'
import { Habit, NewHabit, HabitCompletion, NewHabitCompletion } from '@/types/database.types'
import { format } from 'date-fns'

export class HabitsService {
  /**
   * Get all active habits for a user
   */
  static async getUserHabits(userId: string): Promise<Habit[]> {
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: habits, error } = await (supabase as any)
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching habits:', error?.message || 'Unknown error', error)
      return []
    }
    
    return habits || []
  }

  /**
   * Create a new habit
   */
  static async createHabit(habitData: NewHabit): Promise<Habit | null> {
    const supabase = createClient()
    
    const newHabit: NewHabit = {
      ...habitData,
      frequency: habitData.frequency || 'daily',
      target_count: habitData.target_count || 1,
      active: true
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('habits')
      .insert([newHabit])
      .select('*')
      .single()
    
    if (error) {
      console.error('Error creating habit:', error?.message || 'Unknown error', error)
      throw error
    }
    
    return data
  }

  /**
   * Update an existing habit
   */
  static async updateHabit(habitId: string, updates: Partial<Habit>): Promise<void> {
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('habits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', habitId)
    
    if (error) {
      console.error('Error updating habit:', error?.message || 'Unknown error', error)
      throw error
    }
  }

  /**
   * Delete a habit (mark as inactive)
   */
  static async deleteHabit(habitId: string): Promise<void> {
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('habits')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', habitId)
    
    if (error) {
      console.error('Error deleting habit:', error?.message || 'Unknown error', error)
      throw error
    }
  }

  /**
   * Get habit completions for today
   */
  static async getTodayCompletions(userId: string, date?: Date): Promise<HabitCompletion[]> {
    const targetDate = date || new Date()
    const dateString = format(targetDate, 'yyyy-MM-dd')
    const supabase = createClient()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: completions, error } = await (supabase as any)
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateString)
    
    if (error) {
      console.error('Error fetching habit completions:', error?.message || 'Unknown error', error)
      return []
    }
    
    return completions || []
  }

  /**
   * Record habit completion
   */
  static async recordCompletion(userId: string, habitId: string, date?: Date, count: number = 1): Promise<void> {
    const targetDate = date || new Date()
    const dateString = format(targetDate, 'yyyy-MM-dd')
    const supabase = createClient()
    
    // Check if completion already exists for this date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (supabase as any)
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('date', dateString)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing completion:', fetchError?.message || 'Unknown error', fetchError)
      throw fetchError
    }
    
    if (existing) {
      // Update existing completion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('habit_completions')
        .update({ count: existing.count + count })
        .eq('id', existing.id)
      
      if (error) {
        console.error('Error updating habit completion:', error?.message || 'Unknown error', error)
        throw error
      }
    } else {
      // Create new completion
      const newCompletion: NewHabitCompletion = {
        user_id: userId,
        habit_id: habitId,
        date: dateString,
        count
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('habit_completions')
        .insert([newCompletion])
      
      if (error) {
        console.error('Error creating habit completion:', error?.message || 'Unknown error', error)
        throw error
      }
    }
  }

  /**
   * Get habit statistics for analytics
   */
  static async getHabitStats(userId: string, days: number = 30): Promise<{
    totalHabits: number
    activeStreak: Record<string, number>
    completionRate: Record<string, number>
    dailyBreakdown: Array<{
      date: string
      habits: Record<string, { completed: number, target: number }>
    }>
  }> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)
    
    const supabase = createClient()
    
    // Get user habits
    const habits = await this.getUserHabits(userId)
    
    // Get completions for the date range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: completions, error } = await (supabase as any)
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true })
    
    if (error) {
      console.error('Error fetching habit stats:', error?.message || 'Unknown error', error)
      return {
        totalHabits: habits.length,
        activeStreak: {},
        completionRate: {},
        dailyBreakdown: []
      }
    }
    
    // Process data for analytics
    const habitMap = new Map<string, Habit>()
    habits.forEach(habit => habitMap.set(habit.id, habit))
    
    // Calculate completion rates and streaks
    const completionRate: Record<string, number> = {}
    const activeStreak: Record<string, number> = {}
    
    habits.forEach(habit => {
      const habitCompletions = completions?.filter((c: { habit_id: string }) => c.habit_id === habit.id) || []
      const daysWithCompletions = new Set(habitCompletions.map((c: { date: string }) => c.date))
      
      // Calculate completion rate
      completionRate[habit.id] = (daysWithCompletions.size / days) * 100
      
      // Calculate current streak (from today backwards)
      let streak = 0
      const today = new Date()
      for (let i = 0; i < days; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() - i)
        const dateString = format(checkDate, 'yyyy-MM-dd')
        
        if (daysWithCompletions.has(dateString)) {
          streak++
        } else {
          break
        }
      }
      activeStreak[habit.id] = streak
    })
    
    // Create daily breakdown
    const dailyBreakdown: Array<{
      date: string
      habits: Record<string, { completed: number, target: number }>
    }> = []
    
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(endDate)
      checkDate.setDate(endDate.getDate() - i)
      const dateString = format(checkDate, 'yyyy-MM-dd')
      
      const dayHabits: Record<string, { completed: number, target: number }> = {}
      
      habits.forEach(habit => {
        const dayCompletion = completions?.find((c: { habit_id: string; date: string }) => 
          c.habit_id === habit.id && c.date === dateString
        )
        
        dayHabits[habit.id] = {
          completed: dayCompletion?.count || 0,
          target: habit.target_count
        }
      })
      
      dailyBreakdown.unshift({
        date: dateString,
        habits: dayHabits
      })
    }
    
    return {
      totalHabits: habits.length,
      activeStreak,
      completionRate,
      dailyBreakdown
    }
  }
}