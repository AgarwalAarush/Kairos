import { createClient } from '@/lib/supabase/client'
import { NewPomodoroSession, PomodoroSession, PomodoroSessionUpdate } from '@/types/database.types'

export interface PomodoroStatistics {
  totalStudyTime: number // in minutes
  todayStudyTime: number
  weekStudyTime: number
  monthStudyTime: number
  totalSessions: number
  completedSessions: number
  interruptedSessions: number
  averageWorkDuration: number
  averageBreakDuration: number
  longestStreak: number
  currentStreak: number
}

export class PomodoroService {
  private static supabase = createClient()

  static async createSession(sessionData: Omit<NewPomodoroSession, 'user_id'>, userId: string): Promise<PomodoroSession | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase as any)
        .from('pomodoro_sessions')
        .insert({
          ...sessionData,
          user_id: userId,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Pomodoro sessions table not found, skipping session creation')
          return null
        }
        console.error('Error creating pomodoro session:', error)
        throw new Error('Failed to create pomodoro session')
      }

      return data
    } catch (error) {
      console.warn('Failed to create pomodoro session:', error)
      return null
    }
  }

  static async updateSession(id: string, updates: PomodoroSessionUpdate): Promise<PomodoroSession | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase as any)
        .from('pomodoro_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Pomodoro sessions table not found, skipping session update')
          return null
        }
        console.error('Error updating pomodoro session:', error)
        throw new Error('Failed to update pomodoro session')
      }

      return data
    } catch (error) {
      console.warn('Failed to update pomodoro session:', error)
      return null
    }
  }

  static async getSessions(userId: string): Promise<PomodoroSession[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase as any)
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Pomodoro sessions table not found, returning empty data')
          return []
        }
        console.error('Error fetching pomodoro sessions:', error)
        throw new Error('Failed to fetch pomodoro sessions')
      }

      return data || []
    } catch (error) {
      console.warn('Pomodoro sessions not available:', error)
      return []
    }
  }

  static async getStatistics(userId: string): Promise<PomodoroStatistics> {
    const sessions = await this.getSessions(userId)
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Filter sessions by time periods
    const todaySessions = sessions.filter(s => new Date(s.created_at) >= today)
    const weekSessions = sessions.filter(s => new Date(s.created_at) >= weekAgo)
    const monthSessions = sessions.filter(s => new Date(s.created_at) >= monthAgo)
    
    // Calculate study time (only completed work sessions)
    const calculateStudyTime = (sessionList: PomodoroSession[]) => {
      return sessionList
        .filter(s => s.session_type === 'work' && s.completed)
        .reduce((total, s) => total + s.duration_minutes, 0)
    }

    const totalStudyTime = calculateStudyTime(sessions)
    const todayStudyTime = calculateStudyTime(todaySessions)
    const weekStudyTime = calculateStudyTime(weekSessions)
    const monthStudyTime = calculateStudyTime(monthSessions)

    // Calculate session counts
    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.completed).length
    const interruptedSessions = sessions.filter(s => s.interrupted).length

    // Calculate averages
    const workSessions = sessions.filter(s => s.session_type === 'work' && s.completed)
    const breakSessions = sessions.filter(s => s.session_type !== 'work' && s.completed)
    
    const averageWorkDuration = workSessions.length > 0 
      ? workSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / workSessions.length
      : 0

    const averageBreakDuration = breakSessions.length > 0
      ? breakSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / breakSessions.length
      : 0

    // Calculate streaks (consecutive completed work sessions)
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Sort sessions by date for streak calculation
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    for (const session of sortedSessions) {
      if (session.session_type === 'work') {
        if (session.completed && !session.interrupted) {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          tempStreak = 0
        }
      }
    }

    // Calculate current streak (from most recent sessions)
    const recentWorkSessions = sortedSessions
      .filter(s => s.session_type === 'work')
      .reverse()

    for (const session of recentWorkSessions) {
      if (session.completed && !session.interrupted) {
        currentStreak++
      } else {
        break
      }
    }

    return {
      totalStudyTime,
      todayStudyTime,
      weekStudyTime,
      monthStudyTime,
      totalSessions,
      completedSessions,
      interruptedSessions,
      averageWorkDuration: Math.round(averageWorkDuration * 10) / 10,
      averageBreakDuration: Math.round(averageBreakDuration * 10) / 10,
      longestStreak,
      currentStreak
    }
  }
}