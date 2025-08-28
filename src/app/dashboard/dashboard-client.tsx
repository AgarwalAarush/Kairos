'use client'

import { useState, useEffect, useMemo } from 'react'
import { signOut } from '@/lib/auth'
import { TodoService } from '@/lib/services/todoService'
import { Button } from '@/components/ui/button'
import CreateTodoForm from '@/components/todos/CreateTodoForm'
import TodoList from '@/components/todos/TodoList'
import TodoFiltersComponent from '@/components/todos/TodoFilters'
import BulkActionToolbar from '@/components/todos/BulkActionToolbar'
import SetupInstructions from '@/components/SetupInstructions'
import { ThemeToggle } from '@/components/theme-toggle'
import { Todo, TodoFormData, TodoFilters, TodoSort } from '@/types/todo.types'
import { Loader2, RefreshCw, CheckSquare } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

interface DashboardClientProps {
  user: User
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [filters, setFilters] = useState<TodoFilters>({})
  const [sort, setSort] = useState<TodoSort>({ field: 'created_at', direction: 'desc' })
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set())
  const [bulkActionMode, setBulkActionMode] = useState(false)

  // Enable bulk action mode when todos are selected
  useEffect(() => {
    setBulkActionMode(selectedTodos.size > 0)
  }, [selectedTodos.size])

  // Load todos on mount only (filtering is done client-side)
  useEffect(() => {
    loadTodos()
  }, [])

  const loadTodos = async () => {
    try {
      setIsLoading(true)
      setHasError(false)
      setErrorMessage('')
      const fetchedTodos = await TodoService.getTodos(user.id)
      setTodos(fetchedTodos)
    } catch (error) {
      console.error('Error loading todos:', error)
      setHasError(true)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load todos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTodo = async (todoData: TodoFormData) => {
    try {
      setIsCreating(true)
      const newTodo = await TodoService.createTodo(todoData, user.id)
      setTodos(prev => [newTodo, ...prev])
      toast.success('Todo created successfully!')
    } catch (error) {
      console.error('Error creating todo:', error)
      toast.error('Failed to create todo. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      setIsUpdating(true)
      const updatedTodo = await TodoService.toggleComplete(id, completed)
      setTodos(prev => prev.map(todo => 
        todo.id === id ? updatedTodo : todo
      ))
      toast.success(completed ? 'Todo completed!' : 'Todo marked as pending')
    } catch (error) {
      console.error('Error toggling todo:', error)
      toast.error('Failed to update todo')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteTodo = async (id: string) => {
    try {
      setIsUpdating(true)
      await TodoService.deleteTodo(id)
      setTodos(prev => prev.filter(todo => todo.id !== id))
      toast.success('Todo deleted successfully')
    } catch (error) {
      console.error('Error deleting todo:', error)
      toast.error('Failed to delete todo')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditTodo = async (id: string, updates: Partial<Todo>) => {
    try {
      setIsUpdating(true)
      const updatedTodo = await TodoService.updateTodo(id, updates)
      setTodos(prev => prev.map(todo => 
        todo.id === id ? updatedTodo : todo
      ))
      toast.success('Todo updated successfully')
    } catch (error) {
      console.error('Error updating todo:', error)
      toast.error('Failed to update todo')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      setIsSigningOut(false)
    }
  }

  // Bulk operations
  const handleSelectionChange = (todoId: string, selected: boolean) => {
    setSelectedTodos(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(todoId)
      } else {
        newSet.delete(todoId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const allIds = new Set(filteredTodos.map(todo => todo.id))
    setSelectedTodos(allIds)
  }

  const handleDeselectAll = () => {
    setSelectedTodos(new Set())
  }

  const handleCancelSelection = () => {
    setSelectedTodos(new Set())
    setBulkActionMode(false)
  }

  const handleBulkComplete = async () => {
    try {
      setIsUpdating(true)
      const selectedTodoIds = Array.from(selectedTodos)
      
      // Update all selected todos to completed
      await Promise.all(
        selectedTodoIds.map(id => TodoService.toggleComplete(id, true))
      )
      
      // Update local state
      setTodos(prev => 
        prev.map(todo => 
          selectedTodoIds.includes(todo.id) 
            ? { ...todo, completed: true }
            : todo
        )
      )
      
      toast.success(`${selectedTodoIds.length} todos completed!`)
      handleCancelSelection()
    } catch (error) {
      console.error('Error bulk completing todos:', error)
      toast.error('Failed to complete some todos')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBulkDelete = async () => {
    try {
      setIsUpdating(true)
      const selectedTodoIds = Array.from(selectedTodos)
      
      // Delete all selected todos
      await Promise.all(
        selectedTodoIds.map(id => TodoService.deleteTodo(id))
      )
      
      // Update local state
      setTodos(prev => 
        prev.filter(todo => !selectedTodoIds.includes(todo.id))
      )
      
      toast.success(`${selectedTodoIds.length} todos deleted!`)
      handleCancelSelection()
    } catch (error) {
      console.error('Error bulk deleting todos:', error)
      toast.error('Failed to delete some todos')
    } finally {
      setIsUpdating(false)
    }
  }

  // Compute available tags and projects for filtering
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    todos.forEach(todo => {
      if (todo.tags) {
        todo.tags.forEach(tag => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [todos])

  const availableProjects = useMemo(() => {
    const projectSet = new Set<string>()
    todos.forEach(todo => {
      if (todo.project) {
        projectSet.add(todo.project)
      }
    })
    return Array.from(projectSet).sort()
  }, [todos])

  // Filter and sort todos client-side for better UX
  const filteredTodos = useMemo(() => {
    let filtered = [...todos]

    // Apply filters
    if (filters.completed !== undefined) {
      filtered = filtered.filter(todo => todo.completed === filters.completed)
    }

    if (filters.tags?.length) {
      filtered = filtered.filter(todo => 
        todo.tags?.some(tag => filters.tags!.includes(tag))
      )
    }

    if (filters.project) {
      filtered = filtered.filter(todo => todo.project === filters.project)
    }

    if (filters.priority) {
      filtered = filtered.filter(todo => todo.priority === filters.priority)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      
      if (searchLower === 'overdue') {
        // Special case for overdue filter
        const today = new Date()
        today.setHours(23, 59, 59, 999) // End of today
        filtered = filtered.filter(todo =>
          todo.due_date && 
          new Date(todo.due_date) < today && 
          !todo.completed
        )
      } else {
        // Regular text search
        filtered = filtered.filter(todo =>
          todo.title.toLowerCase().includes(searchLower) ||
          todo.description?.toLowerCase().includes(searchLower)
        )
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sort
      let aVal: any = a[field]
      let bVal: any = b[field]

      // Handle null/undefined values
      if (aVal === null || aVal === undefined) aVal = direction === 'asc' ? '' : 'zzz'
      if (bVal === null || bVal === undefined) bVal = direction === 'asc' ? '' : 'zzz'

      // Convert dates to timestamps for comparison
      if (field === 'created_at' || field === 'updated_at' || field === 'due_date' || field === 'work_date') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }

      // Handle priority (1 = high, 3 = low, so reverse for intuitive sorting)
      if (field === 'priority') {
        aVal = aVal ? 4 - aVal : 999 // Reverse priority and put nulls last
        bVal = bVal ? 4 - bVal : 999
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [todos, filters, sort])

  const completedCount = filteredTodos.filter(todo => todo.completed).length
  const totalCount = todos.length
  const filteredCount = filteredTodos.length

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const isTyping = document.activeElement?.tagName === 'INPUT' || 
                      document.activeElement?.tagName === 'TEXTAREA'
      
      if (isTyping) return

      switch (e.key) {
        case 'Escape':
          if (bulkActionMode) {
            e.preventDefault()
            handleCancelSelection()
          }
          break
        case 'Delete':
          if (bulkActionMode && selectedTodos.size > 0) {
            e.preventDefault()
            handleBulkDelete()
          }
          break
        case 'Enter':
          if (bulkActionMode && selectedTodos.size > 0) {
            e.preventDefault()
            handleBulkComplete()
          }
          break
        case 'a':
          if ((e.ctrlKey || e.metaKey) && filteredTodos.length > 0) {
            e.preventDefault()
            handleSelectAll()
          }
          break
        case 'd':
          if ((e.ctrlKey || e.metaKey) && selectedTodos.size > 0) {
            e.preventDefault()
            handleDeselectAll()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [bulkActionMode, selectedTodos.size, filteredTodos.length, handleCancelSelection, handleBulkDelete, handleBulkComplete, handleSelectAll, handleDeselectAll])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                Hey {user.user_metadata?.name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-muted-foreground">
                {totalCount > 0 ? (
                  `${completedCount} of ${filteredCount} todos completed`
                ) : (
                  "Let's get things done!"
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {hasError && (
                <Button
                  onClick={loadTodos}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              )}
              <ThemeToggle />
              <Button
                onClick={handleSignOut}
                disabled={isSigningOut}
                variant="outline"
                size="sm"
              >
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {hasError ? (
          <SetupInstructions />
        ) : (
          <>
            <CreateTodoForm 
              onSubmit={handleCreateTodo} 
              isLoading={isCreating}
            />

            {!isLoading && !hasError && totalCount > 0 && (
              <>
                <TodoFiltersComponent
                  filters={filters}
                  sort={sort}
                  availableTags={availableTags}
                  availableProjects={availableProjects}
                  onFiltersChange={setFilters}
                  onSortChange={setSort}
                  totalCount={totalCount}
                  filteredCount={filteredCount}
                />
                
                {!bulkActionMode && filteredCount > 0 && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkActionMode(true)}
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Select Multiple
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading your todos...</span>
          </div>
        ) : hasError ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg font-medium">Unable to load todos</p>
            <p className="text-sm mt-1">{errorMessage}</p>
            <p className="text-sm mt-2">Please complete the setup steps above.</p>
          </div>
        ) : (
          <>
            <TodoList
              todos={filteredTodos}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteTodo}
              onEdit={handleEditTodo}
              isLoading={isUpdating}
              showSelectionCheckbox={bulkActionMode}
              selectedTodos={selectedTodos}
              onSelectionChange={handleSelectionChange}
            />
            
            <BulkActionToolbar
              selectedCount={selectedTodos.size}
              totalCount={filteredCount}
              onBulkComplete={handleBulkComplete}
              onBulkDelete={handleBulkDelete}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onCancel={handleCancelSelection}
              isLoading={isUpdating}
            />
          </>
        )}
      </main>
    </div>
  )
}