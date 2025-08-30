'use client'

import { useState, useEffect, useRef } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState<Todo[][]>([[], []])
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setColumns(mobile ? [todos] : [[], []])
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [todos])

  // Distribute todos into columns for better balance on desktop
  useEffect(() => {
    if (isMobile) {
      setColumns([todos])
      return
    }

    // Simple alternating distribution for now - this gives better balance than CSS columns
    const col1: Todo[] = []
    const col2: Todo[] = []
    
    todos.forEach((todo, index) => {
      if (index % 2 === 0) {
        col1.push(todo)
      } else {
        col2.push(todo)
      }
    })
    
    setColumns([col1, col2])
  }, [todos, isMobile])

  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No todos yet</p>
        <p>Create your first todo above to get started!</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-row'}`}
    >
      {columns.map((columnTodos, columnIndex) => (
        <div key={columnIndex} className={`flex flex-col gap-4 ${isMobile ? 'w-full' : 'flex-1'}`}>
          {columnTodos.map((todo) => (
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
      ))}
    </div>
  )
}