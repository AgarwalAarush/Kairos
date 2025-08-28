'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Todo } from '@/types/todo.types'

interface TaskSearchProps {
  todos: Todo[]
  selectedTask: Todo | null
  onTaskSelect: (task: Todo) => void
  onTaskDeselect: () => void
}

export default function TaskSearch({ todos, selectedTask, onTaskSelect, onTaskDeselect }: TaskSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Filter uncompleted todos based on search query
  const filteredTodos = todos.filter(todo => 
    !todo.completed && 
    (todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     todo.project?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     todo.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  ).slice(0, 5) // Limit to 5 results

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTaskSelect = (task: Todo) => {
    onTaskSelect(task)
    setSearchQuery('')
    setIsOpen(false)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setIsOpen(value.length > 0)
  }

  return (
    <div className="space-y-4">
      {/* Selected Task Card */}
      {selectedTask && (
        <Card 
          className="p-3 bg-primary/5 border-primary/20 relative transition-all duration-200"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {isHovering && (
            <button
              onClick={onTaskDeselect}
              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/90 transition-colors shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <div className="pr-4">
            <h4 className="font-medium text-sm text-foreground mb-1">
              Currently Working On
            </h4>
            <p className="text-sm text-muted-foreground font-medium">
              {selectedTask.title}
            </p>
            {selectedTask.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTask.description}
              </p>
            )}
            {(selectedTask.project || (selectedTask.tags && selectedTask.tags.length > 0)) && (
              <div className="flex gap-2 mt-2 text-xs">
                {selectedTask.project && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {selectedTask.project}
                  </span>
                )}
                {selectedTask.tags?.slice(0, 2).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Search Bar */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks to work on..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery.length > 0 && setIsOpen(true)}
            className="pl-10 pr-4"
          />
        </div>

        {/* Search Results Dropdown */}
        {isOpen && searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
            {filteredTodos.length > 0 ? (
              <div className="py-1">
                {filteredTodos.map((todo) => (
                  <button
                    key={todo.id}
                    onClick={() => handleTaskSelect(todo)}
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <div className="font-medium text-sm">{todo.title}</div>
                    {todo.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {todo.description.length > 60 
                          ? `${todo.description.substring(0, 60)}...` 
                          : todo.description}
                      </div>
                    )}
                    {(todo.project || (todo.tags && todo.tags.length > 0)) && (
                      <div className="flex gap-1 mt-1 text-xs">
                        {todo.project && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {todo.project}
                          </span>
                        )}
                        {todo.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No tasks found matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}