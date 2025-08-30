'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp, Plus, Minus, SkipForward } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { usePomodoro } from '@/contexts/PomodoroContext'
import type { User } from '@supabase/supabase-js'
import { PomodoroService, PomodoroStatistics } from '@/lib/services/pomodoroService'
import { TodoService } from '@/lib/services/todoService'
import { Todo } from '@/types/todo.types'
import PomodoroStatisticsComponent from '@/components/pomodoro/PomodoroStatistics'
import MotivationalQuotes from '@/components/pomodoro/MotivationalQuotes'
import TaskSearch from '@/components/pomodoro/TaskSearch'

interface PomodoroClientProps {
  user: User
}

export default function PomodoroClient({ user }: PomodoroClientProps) {
  
  const {
    timeLeft,
    sessionType,
    completedSessions,
    isRunning,
    selectedTask,
    startTimer,
    pauseTimer,
    resetTimer,
    setSelectedTask,
    formatTime,
    getProgress,
    completeSession,
    adjustCurrentDuration,
    skipBreak
  } = usePomodoro()

  const [statistics, setStatistics] = useState<PomodoroStatistics | null>(null)
  const [showStatistics, setShowStatistics] = useState(false)
  const [todos, setTodos] = useState<Todo[]>([])

  const progress = getProgress()


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

  // Handle session completion when timer reaches zero
  useEffect(() => {
    if (timeLeft <= 0 && !isRunning) {
      // Check if we just finished a session (timeLeft is 0 but we're not manually stopped)
      const handleCompletion = async () => {
        await completeSession(user.id)
        loadStatistics() // Refresh statistics after completion
      }
      
      // Add a small delay to ensure state has settled
      const timer = setTimeout(handleCompletion, 100)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, isRunning, completeSession, user.id, loadStatistics])

  // Listen for session completion events to refresh statistics
  useEffect(() => {
    const handleSessionComplete = () => {
      loadStatistics()
    }

    window.addEventListener('pomodoroSessionComplete', handleSessionComplete)
    
    return () => {
      window.removeEventListener('pomodoroSessionComplete', handleSessionComplete)
    }
  }, [loadStatistics])

  const handleStart = async () => {
    await startTimer(user.id)
    loadStatistics()
  }

  const handlePause = async () => {
    await pauseTimer()
  }

  const handleReset = async () => {
    await resetTimer()
    loadStatistics()
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

  const handleSkipBreak = async () => {
    await skipBreak(user.id)
    loadStatistics()
  }

  const strokeDasharray = 2 * Math.PI * 140 // circumference of circle with radius 140
  const strokeDashoffset = strokeDasharray * (1 - progress / 100)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar 
        user={user} 
        title="Pomodoro Timer"
        subtitle="Focus with the Pomodoro Technique"
      />

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
                  <div className="text-6xl font-mono font-light">
                    {formatTime(timeLeft)}
                  </div>
                  {!isRunning && (
                    <div className="flex items-center gap-2 mt-2 opacity-60 hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0"
                        onClick={() => adjustCurrentDuration(-1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground">adjust</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0"
                        onClick={() => adjustCurrentDuration(1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
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
                  {(sessionType === 'break' || sessionType === 'longBreak') && (
                    <Button
                      onClick={handleSkipBreak}
                      variant="secondary"
                      size="lg"
                      className="w-16 h-16 rounded-full"
                      title="Skip break and start work session"
                    >
                      <SkipForward className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Task Search */}
              <div className="max-w-sm mx-auto w-full">
                <TaskSearch
                  todos={todos}
                  selectedTask={selectedTask as Todo | null}
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