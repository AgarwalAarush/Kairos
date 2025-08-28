import { Todo, NewTodo, TodoUpdate } from './database.types'

export type { Todo, NewTodo, TodoUpdate }

export interface TodoFormData {
  title: string
  description?: string
  tags?: string[]
  project?: string
  priority?: 1 | 2 | 3
  due_date?: Date
  work_date?: Date
}

export interface ParsedTodoData {
  title: string
  tags: string[]
  project?: string
  priority?: 1 | 2 | 3
  due_date?: Date
  work_date?: Date
  extractedDates?: {
    text: string
    date: Date
    type: 'due' | 'work' | 'general'
  }[]
}

export type TodoSortOption = 'created_at' | 'due_date' | 'priority' | 'title' | 'completed'
export type SortDirection = 'asc' | 'desc'

export interface TodoFilters {
  completed?: boolean
  tags?: string[]
  project?: string
  priority?: 1 | 2 | 3
  search?: string
}

export interface TodoSort {
  field: TodoSortOption
  direction: SortDirection
}