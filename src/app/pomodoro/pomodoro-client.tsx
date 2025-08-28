'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { PomodoroService, PomodoroStatistics } from '@/lib/services/pomodoroService'
import { TodoService } from '@/lib/services/todoService'
import { Todo } from '@/types/todo.types'
import PomodoroStatisticsComponent from '@/components/pomodoro/PomodoroStatistics'
import MotivationalQuotes from '@/components/pomodoro/MotivationalQuotes'
import TaskSearch from '@/components/pomodoro/TaskSearch'

type SessionType = 'work' | 'break' | 'longBreak'

interface PomodoroClientProps {
  user: User
}

export default function PomodoroClient({ user }: PomodoroClientProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(25 * 60) // Total seconds left
  const [sessionType, setSessionType] = useState<SessionType>('work')
  const [completedSessions, setCompletedSessions] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<PomodoroStatistics | null>(null)
  const [showStatistics, setShowStatistics] = useState(false)
  const [todos, setTodos] = useState<Todo[]>([])
  const [selectedTask, setSelectedTask] = useState<Todo | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sessionStartTimeRef = useRef<Date | null>(null)

  // Session durations in minutes
  const workDuration = 25
  const breakDuration = 5
  const longBreakDuration = 15

  const getCurrentSessionDuration = () => {
    switch (sessionType) {
      case 'work':
        return workDuration * 60
      case 'break':
        return breakDuration * 60
      case 'longBreak':
        return longBreakDuration * 60
      default:
        return workDuration * 60
    }
  }

  const totalSeconds = getCurrentSessionDuration()
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const completeSession = useCallback(async () => {
    setIsRunning(false)
    
    // Update current session as completed
    if (currentSessionId) {
      try {
        await PomodoroService.updateSession(currentSessionId, {
          completed: true,
          completed_at: new Date().toISOString()
        })
        setCurrentSessionId(null)
      } catch (error) {
        console.error('Error completing session:', error)
      }
    }
    
    if (sessionType === 'work') {
      const newCompletedSessions = completedSessions + 1
      setCompletedSessions(newCompletedSessions)
      
      if (newCompletedSessions % 4 === 0) {
        // Start long break after 4 work sessions
        setSessionType('longBreak')
        setTimeLeft(longBreakDuration * 60)
      } else {
        // Start regular break
        setSessionType('break')
        setTimeLeft(breakDuration * 60)
      }
    } else {
      // Break finished, start work session
      setSessionType('work')
      setTimeLeft(workDuration * 60)
    }

    // Refresh statistics
    loadStatistics()
  }, [sessionType, completedSessions, workDuration, breakDuration, longBreakDuration, currentSessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const tick = useCallback(() => {
    setTimeLeft(prevTime => {
      if (prevTime <= 1) {
        // Timer finished
        completeSession()
        return 0
      }
      return prevTime - 1
    })
  }, [completeSession])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, tick])

  // Load statistics on mount
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await PomodoroService.getStatistics(user.id)
      setStatistics(stats)
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }, [user.id])

  // Load todos on mount
  const loadTodos = useCallback(async () => {
    try {
      const fetchedTodos = await TodoService.getTodos(user.id)
      setTodos(fetchedTodos)
    } catch (error) {
      console.error('Error loading todos:', error)
    }
  }, [user.id])

  useEffect(() => {
    loadStatistics()
    loadTodos()
  }, [loadStatistics, loadTodos])

  const handleStart = async () => {
    if (isEditing) {
      setIsEditing(false)
    }
    
    // Create new session when starting
    try {
      const session = await PomodoroService.createSession({
        session_type: sessionType,
        duration_minutes: Math.floor(getCurrentSessionDuration() / 60),
        started_at: new Date().toISOString()
      }, user.id)
      
      if (session) {
        setCurrentSessionId(session.id)
      }
      sessionStartTimeRef.current = new Date()
    } catch (error) {
      console.error('Error creating session:', error)
    }
    
    setIsRunning(true)
  }

  const handlePause = async () => {
    setIsRunning(false)
    
    // Mark session as interrupted if it's paused before completion
    if (currentSessionId) {
      try {
        await PomodoroService.updateSession(currentSessionId, {
          interrupted: true
        })
      } catch (error) {
        console.error('Error marking session as interrupted:', error)
      }
    }
  }

  const handleReset = async () => {
    setIsRunning(false)
    setTimeLeft(getCurrentSessionDuration())
    
    // Mark current session as interrupted if it exists
    if (currentSessionId) {
      try {
        await PomodoroService.updateSession(currentSessionId, {
          interrupted: true
        })
        setCurrentSessionId(null)
        loadStatistics()
      } catch (error) {
        console.error('Error resetting session:', error)
      }
    }
  }

  const handleEditTime = () => {
    if (!isRunning && sessionType === 'work') {
      setIsEditing(true)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }

  const handleTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditing(false)
    setTimeLeft(workDuration * 60)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value > 0 && value <= 999) {
      // Update workDuration would require making it state, for now just update timeLeft
      setTimeLeft(value * 60)
    }
  }

  const getSessionTypeLabel = () => {
    switch (sessionType) {
      case 'work':
        return 'Work'
      case 'break':
        return 'Break'
      case 'longBreak':
        return 'Long Break'
      default:
        return 'Work'
    }
  }

  const handleTaskSelect = (task: Todo) => {
    setSelectedTask(task)
  }

  const handleTaskDeselect = () => {
    setSelectedTask(null)
  }

  const strokeDasharray = 2 * Math.PI * 140 // circumference of circle with radius 140
  const strokeDashoffset = strokeDasharray * (1 - progress / 100)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold">Pomodoro Timer</h1>
          </div>
        </div>
      </header>

      {/* Main Content - Horizontal Layout */}
      <main className="flex-1 p-8">
        <div className="w-full max-w-none mx-auto px-[15%]">
          <div className="flex items-start justify-between gap-8 mb-12">
            {/* Left Side - Timer and Dots */}
            <div className="flex flex-col items-center flex-1 justify-center">
              <div className="relative">
                {/* SVG Circle Progress */}
                <svg
                  width="360"
                  height="360"
                  viewBox="0 0 360 360"
                  className="transform -rotate-90"
                >
                  {/* Background circle */}
                  <circle
                    cx="180"
                    cy="180"
                    r="140"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted-foreground/20"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="180"
                    cy="180"
                    r="140"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1000 ease-in-out"
                  />
                </svg>

                {/* Timer Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isEditing ? (
                    <form onSubmit={handleTimeSubmit} className="text-center">
                      <input
                        ref={inputRef}
                        type="number"
                        value={Math.floor(timeLeft / 60)}
                        onChange={handleTimeChange}
                        className="text-6xl font-mono font-light bg-transparent text-center border-none outline-none w-32"
                        min="1"
                        max="999"
                      />
                      <div className="text-sm text-muted-foreground mt-2">
                        Press Enter to confirm
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={handleEditTime}
                      disabled={isRunning || sessionType !== 'work'}
                      className={`text-6xl font-mono font-light ${
                        !isRunning && sessionType === 'work' ? 'hover:text-primary cursor-pointer' : 'cursor-default'
                      } transition-colors`}
                    >
                      {formatTime(timeLeft)}
                    </button>
                  )}
                </div>
              </div>

              {/* Phase Indicator Dots - Closer to circle */}
              <div className="mt-4 flex gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index < completedSessions % 4
                        ? 'bg-primary'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right Side - Session Type, Controls, and Task Search */}
            <div className="flex flex-col space-y-8 flex-1">
              {/* Session Type and Controls */}
              <div className="flex flex-col items-center justify-center space-y-6">
                {/* Session Type Display */}
                <div className="text-center">
                  <h2 className="text-4xl font-thin tracking-wide text-foreground mb-4" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
                    {getSessionTypeLabel()}
                  </h2>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={isRunning ? handlePause : handleStart}
                    size="lg"
                    className="w-16 h-16 rounded-full"
                  >
                    {isRunning ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6" />
                    )}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                    className="w-16 h-16 rounded-full"
                  >
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Task Search */}
              <div className="max-w-sm mx-auto w-full">
                <TaskSearch
                  todos={todos}
                  selectedTask={selectedTask}
                  onTaskSelect={handleTaskSelect}
                  onTaskDeselect={handleTaskDeselect}
                />
              </div>
            </div>
          </div>

          {/* Motivational Quotes Section */}
          <div className="mt-8">
            <MotivationalQuotes />
          </div>

          {/* Statistics Toggle and Section */}
          <div className="border-t pt-6 -mx-[15%] px-[15%]">
            <div className="flex justify-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStatistics(!showStatistics)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showStatistics ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Hide Statistics
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show Statistics
                  </>
                )}
              </Button>
            </div>
            
            {showStatistics && statistics && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <PomodoroStatisticsComponent statistics={statistics} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}