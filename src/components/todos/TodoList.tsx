'use client'

import { Todo } from '@/types/todo.types'
import TodoCard from './TodoCard'

interface TodoListProps {
  todos: Todo[]
  onToggleComplete: (id: string, completed: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string, updates: Partial<Todo>) => Promise<void>
  isLoading?: boolean
  // Bulk selection props
  showSelectionCheckbox?: boolean
  selectedTodos?: Set<string>
  onSelectionChange?: (id: string, selected: boolean) => void
}

export default function TodoList({ 
  todos, 
  onToggleComplete, 
  onDelete, 
  onEdit, 
  isLoading = false,
  showSelectionCheckbox = false,
  selectedTodos,
  onSelectionChange
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No todos yet</p>
        <p>Create your first todo above to get started!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {todos.map((todo) => (
        <TodoCard
          key={todo.id}
          todo={todo}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onEdit={onEdit}
          disabled={isLoading}
          showSelectionCheckbox={showSelectionCheckbox}
          isSelected={selectedTodos?.has(todo.id) || false}
          onSelectionChange={onSelectionChange}
        />
      ))}
    </div>
  )
}