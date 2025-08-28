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