import { createClient } from '@/lib/supabase/client'
import { Todo, NewTodo, TodoUpdate, TodoFilters, TodoSort } from '@/types/todo.types'

const supabase = createClient()

export class TodoService {
  static async getTodos(userId: string, filters?: TodoFilters, sort?: TodoSort): Promise<Todo[]> {
    let query = (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('todos') as any)
      .select('*')
      .eq('user_id', userId)

    // Apply filters
    if (filters?.completed !== undefined) {
      query = query.eq('completed', filters.completed)
    }
    
    if (filters?.tags?.length) {
      query = query.overlaps('tags', filters.tags)
    }
    
    if (filters?.project) {
      query = query.eq('project', filters.project)
    }
    
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }
    
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })
    } else {
      // Default sort by created_at desc
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching todos:', error)
      
      // Handle missing table gracefully
      if (error.message?.includes('table') && error.message?.includes('todos')) {
        console.warn('Todos table not found - please run the database schema')
        return []
      }
      
      throw new Error(error.message || 'Failed to fetch todos')
    }

    return data || []
  }

  static async createTodo(todoData: Omit<NewTodo, 'user_id'>, userId: string): Promise<Todo> {
    const insertPayload: NewTodo = {
      ...todoData,
      user_id: userId,
    }

    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('todos') as any)
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('Error creating todo:', error)
      throw new Error(error.message)
    }

    return data
  }

  static async updateTodo(id: string, updates: TodoUpdate, userId: string): Promise<Todo> {
    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('todos') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating todo:', error)
      throw new Error(error.message || 'Failed to update todo')
    }

    return data
  }

  static async deleteTodo(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting todo:', error)
      throw new Error(error.message || 'Failed to delete todo')
    }
  }

  static async toggleComplete(id: string, completed: boolean, userId: string): Promise<Todo> {
    // Note: completed_at functionality disabled until database migration is run
    // To enable completed_at tracking, run: supabase/migration_add_completed_at.sql
    return this.updateTodo(id, { completed }, userId)
  }

  static async getUniqueTags(userId: string): Promise<string[]> {
    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('todos') as any)
      .select('tags')
      .eq('user_id', userId)
      .not('tags', 'is', null)

    if (error) {
      console.error('Error fetching tags:', error)
      throw new Error(error.message)
    }

    // Flatten and deduplicate tags
    const allTags: string[] = data?.flatMap((row: { tags: string[] | null }) => row.tags || []) || []
    return [...new Set(allTags)].sort()
  }

  static async getUniqueProjects(userId: string): Promise<string[]> {
    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('todos') as any)
      .select('project')
      .eq('user_id', userId)
      .not('project', 'is', null)

    if (error) {
      console.error('Error fetching projects:', error)
      throw new Error(error.message)
    }

    // Deduplicate projects
    const projects = data?.map((row: { project: string | null }) => row.project).filter(Boolean) as string[]
    return [...new Set(projects)].sort()
  }
}