'use client'

import { useState, useEffect } from 'react'
import { TodoFilters, TodoSort, TodoSortOption } from '@/types/todo.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { 
  X, 
  Search, 
  SortAsc, 
  SortDesc,
  Hash,
  AtSign
} from 'lucide-react'

interface TodoFiltersProps {
  filters: TodoFilters
  sort: TodoSort
  availableTags: string[]
  availableProjects: string[]
  onFiltersChange: (filters: TodoFilters) => void
  onSortChange: (sort: TodoSort) => void
  totalCount: number
  filteredCount: number
}

export default function TodoFiltersComponent({
  filters,
  sort,
  availableTags,
  availableProjects,
  onFiltersChange,
  onSortChange,
  totalCount,
  filteredCount
}: TodoFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '')

  // Debounced search
  useEffect(() => {
    const debounce = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchTerm || undefined })
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = !!(
    filters.completed !== undefined ||
    filters.tags?.length ||
    filters.project ||
    filters.priority ||
    filters.search
  )

  const clearAllFilters = () => {
    setSearchTerm('')
    onFiltersChange({})
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = filters.tags?.filter(tag => tag !== tagToRemove)
    onFiltersChange({
      ...filters,
      tags: newTags?.length ? newTags : undefined
    })
  }

  const addTag = (tag: string) => {
    const currentTags = filters.tags || []
    if (!currentTags.includes(tag)) {
      onFiltersChange({
        ...filters,
        tags: [...currentTags, tag]
      })
    }
  }

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border mb-6 animate-fade-in">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select
            value={`${sort.field}-${sort.direction}`}
            onValueChange={(value) => {
              const [field, direction] = value.split('-') as [string, 'asc' | 'desc']
              onSortChange({ field: field as TodoSortOption, direction })
            }}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                {sort.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
              <SelectItem value="priority-asc">Priority High-Low</SelectItem>
              <SelectItem value="priority-desc">Priority Low-High</SelectItem>
              <SelectItem value="due_date-asc">Due Date (Soon First)</SelectItem>
              <SelectItem value="due_date-desc">Due Date (Late First)</SelectItem>
              <SelectItem value="work_date-asc">Work Date (Soon First)</SelectItem>
              <SelectItem value="work_date-desc">Work Date (Late First)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Options Row */}
      <div className="flex flex-wrap gap-2">
        {/* Completion Status Filter */}
        <Select
          value={filters.completed === undefined ? 'all' : filters.completed ? 'completed' : 'pending'}
          onValueChange={(value) => {
            const completed = value === 'all' ? undefined : value === 'completed'
            onFiltersChange({ ...filters, completed })
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filters.priority?.toString() || 'all'}
          onValueChange={(value) => {
            const priority = value === 'all' ? undefined : parseInt(value) as 1 | 2 | 3
            onFiltersChange({ ...filters, priority })
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="1">High !</SelectItem>
            <SelectItem value="2">Medium !!</SelectItem>
            <SelectItem value="3">Low !!!</SelectItem>
          </SelectContent>
        </Select>

        {/* Project Filter */}
        {availableProjects.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <AtSign className="h-4 w-4 mr-1" />
                {filters.project ? `@${filters.project}` : 'Project'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Project</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, project: undefined })}>
                All Projects
              </DropdownMenuItem>
              {availableProjects.map((project) => (
                <DropdownMenuItem
                  key={project}
                  onClick={() => onFiltersChange({ ...filters, project })}
                >
                  @{project}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Hash className="h-4 w-4 mr-1" />
                Tags ({filters.tags?.length || 0})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-48 overflow-y-auto">
              <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableTags.map((tag) => (
                <DropdownMenuItem
                  key={tag}
                  onClick={() => addTag(tag)}
                  className={filters.tags?.includes(tag) ? 'bg-accent' : ''}
                >
                  #{tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Quick Filters */}
        <Button 
          variant={filters.search === 'overdue' ? 'default' : 'outline'}
          size="sm" 
          onClick={() => {
            if (filters.search === 'overdue') {
              setSearchTerm('')
            } else {
              setSearchTerm('overdue')
            }
          }}
        >
          Overdue
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.completed !== undefined && (
            <Badge variant="secondary">
              {filters.completed ? 'Completed' : 'Pending'}
              <button
                onClick={() => onFiltersChange({ ...filters, completed: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.priority && (
            <Badge variant="secondary">
              Priority: {filters.priority === 1 ? 'High' : filters.priority === 2 ? 'Medium' : 'Low'}
              <button
                onClick={() => onFiltersChange({ ...filters, priority: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.project && (
            <Badge variant="secondary">
              @{filters.project}
              <button
                onClick={() => onFiltersChange({ ...filters, project: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.tags?.map((tag) => (
            <Badge key={tag} variant="secondary">
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCount} of {totalCount} todos
      </div>
    </div>
  )
}