'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { TodoParser } from '@/lib/utils/todoParser'
import { TodoFormData } from '@/types/todo.types'
import { Plus, Loader2, Calendar, Clock, Zap } from 'lucide-react'
import { format } from 'date-fns'

interface CreateTodoFormProps {
  onSubmit: (todoData: TodoFormData) => Promise<void>
  isLoading?: boolean
}

export default function CreateTodoForm({ onSubmit, isLoading = false }: CreateTodoFormProps) {
  const [text, setText] = useState('')
  const [description, setDescription] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [dueDate, setDueDate] = useState<Date>()
  const [workDate, setWorkDate] = useState<Date>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    // Parse the text for smart extraction
    const parsed = TodoParser.parse(text)
    
    const todoData: TodoFormData = {
      title: parsed.title,
      description: description.trim() || undefined,
      tags: parsed.tags.length > 0 ? parsed.tags : undefined,
      project: parsed.project,
      priority: parsed.priority,
      due_date: dueDate || parsed.due_date,
      work_date: workDate || parsed.work_date,
    }

    await onSubmit(todoData)
    
    // Reset form
    setText('')
    setDescription('')
    setDueDate(undefined)
    setWorkDate(undefined)
    setIsExpanded(false)
  }

  const parsedData = TodoParser.parse(text)
  const showPreview = text.trim() && (parsedData.tags.length > 0 || parsedData.project || parsedData.priority || parsedData.due_date || parsedData.work_date)

  return (
    <Card className="mb-6 animate-slide-in">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a new todo... Try 'Call client by Friday' or 'Submit report tomorrow'"
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={!text.trim() || isLoading} size="sm">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Smart parsing preview */}
          {showPreview && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <div className="font-medium mb-1 flex items-center gap-2">
                Parsed:
                {(parsedData.due_date || parsedData.work_date) && (
                  <span className="text-xs text-orange-600 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Auto-detected dates
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium">Title:</span> {parsedData.title}
              </div>
              {parsedData.tags.length > 0 && (
                <div>
                  <span className="font-medium">Tags:</span>{' '}
                  {parsedData.tags.map(tag => (
                    <span key={tag} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {parsedData.project && (
                <div>
                  <span className="font-medium">Project:</span>{' '}
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    @{parsedData.project}
                  </span>
                </div>
              )}
              {parsedData.priority && (
                <div>
                  <span className="font-medium">Priority:</span>{' '}
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                    {TodoParser.getPriorityLabel(parsedData.priority)} {TodoParser.getPriorityIcon(parsedData.priority)}
                  </span>
                </div>
              )}
              
              {parsedData.due_date && (
                <div>
                  <span className="font-medium">Due Date:</span>{' '}
                  <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                    <Zap className="h-3 w-3" />
                    {format(parsedData.due_date, 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              
              {parsedData.work_date && (
                <div>
                  <span className="font-medium">Work Date:</span>{' '}
                  <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                    <Zap className="h-3 w-3" />
                    {format(parsedData.work_date, 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Date Pickers */}
          {(dueDate || workDate || parsedData.due_date || parsedData.work_date || isExpanded) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  Due Date
                  {!dueDate && parsedData.due_date && (
                    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-1 py-0.5 rounded">
                      <Zap className="h-2 w-2" />
                      Auto
                    </span>
                  )}
                </label>
                <DatePicker
                  date={dueDate || parsedData.due_date}
                  onDateChange={setDueDate}
                  placeholder="Select due date"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  Work Date
                  {!workDate && parsedData.work_date && (
                    <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-1 py-0.5 rounded">
                      <Zap className="h-2 w-2" />
                      Auto
                    </span>
                  )}
                </label>
                <DatePicker
                  date={workDate || parsedData.work_date}
                  onDateChange={setWorkDate}
                  placeholder="Select work date"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Expandable options */}
          {!isExpanded && (
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(true)}
                className="text-muted-foreground"
              >
                + Add details
              </Button>
              {!dueDate && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setDueDate(new Date())}
                  className="text-muted-foreground"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Due date
                </Button>
              )}
              {!workDate && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setWorkDate(new Date())}
                  className="text-muted-foreground"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Work date
                </Button>
              )}
            </div>
          )}

          {isExpanded && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description (optional)..."
                  className="min-h-[80px]"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setDescription('')
                  setDueDate(undefined)
                  setWorkDate(undefined)
                  setIsExpanded(false)
                }}
                className="text-muted-foreground"
              >
                Collapse details
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}