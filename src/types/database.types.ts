export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          tags: string[]
          project: string | null
          priority: 1 | 2 | 3 | null
          due_date: string | null
          work_date: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          tags?: string[]
          project?: string | null
          priority?: 1 | 2 | 3 | null
          due_date?: string | null
          work_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          tags?: string[]
          project?: string | null
          priority?: 1 | 2 | 3 | null
          due_date?: string | null
          work_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pomodoro_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: 'work' | 'break' | 'longBreak'
          duration_minutes: number
          completed: boolean
          interrupted: boolean
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_type: 'work' | 'break' | 'longBreak'
          duration_minutes: number
          completed?: boolean
          interrupted?: boolean
          started_at: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: 'work' | 'break' | 'longBreak'
          duration_minutes?: number
          completed?: boolean
          interrupted?: boolean
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
      }
      user_integrations: {
        Row: {
          id: string
          user_id: string
          integration_type: 'google_calendar' | 'outlook' | 'apple_calendar'
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          scope: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          integration_type: 'google_calendar' | 'outlook' | 'apple_calendar'
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          scope?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          integration_type?: 'google_calendar' | 'outlook' | 'apple_calendar'
          access_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          scope?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_goals: {
        Row: {
          id: string
          user_id: string
          goal: string
          date: string
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal: string
          date: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal?: string
          date?: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      long_term_goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          target_date: string
          progress: number
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          target_date: string
          progress?: number
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          target_date?: string
          progress?: number
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          frequency: 'daily' | 'weekly'
          target_count: number
          color: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          frequency?: 'daily' | 'weekly'
          target_count?: number
          color?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          frequency?: 'daily' | 'weekly'
          target_count?: number
          color?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      habit_completions: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          date: string
          count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_id: string
          date: string
          count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string
          date?: string
          count?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Todo = Database['public']['Tables']['todos']['Row']
export type NewTodo = Database['public']['Tables']['todos']['Insert']
export type TodoUpdate = Database['public']['Tables']['todos']['Update']

export type PomodoroSession = Database['public']['Tables']['pomodoro_sessions']['Row']
export type NewPomodoroSession = Database['public']['Tables']['pomodoro_sessions']['Insert']
export type PomodoroSessionUpdate = Database['public']['Tables']['pomodoro_sessions']['Update']

export type UserIntegration = Database['public']['Tables']['user_integrations']['Row']
export type NewUserIntegration = Database['public']['Tables']['user_integrations']['Insert']
export type UserIntegrationUpdate = Database['public']['Tables']['user_integrations']['Update']

export type DailyGoal = Database['public']['Tables']['daily_goals']['Row']
export type NewDailyGoal = Database['public']['Tables']['daily_goals']['Insert']
export type DailyGoalUpdate = Database['public']['Tables']['daily_goals']['Update']

export type LongTermGoal = Database['public']['Tables']['long_term_goals']['Row']
export type NewLongTermGoal = Database['public']['Tables']['long_term_goals']['Insert']
export type LongTermGoalUpdate = Database['public']['Tables']['long_term_goals']['Update']

export type Habit = Database['public']['Tables']['habits']['Row']
export type NewHabit = Database['public']['Tables']['habits']['Insert']
export type HabitUpdate = Database['public']['Tables']['habits']['Update']

export type HabitCompletion = Database['public']['Tables']['habit_completions']['Row']
export type NewHabitCompletion = Database['public']['Tables']['habit_completions']['Insert']
export type HabitCompletionUpdate = Database['public']['Tables']['habit_completions']['Update']