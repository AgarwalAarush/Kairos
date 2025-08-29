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