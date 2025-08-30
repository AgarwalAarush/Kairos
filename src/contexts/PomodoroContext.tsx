'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { PomodoroService } from '@/lib/services/pomodoroService'

type SessionType = 'work' | 'break' | 'longBreak'

interface PomodoroState {
  timeLeft: number
  sessionType: SessionType
  completedSessions: number
  isRunning: boolean
  currentSessionId: string | null
  sessionStartTime: Date | null
  sessionDuration: number
  selectedTask: unknown | null
  customDurations: {
    work: number
    break: number
    longBreak: number
  }
}

interface PomodoroContextType extends PomodoroState {
  startTimer: (userId: string) => Promise<void>
  pauseTimer: () => Promise<void>
  resetTimer: () => Promise<void>
  completeSession: (userId: string) => Promise<void>
  skipBreak: (userId: string) => Promise<void>
  setSelectedTask: (task: unknown | null) => void
  formatTime: (seconds: number) => string
  getProgress: () => number
  refreshStatistics: () => void
  updateDuration: (sessionType: SessionType, minutes: number) => void
  adjustCurrentDuration: (minutes: number) => void
}

const STORAGE_KEY = 'pomodoro-state'

// Default durations in minutes
const WORK_DURATION = 25
const BREAK_DURATION = 5
const LONG_BREAK_DURATION = 15

