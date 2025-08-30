import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface DailyStats {
  date: string
  completed: number
  created: number
  completion_rate: number
}

export interface ProjectStats {
  project: string
  total: number
  completed: number
  completion_rate: number
  avg_completion_time_hours: number | null
}

export interface TagStats {
  tag: string
  total: number
  completed: number
  completion_rate: number
}

export interface WeeklyStats {
  week_start: string
  completed: number
  created: number
  completion_rate: number
}

export interface OverallStats {
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  completion_rate: number
  avg_completion_time_hours: number | null
  most_productive_day: string | null
  tasks_completed_today: number
  tasks_completed_this_week: number
  tasks_completed_this_month: number
}

export class AnalyticsService {
  static async getOverallStats(userId: string): Promise<OverallStats> {
    // Get overall task counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allTasks, error: tasksError } = await (supabase as any)
      .from('todos')
      .select('*')
      .eq('user_id', userId)

    if (tasksError) throw new Error(tasksError.message)

    const total_tasks = allTasks?.length || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completed_tasks = allTasks?.filter((t: any) => t.completed).length || 0
    const pending_tasks = total_tasks - completed_tasks
    const completion_rate = total_tasks > 0 ? (completed_tasks / total_tasks) * 100 : 0

    // Calculate average completion time
    // Use completed_at if available, otherwise fall back to updated_at for completed tasks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completedWithTimestamp = allTasks?.filter((t: any) => t.completed && (t.completed_at || t.updated_at) && t.created_at) || []
    let avg_completion_time_hours = null
    
    if (completedWithTimestamp.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalHours = completedWithTimestamp.reduce((sum: any, task: any) => {
        const created = new Date(task.created_at).getTime()
        const completed = new Date(task.completed_at || task.updated_at).getTime()
        return sum + (completed - created) / (1000 * 60 * 60) // Convert to hours
      }, 0)
      avg_completion_time_hours = totalHours / completedWithTimestamp.length
    }

    // Get today's stats
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasks_completed_today = allTasks?.filter((t: any) => {
      if (!t.completed) return false
      const completionTime = t.completed_at || t.updated_at
      return completionTime && completionTime >= todayStart && completionTime < todayEnd
    }).length || 0

    // Get this week's stats
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasks_completed_this_week = allTasks?.filter((t: any) => {
      if (!t.completed) return false
      const completionTime = t.completed_at || t.updated_at
      return completionTime && new Date(completionTime) >= weekStart
    }).length || 0

    // Get this month's stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasks_completed_this_month = allTasks?.filter((t: any) => {
      if (!t.completed) return false
      const completionTime = t.completed_at || t.updated_at
      return completionTime && completionTime >= monthStart
    }).length || 0

    // Find most productive day of week
    let most_productive_day = null
    if (completedWithTimestamp.length > 0) {
      const dayStats = new Array(7).fill(0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      completedWithTimestamp.forEach((task: any) => {
        const completionTime = task.completed_at || task.updated_at
        const day = new Date(completionTime).getDay()
        dayStats[day]++
      })
      const maxDay = dayStats.indexOf(Math.max(...dayStats))
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      most_productive_day = dayNames[maxDay]
    }

    return {
      total_tasks,
      completed_tasks,
      pending_tasks,
      completion_rate,
      avg_completion_time_hours,
      most_productive_day,
      tasks_completed_today,
      tasks_completed_this_week,
      tasks_completed_this_month
    }
  }

  static async getDailyStats(userId: string, days: number = 30): Promise<DailyStats[]> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Get all tasks within the date range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tasks, error } = await (supabase as any)
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())

    if (error) throw new Error(error.message)

    // Create daily stats
    const dailyStats: Record<string, { completed: number, created: number }> = {}
    
    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dailyStats[dateStr] = { completed: 0, created: 0 }
    }

    // Count created tasks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tasks?.forEach((task: any) => {
      const createdDate = new Date(task.created_at).toISOString().split('T')[0]
      if (dailyStats[createdDate]) {
        dailyStats[createdDate].created++
      }
    })

    // Count completed tasks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tasks?.forEach((task: any) => {
      if (task.completed) {
        const completionTime = task.completed_at || task.updated_at
        if (completionTime) {
          const completedDate = new Date(completionTime).toISOString().split('T')[0]
          if (dailyStats[completedDate]) {
            dailyStats[completedDate].completed++
          }
        }
      }
    })

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      completed: stats.completed,
      created: stats.created,
      completion_rate: stats.created > 0 ? (stats.completed / stats.created) * 100 : 0
    })).sort((a, b) => a.date.localeCompare(b.date))
  }

  static async getProjectStats(userId: string): Promise<ProjectStats[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tasks, error } = await (supabase as any)
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .not('project', 'is', null)

    if (error) throw new Error(error.message)

    const projectStats: Record<string, { total: number, completed: number, completion_times: number[] }> = {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tasks?.forEach((task: any) => {
      if (!task.project) return
      
      if (!projectStats[task.project]) {
        projectStats[task.project] = { total: 0, completed: 0, completion_times: [] }
      }
      
      projectStats[task.project].total++
      
      if (task.completed) {
        projectStats[task.project].completed++
        
        const completionTime = task.completed_at || task.updated_at
        if (completionTime && task.created_at) {
          const created = new Date(task.created_at).getTime()
          const completed = new Date(completionTime).getTime()
          const hours = (completed - created) / (1000 * 60 * 60)
          projectStats[task.project].completion_times.push(hours)
        }
      }
    })

    return Object.entries(projectStats).map(([project, stats]) => ({
      project,
      total: stats.total,
      completed: stats.completed,
      completion_rate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      avg_completion_time_hours: stats.completion_times.length > 0 
        ? stats.completion_times.reduce((a, b) => a + b, 0) / stats.completion_times.length 
        : null
    })).sort((a, b) => b.total - a.total)
  }

  static async getTagStats(userId: string): Promise<TagStats[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tasks, error } = await (supabase as any)
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .not('tags', 'is', null)

    if (error) throw new Error(error.message)

    const tagStats: Record<string, { total: number, completed: number }> = {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tasks?.forEach((task: any) => {
      if (!task.tags || task.tags.length === 0) return
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      task.tags.forEach((tag: any) => {
        if (!tagStats[tag]) {
          tagStats[tag] = { total: 0, completed: 0 }
        }
        
        tagStats[tag].total++
        
        if (task.completed) {
          tagStats[tag].completed++
        }
      })
    })

    return Object.entries(tagStats).map(([tag, stats]) => ({
      tag,
      total: stats.total,
      completed: stats.completed,
      completion_rate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    })).sort((a, b) => b.total - a.total)
  }

  static async getWeeklyStats(userId: string, weeks: number = 12): Promise<WeeklyStats[]> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - (weeks * 7))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tasks, error } = await (supabase as any)
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())

    if (error) throw new Error(error.message)

    const weeklyStats: Record<string, { completed: number, created: number }> = {}

    // Initialize weeks
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate)
      weekStart.setDate(startDate.getDate() + (i * 7))
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0]
      weeklyStats[weekKey] = { completed: 0, created: 0 }
    }

    // Count created tasks by week
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tasks?.forEach((task: any) => {
      const createdDate = new Date(task.created_at)
      const weekStart = new Date(createdDate)
      weekStart.setDate(createdDate.getDate() - createdDate.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (weeklyStats[weekKey]) {
        weeklyStats[weekKey].created++
      }
    })

    // Count completed tasks by week
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tasks?.forEach((task: any) => {
      if (task.completed) {
        const completionTime = task.completed_at || task.updated_at
        if (completionTime) {
          const completedDate = new Date(completionTime)
          const weekStart = new Date(completedDate)
          weekStart.setDate(completedDate.getDate() - completedDate.getDay())
          const weekKey = weekStart.toISOString().split('T')[0]
          
          if (weeklyStats[weekKey]) {
            weeklyStats[weekKey].completed++
          }
        }
      }
    })

    return Object.entries(weeklyStats).map(([week_start, stats]) => ({
      week_start,
      completed: stats.completed,
      created: stats.created,
      completion_rate: stats.created > 0 ? (stats.completed / stats.created) * 100 : 0
    })).sort((a, b) => a.week_start.localeCompare(b.week_start))
  }
}