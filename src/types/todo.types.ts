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

export type TodoSortOption = 'created_at' | 'updated_at' | 'due_date' | 'work_date' | 'priority' | 'title' | 'completed'
export type SortDirection = 'asc' | 'desc'
export type FilterConnector = 'AND' | 'OR'

export interface ProjectFolder {
  id: string
  name: string
  projects: string[]
  color?: string
}

export interface AdvancedFilters {
  completed?: boolean
  tags?: {
    values: string[]
    connector: FilterConnector
  }
  projects?: {
    values: string[]
    connector: FilterConnector
  }
  projectFolders?: {
    values: string[]
    connector: FilterConnector
  }
  priority?: 1 | 2 | 3
  search?: string
}

// Legacy interface for backward compatibility
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