const defaultState: PomodoroState = {
  timeLeft: WORK_DURATION * 60,
  sessionType: 'work',
  completedSessions: 0,
  isRunning: false,
  currentSessionId: null,
  sessionStartTime: null,
  sessionDuration: WORK_DURATION * 60,
  selectedTask: null,
  customDurations: {
    work: WORK_DURATION,
    break: BREAK_DURATION,
    longBreak: LONG_BREAK_DURATION
  }
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined)

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PomodoroState>(defaultState)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Convert date string back to Date object
          if (parsed.sessionStartTime) {
            parsed.sessionStartTime = new Date(parsed.sessionStartTime)
          }
          // Ensure customDurations exists and has all required properties
          if (!parsed.customDurations) {
            parsed.customDurations = {
              work: WORK_DURATION,
              break: BREAK_DURATION,
              longBreak: LONG_BREAK_DURATION
            }
          } else {
            // Fill in missing duration properties with defaults
            parsed.customDurations = {
              work: parsed.customDurations.work || WORK_DURATION,
              break: parsed.customDurations.break || BREAK_DURATION,
              longBreak: parsed.customDurations.longBreak || LONG_BREAK_DURATION
            }
          }
          setState(parsed)
        } catch (error) {
          console.error('Error loading pomodoro state:', error)
        }
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state])

  const getCurrentSessionDuration = useCallback((sessionType: SessionType, customDurations = state.customDurations) => {
    // Defensive programming: ensure customDurations exists and has valid values
    const safeDurations = {
      work: customDurations?.work || WORK_DURATION,
      break: customDurations?.break || BREAK_DURATION,
      longBreak: customDurations?.longBreak || LONG_BREAK_DURATION
    }
    
    let duration: number
    switch (sessionType) {
      case 'work':
        duration = safeDurations.work * 60
        break
      case 'break':
        duration = safeDurations.break * 60
        break
      case 'longBreak':
        duration = safeDurations.longBreak * 60
        break
      default:
        duration = safeDurations.work * 60
    }
    
    // Additional safety check: ensure duration is a valid number
    if (isNaN(duration) || duration <= 0) {
      console.warn(`Invalid duration calculated for ${sessionType}:`, duration, 'using default')
      duration = WORK_DURATION * 60
    }
    
    return duration
  }, [state.customDurations])

  const updateTimer = useCallback(() => {
    setState(currentState => {
      if (!currentState.isRunning || !currentState.sessionStartTime) return currentState

      const now = new Date()
      const elapsedSeconds = Math.floor((now.getTime() - currentState.sessionStartTime.getTime()) / 1000)
      const remainingSeconds = Math.max(0, currentState.sessionDuration - elapsedSeconds)

      if (remainingSeconds <= 0) {
        // Timer finished - we'll handle completion elsewhere to access userId
        return {
          ...currentState,
          timeLeft: 0,
          isRunning: false
        }
      }

      return {
        ...currentState,
        timeLeft: remainingSeconds
      }
    })
  }, [])

  // Timer effect
  useEffect(() => {
    if (state.isRunning) {
      updateTimer()
      intervalRef.current = setInterval(updateTimer, 1000)
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
  }, [state.isRunning, updateTimer])

  // Handle visibility change and focus events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && state.isRunning) {
        updateTimer()
      }
    }

    const handleFocus = () => {
      if (state.isRunning) {
        updateTimer()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [state.isRunning, updateTimer])

  const startTimer = useCallback(async (userId: string) => {
    const now = new Date()
    const duration = getCurrentSessionDuration(state.sessionType)

    try {
      const session = await PomodoroService.createSession({
        session_type: state.sessionType,
        duration_minutes: Math.floor(duration / 60),
        started_at: now.toISOString()
      }, userId)

      setState(prevState => ({
        ...prevState,
        isRunning: true,
        sessionStartTime: now,
        sessionDuration: duration,
        timeLeft: duration,
        currentSessionId: session?.id || null
      }))
    } catch (error) {
      console.error('Error starting session:', error)
      setState(prevState => ({
        ...prevState,
        isRunning: true,
        sessionStartTime: now,
        sessionDuration: duration,
        timeLeft: duration
      }))
    }
  }, [state.sessionType, getCurrentSessionDuration])

  const pauseTimer = useCallback(async () => {
    if (state.currentSessionId) {
      try {
        await PomodoroService.updateSession(state.currentSessionId, {
          interrupted: true
        })
      } catch (error) {
        console.error('Error pausing session:', error)
      }
    }

    setState(prevState => ({
      ...prevState,
      isRunning: false
    }))
  }, [state.currentSessionId])

  const resetTimer = useCallback(async () => {
    if (state.currentSessionId) {
      try {
        await PomodoroService.updateSession(state.currentSessionId, {
          interrupted: true
        })
      } catch (error) {
        console.error('Error resetting session:', error)
      }
    }

    const duration = getCurrentSessionDuration(state.sessionType)

    setState(prevState => ({
      ...prevState,
      isRunning: false,
      timeLeft: duration,
      sessionDuration: duration,
      sessionStartTime: null,
      currentSessionId: null
    }))
  }, [state.currentSessionId, state.sessionType, getCurrentSessionDuration])

  const completeSession = useCallback(async (userId: string) => {
    // Update current session as completed
    if (state.currentSessionId) {
      try {
        await PomodoroService.updateSession(state.currentSessionId, {
          completed: true,
          completed_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error completing session:', error)
      }
    }

    // Play completion sound
    const playCompletionSound = () => {
      try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch (error) {
        console.log('Could not play completion sound:', error)
      }
    }

    // Show desktop notification
    const showNotification = (sessionType: SessionType) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        let title = ''
        let body = ''
        
        if (sessionType === 'work') {
          title = 'Work Session Complete! 🎉'
          body = 'Starting break session automatically...'
        } else if (sessionType === 'break') {
          title = 'Break Complete! 💪'
          body = 'Starting work session automatically...'
        } else if (sessionType === 'longBreak') {
          title = 'Long Break Complete! 🚀'
          body = 'Starting new work session automatically...'
        }

        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'pomodoro-session-complete'
        })
      }
    }

    // Play sound and show notifications
    playCompletionSound()
    showNotification(state.sessionType)
    
    // Request notification permission if needed
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Determine next session type and update completed sessions
    let newSessionType: SessionType
    let newCompletedSessions = state.completedSessions

    if (state.sessionType === 'work') {
      newCompletedSessions = state.completedSessions + 1
      
      if (newCompletedSessions % 4 === 0) {
        newSessionType = 'longBreak'
      } else {
        newSessionType = 'break'
      }
    } else {
      newSessionType = 'work'
    }

    const duration = getCurrentSessionDuration(newSessionType, state.customDurations)
    const now = new Date()

    try {
      // Create new session for the next phase
      const session = await PomodoroService.createSession({
        session_type: newSessionType,
        duration_minutes: Math.floor(duration / 60),
        started_at: now.toISOString()
      }, userId)

      // Debug logging
      console.log('Completing session transition:', {
        oldSessionType: state.sessionType,
        newSessionType,
        duration,
        customDurations: state.customDurations
      })

      setState(prevState => ({
        ...prevState,
        isRunning: true, // Automatically start the next session
        sessionType: newSessionType,
        timeLeft: duration,
        sessionDuration: duration,
        completedSessions: newCompletedSessions,
        sessionStartTime: now,
        currentSessionId: session?.id || null
      }))
    } catch (error) {
      console.error('Error creating next session:', error)
      
      // Debug logging for fallback case too
      console.log('Fallback session transition:', {
        oldSessionType: state.sessionType,
        newSessionType,
        duration,
        customDurations: state.customDurations
      })

      // Fallback without session tracking
      setState(prevState => ({
        ...prevState,
        isRunning: true, // Still auto-start even if session creation fails
        sessionType: newSessionType,
        timeLeft: duration,
        sessionDuration: duration,
        completedSessions: newCompletedSessions,
        sessionStartTime: now,
        currentSessionId: null
      }))
    }

    // Trigger statistics refresh after state update
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pomodoroSessionComplete'))
    }, 100)
  }, [state.currentSessionId, state.sessionType, state.completedSessions, getCurrentSessionDuration])

  const setSelectedTask = useCallback((task: unknown | null) => {
    setState(prevState => ({
      ...prevState,
      selectedTask: task
    }))
  }, [])

  const formatTime = useCallback((seconds: number) => {
    // Handle NaN or invalid input
    if (isNaN(seconds) || seconds < 0) {
      console.warn('formatTime received invalid input:', seconds)
      return '00:00'
    }
    
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const getProgress = useCallback(() => {
    return ((state.sessionDuration - state.timeLeft) / state.sessionDuration) * 100
  }, [state.sessionDuration, state.timeLeft])

  const refreshStatistics = useCallback(() => {
    // Trigger a custom event to notify components to refresh statistics
    window.dispatchEvent(new CustomEvent('pomodoroSessionComplete'))
  }, [])

  const updateDuration = useCallback((sessionType: SessionType, minutes: number) => {
    setState(prevState => ({
      ...prevState,
      customDurations: {
        ...prevState.customDurations,
        [sessionType]: Math.max(1, Math.min(60, minutes)) // Constrain between 1-60 minutes
      }
    }))
  }, [])

  const adjustCurrentDuration = useCallback((minutes: number) => {
    if (state.isRunning) return // Don't allow adjustments while running

    const newDuration = Math.max(60, Math.min(3600, state.sessionDuration + (minutes * 60))) // 1-60 minutes in seconds
    const newTimeLeft = state.timeLeft + (minutes * 60)

    setState(prevState => ({
      ...prevState,
      sessionDuration: newDuration,
      timeLeft: Math.max(0, newTimeLeft),
      customDurations: {
        ...prevState.customDurations,
        [prevState.sessionType]: Math.floor(newDuration / 60)
      }
    }))
  }, [state.isRunning, state.sessionDuration, state.timeLeft])

  const skipBreak = useCallback(async (userId: string) => {
    // Only allow skipping during break sessions
    if (state.sessionType === 'work') return

    // Mark current break session as interrupted if it exists
    if (state.currentSessionId) {
      try {
        await PomodoroService.updateSession(state.currentSessionId, {
          interrupted: true
        })
      } catch (error) {
        console.error('Error marking break session as skipped:', error)
      }
    }

    // Transition directly to work session
    const workDuration = getCurrentSessionDuration('work', state.customDurations)
    const now = new Date()

    try {
      // Create new work session
      const session = await PomodoroService.createSession({
        session_type: 'work',
        duration_minutes: Math.floor(workDuration / 60),
        started_at: now.toISOString()
      }, userId)

      setState(prevState => ({
        ...prevState,
        isRunning: true,
        sessionType: 'work',
        timeLeft: workDuration,
        sessionDuration: workDuration,
        sessionStartTime: now,
        currentSessionId: session?.id || null
      }))
    } catch (error) {
      console.error('Error creating work session after skip:', error)
      // Fallback without session tracking
      setState(prevState => ({
        ...prevState,
        isRunning: true,
        sessionType: 'work',
        timeLeft: workDuration,
        sessionDuration: workDuration,
        sessionStartTime: now,
        currentSessionId: null
      }))
    }

    // Trigger statistics refresh after state update
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pomodoroSessionComplete'))
    }, 100)
  }, [state.sessionType, state.currentSessionId, getCurrentSessionDuration, state.customDurations])

  // Check if session should complete
  useEffect(() => {
    if (state.timeLeft <= 0 && state.isRunning) {
      // We need userId to complete the session, this will be handled by the consuming component
    }
  }, [state.timeLeft, state.isRunning])

  const contextValue: PomodoroContextType = {
    ...state,
    startTimer,
    pauseTimer,
    resetTimer,
    completeSession,
    skipBreak,
    setSelectedTask,
    formatTime,
    getProgress,
    refreshStatistics,
    updateDuration,
    adjustCurrentDuration
  }

  return (
    <PomodoroContext.Provider value={contextValue}>
      {children}
    </PomodoroContext.Provider>
  )
}

export function usePomodoro() {
  const context = useContext(PomodoroContext)
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider')
  }
  return context
}