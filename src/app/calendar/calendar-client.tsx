'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/layout/Navbar'
import { TodoService } from '@/lib/services/todoService'
import { Todo } from '@/types/todo.types'
import { 
  Calendar, 
  CalendarCurrentDate,
  CalendarDayView,
  CalendarMonthView, 
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
  CalendarYearView,
  CalendarEvent 
} from '@/components/Calendar'
import { ChevronLeft, ChevronRight, Timer, CheckSquare, Loader2, Link2, AlertCircle } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

interface CalendarClientProps {
  user: User
}

export default function CalendarClient({ user }: CalendarClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for OAuth callback params
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    
    if (connected) {
      toast.success('Google Calendar connected successfully!')
      // Remove the param from URL
      window.history.replaceState({}, '', '/calendar')
    }
    
    if (error) {
      let errorMessage = 'Failed to connect Google Calendar'
      switch (error) {
        case 'oauth_denied':
          errorMessage = 'Google Calendar access was denied'
          break
        case 'invalid_request':
          errorMessage = 'Invalid request to Google'
          break
        case 'callback_failed':
          errorMessage = 'Failed to process Google Calendar connection'
          break
        case 'storage_failed':
          errorMessage = 'Failed to save Google Calendar connection'
          break
      }
      toast.error(errorMessage)
      setError(errorMessage)
      // Remove the param from URL
      window.history.replaceState({}, '', '/calendar')
    }

    loadCalendarEvents()
    loadTodos()
  }, [searchParams])

  const loadCalendarEvents = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/calendar/events')
      const data = await response.json()
      
      if (!response.ok) {
        if (data.needsAuth) {
          setIsConnected(false)
          setEvents([])
        } else {
          throw new Error(data.error || 'Failed to load calendar events')
        }
        return
      }

      setIsConnected(true)
      setEvents(data.events || [])
    } catch (error) {
      console.error('Error loading calendar events:', error)
      setError(error instanceof Error ? error.message : 'Failed to load calendar events')
      setIsConnected(false)
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadTodos = async () => {
    try {
      const fetchedTodos = await TodoService.getTodos(user.id)
      setTodos(fetchedTodos)
    } catch (error) {
      console.error('Error loading todos:', error)
    }
  }

  const handleConnectGoogle = () => {
    window.location.href = '/api/auth/google'
  }

  // Convert todos with due dates to calendar events
  const todoEvents = useMemo(() => {
    return todos
      .filter(todo => todo.due_date && !todo.completed) // Only show incomplete todos with due dates
      .map(todo => {
        const dueDate = new Date(todo.due_date!)
        // Set the event for the whole day
        const startDate = new Date(dueDate)
        startDate.setHours(9, 0, 0, 0) // 9 AM
        const endDate = new Date(dueDate)
        endDate.setHours(10, 0, 0, 0) // 10 AM (1 hour duration)

        return {
          id: `todo-${todo.id}`,
          start: startDate,
          end: endDate,
          title: todo.title,
          color: todo.priority === 1 ? 'pink' : todo.priority === 2 ? 'purple' : 'blue'
        } as CalendarEvent
      })
  }, [todos])

  // Combine Google Calendar events and todo events
  const allEvents = useMemo(() => {
    return [...events, ...todoEvents]
  }, [events, todoEvents])


  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        user={user} 
        title="Calendar"
        subtitle="View your schedule and todos"
      />

      {/* Calendar Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading calendar...</span>
          </div>
        ) : !isConnected ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center">
              <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Connect Google Calendar</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Connect your Google Calendar to view and manage your events directly in Kairos.
              </p>
              {error && (
                <div className="flex items-center justify-center text-sm text-red-600 mb-4">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}
              <Button onClick={handleConnectGoogle} size="lg">
                <Link2 className="h-4 w-4 mr-2" />
                Connect Google Calendar
              </Button>
            </div>
          </div>
        ) : (
          <Calendar events={allEvents}>
            <div className="mb-6">
              {/* Calendar Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CalendarPrevTrigger>
                    <ChevronLeft className="h-4 w-4" />
                  </CalendarPrevTrigger>
                  <CalendarNextTrigger>
                    <ChevronRight className="h-4 w-4" />
                  </CalendarNextTrigger>
                  <CalendarTodayTrigger>
                    Today
                  </CalendarTodayTrigger>
                  <Button 
                    onClick={() => {
                      loadCalendarEvents()
                      loadTodos()
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                <h2 className="text-lg font-semibold">
                  <CalendarCurrentDate />
                </h2>

                <div className="flex gap-1">
                  <CalendarViewTrigger view="day">Day</CalendarViewTrigger>
                  <CalendarViewTrigger view="week">Week</CalendarViewTrigger>
                  <CalendarViewTrigger view="month">Month</CalendarViewTrigger>
                  <CalendarViewTrigger view="year">Year</CalendarViewTrigger>
                </div>
              </div>
            </div>

            {/* Calendar Views */}
            <div className="border rounded-lg bg-card" style={{ height: 'calc(100vh - 300px)' }}>
              <CalendarDayView />
              <CalendarWeekView />
              <CalendarMonthView />
              <CalendarYearView />
            </div>
          </Calendar>
        )}
      </main>
    </div>
  )
}