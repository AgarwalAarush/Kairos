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
  selectedTask: any | null
}

interface PomodoroContextType extends PomodoroState {
  startTimer: (userId: string) => Promise<void>
  pauseTimer: () => Promise<void>
  resetTimer: () => Promise<void>
  completeSession: (userId: string) => Promise<void>
  setSelectedTask: (task: any | null) => void
  formatTime: (seconds: number) => string
  getProgress: () => number
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
  selectedTask: null
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

  const getCurrentSessionDuration = useCallback((sessionType: SessionType) => {
    switch (sessionType) {
      case 'work':
        return WORK_DURATION * 60
      case 'break':
        return BREAK_DURATION * 60
      case 'longBreak':
        return LONG_BREAK_DURATION * 60
      default:
        return WORK_DURATION * 60
    }
  }, [])

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
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
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
    const showNotification = () => {
      if ('Notification' in window && Notification.permission === 'granted') {
        let title = ''
        let body = ''
        
        if (state.sessionType === 'work') {
          title = 'Work Session Complete! 🎉'
          body = 'Great job! Time for a well-deserved break.'
        } else if (state.sessionType === 'break') {
          title = 'Break Complete! 💪'
          body = 'Ready to get back to work?'
        } else if (state.sessionType === 'longBreak') {
          title = 'Long Break Complete! 🚀'
          body = 'You\'ve completed 4 work sessions. Time to start fresh!'
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
    
    // Request notification permission if needed, then show notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        showNotification()
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            showNotification()
          }
        })
      }
    }

    setState(prevState => {
      let newSessionType: SessionType
      let newCompletedSessions = prevState.completedSessions

      if (prevState.sessionType === 'work') {
        newCompletedSessions = prevState.completedSessions + 1
        
        if (newCompletedSessions % 4 === 0) {
          newSessionType = 'longBreak'
        } else {
          newSessionType = 'break'
        }
      } else {
        newSessionType = 'work'
      }

      const duration = getCurrentSessionDuration(newSessionType)

      return {
        ...prevState,
        isRunning: false,
        sessionType: newSessionType,
        timeLeft: duration,
        sessionDuration: duration,
        completedSessions: newCompletedSessions,
        sessionStartTime: null,
        currentSessionId: null
      }
    })
  }, [state.currentSessionId, state.sessionType, getCurrentSessionDuration])

  const setSelectedTask = useCallback((task: any | null) => {
    setState(prevState => ({
      ...prevState,
      selectedTask: task
    }))
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const getProgress = useCallback(() => {
    return ((state.sessionDuration - state.timeLeft) / state.sessionDuration) * 100
  }, [state.sessionDuration, state.timeLeft])

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
    setSelectedTask,
    formatTime,
    getProgress
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