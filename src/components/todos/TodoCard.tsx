'use client'

import { useState, useEffect, useCallback } from 'react'
import { Todo } from '@/types/todo.types'
import { TodoParser } from '@/lib/utils/todoParser'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Save, 
  X, 
  Calendar,
  Clock,
  Hash,
  AtSign
} from 'lucide-react'
import { format } from 'date-fns'

interface TodoCardProps {
  todo: Todo
  onToggleComplete: (id: string, completed: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string, updates: Partial<Todo>) => Promise<void>
  disabled?: boolean
  // Bulk selection props
  showSelectionCheckbox?: boolean
  isSelected?: boolean
  onSelectionChange?: (id: string, selected: boolean) => void
}

export default function TodoCard({ 
  todo, 
  onToggleComplete, 
  onDelete, 
  onEdit, 
  disabled = false,
  showSelectionCheckbox = false,
  isSelected = false,
  onSelectionChange
}: TodoCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const [editDescription, setEditDescription] = useState(todo.description || '')
  const [editTags, setEditTags] = useState<string[]>(todo.tags || [])
  const [editProject, setEditProject] = useState(todo.project || '')
  const [editPriority, setEditPriority] = useState<1 | 2 | 3 | undefined>(todo.priority || undefined)
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(
    todo.due_date ? new Date(todo.due_date) : undefined
  )
  const [editWorkDate, setEditWorkDate] = useState<Date | undefined>(
    todo.work_date ? new Date(todo.work_date) : undefined
  )

  const handleCancelEdit = useCallback(() => {
    setEditTitle(todo.title)
    setEditDescription(todo.description || '')
    setEditTags(todo.tags || [])
    setEditProject(todo.project || '')
    setEditPriority(todo.priority || undefined)
    setEditDueDate(todo.due_date ? new Date(todo.due_date) : undefined)
    setEditWorkDate(todo.work_date ? new Date(todo.work_date) : undefined)
    setIsEditing(false)
  }, [todo.title, todo.description, todo.tags, todo.project, todo.priority, todo.due_date, todo.work_date])

  // Handle escape key to cancel editing
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditing) {
        handleCancelEdit()
      }
    }

    if (isEditing) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isEditing, handleCancelEdit])

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return

    // Parse the new title for smart extraction, but merge with manually set values
    const parsed = TodoParser.parse(editTitle)
    
    // Combine parsed tags with manually set tags, removing duplicates
    const allTags = [...new Set([...editTags, ...parsed.tags])]
    
    await onEdit(todo.id, {
      title: parsed.title || editTitle, // Use parsed title if available, otherwise original
      description: editDescription.trim() || null,
      tags: allTags.length > 0 ? allTags : [],
      project: editProject.trim() || parsed.project || null,
      priority: editPriority || parsed.priority || null,
      due_date: editDueDate?.toISOString() || null,
      work_date: editWorkDate?.toISOString() || null,
    })
    
    setIsEditing(false)
  }

  const addTag = (tagName: string) => {
    const trimmed = tagName.trim()
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags(prev => [...prev, trimmed])
    }
  }

  const removeTag = (tagToRemove: string) => {
    setEditTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const input = e.currentTarget
      const tag = input.value.trim().replace(/^#/, '') // Remove # if present
      if (tag) {
        addTag(tag)
        input.value = ''
      }
    }
  }

  const getPriorityColor = (priority?: 1 | 2 | 3) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800 border-red-200'
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 3: return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isEditing) {
    return (
      <Card className="transition-all duration-200">
        <CardContent className="p-4">
          <div className="space-y-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Todo title with #tags @project ! priority"
              className="font-medium"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              className="min-h-[60px]"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <DatePicker
                  date={editDueDate}
                  onDateChange={setEditDueDate}
                  placeholder="Select due date"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Work Date</label>
                <DatePicker
                  date={editWorkDate}
                  onDateChange={setEditWorkDate}
                  placeholder="Select work date"
                />
              </div>
            </div>
            
            {/* Tags Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Hash className="h-4 w-4" />
                Tags
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {editTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tags (press Enter or comma to add)"
                onKeyDown={handleTagInputKeyDown}
              />
            </div>
            
            {/* Project and Priority Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <AtSign className="h-4 w-4" />
                  Project
                </label>
                <Input
                  value={editProject}
                  onChange={(e) => setEditProject(e.target.value)}
                  placeholder="Project name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={editPriority?.toString() || 'none'}
                  onValueChange={(value) => setEditPriority(value === 'none' ? undefined : parseInt(value) as 1 | 2 | 3)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Priority</SelectItem>
                    <SelectItem value="1">High !</SelectItem>
                    <SelectItem value="2">Medium !!</SelectItem>
                    <SelectItem value="3">Low !!!</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={`p-3 bg-primary/5 border-primary/20 relative transition-all duration-200 ${
        todo.completed ? 'opacity-60' : 'hover:shadow-md'
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Actions menu in top right - shown on hover */}
      {isHovering && !showSelectionCheckbox && (
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-6 h-6 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center text-xs transition-colors shadow-sm"
              >
                <MoreVertical className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit2 className="h-3 w-3 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(todo.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Main content */}
      <div className="pr-4">
        {/* Selection checkbox or complete checkbox */}
        <div className="flex items-start gap-3 mb-1">
          {showSelectionCheckbox ? (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelectionChange?.(todo.id, checked as boolean)}
              disabled={disabled}
              className="mt-0.5"
            />
          ) : (
            <Checkbox
              checked={todo.completed}
              onCheckedChange={(checked) => onToggleComplete(todo.id, checked as boolean)}
              disabled={disabled}
              className="mt-0.5"
            />
          )}
          
          <div className="flex-1 min-w-0">
            {/* Currently Working On or title */}
            <h4 className="font-medium text-sm text-foreground mb-1">
              {todo.title}
            </h4>
          </div>
        </div>

        {/* Description */}
        {todo.description && (
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            {todo.description}
          </p>
        )}

        {/* Tags, project, and priority */}
        {((todo.tags && todo.tags.length > 0) || todo.project || todo.priority) && (
          <div className="flex gap-2 mt-2 text-xs flex-wrap">
            {todo.project && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                @{todo.project}
              </span>
            )}
            {todo.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                #{tag}
              </span>
            ))}
            {todo.priority && (
              <span className={`px-2 py-1 rounded-full ${getPriorityColor(todo.priority)}`}>
                {TodoParser.getPriorityLabel(todo.priority)} {TodoParser.getPriorityIcon(todo.priority)}
              </span>
            )}
          </div>
        )}

        {/* Dates */}
        {(todo.due_date || todo.work_date) && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
            {todo.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className={
                  new Date(todo.due_date) < new Date() && !todo.completed
                    ? 'text-red-600 font-medium'
                    : ''
                }>
                  Due: {format(new Date(todo.due_date), 'MMM d')}
                  {new Date(todo.due_date) < new Date() && !todo.completed && ' (Overdue)'}
                </span>
              </div>
            )}

            {todo.work_date && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Work: {format(new Date(todo.work_date), 'MMM d')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}