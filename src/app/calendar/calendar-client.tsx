'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from '@/lib/auth'
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

export default function CalendarClient({ user: _user }: CalendarClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [events, setEvents] = useState<CalendarEvent[]>([])
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

  const handleConnectGoogle = () => {
    window.location.href = '/api/auth/google'
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Error signing out:', error)
      setIsSigningOut(false)
      setTimeout(() => {
        window.location.href = '/auth/signin'
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Calendar</h1>
              <p className="text-muted-foreground">
                View your Google Calendar events
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                size="sm"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={() => router.push('/pomodoro')}
                variant="outline"
                size="sm"
              >
                <Timer className="h-4 w-4 mr-2" />
                Pomodoro
              </Button>
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
          <Calendar events={events}>
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
                    onClick={loadCalendarEvents}
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