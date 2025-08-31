'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from '@/lib/auth'
import { usePomodoro } from '@/contexts/PomodoroContext'
import { CheckSquare, Timer, BarChart3, Home, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
  user: User
  title: string
  subtitle?: string
}

export default function Navbar({ user, title, subtitle }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isRunning, timeLeft, formatTime, completeSession } = usePomodoro()

  // Handle session completion
  useEffect(() => {
    if (timeLeft <= 0 && isRunning) {
      completeSession(user.id)
      // Statistics refresh is now handled within the completeSession function
    }
  }, [timeLeft, isRunning, completeSession, user.id])

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      console.log('Signing out...')
      
      await signOut()
      console.log('Sign out successful, redirecting...')
      
      // Force a complete page refresh to clear all state and redirect
      window.location.href = '/auth/signin'
      
    } catch (error) {
      console.error('Error signing out:', error)
      setIsSigningOut(false)
      
      // Even if signOut fails, redirect to signin page anyway
      // since user intent is clear - they want to sign out
      setTimeout(() => {
        window.location.href = '/auth/signin'
      }, 1000)
    }
  }

  const navigationButtons = [
    {
      href: '/',
      icon: Home,
      label: 'Home'
    },
    {
      href: '/dashboard',
      icon: CheckSquare,
      label: 'Dashboard'
    },
    {
      href: '/pomodoro',
      icon: Timer,
      label: 'Pomodoro'
    },
    {
      href: '/analytics',
      icon: BarChart3,
      label: 'Analytics'
    }
  ]

  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Title and hamburger menu */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground hidden sm:block">{subtitle}</p>
              )}
            </div>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Navigation buttons */}
            <div className="flex gap-1 mr-2">
              {navigationButtons.map((nav) => {
                const Icon = nav.icon
                const isActive = pathname === nav.href
                const isPomodoroPage = nav.href === '/pomodoro'
                return (
                  <div key={nav.href} className="relative">
                    <Button
                      onClick={() => router.push(nav.href)}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={isActive ? "" : "text-muted-foreground hover:text-foreground"}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {nav.label}
                    </Button>
                    {isPomodoroPage && isRunning && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 h-5 px-2 text-xs font-mono bg-primary text-primary-foreground"
                      >
                        {formatTime(timeLeft)}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
            
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

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Show timer badge on mobile if pomodoro is running */}
            {isRunning && (
              <Badge 
                variant="secondary" 
                className="h-6 px-2 text-xs font-mono bg-primary text-primary-foreground"
              >
                {formatTime(timeLeft)}
              </Badge>
            )}
            
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile navigation menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t">
            <div className="flex flex-col space-y-2">
              {navigationButtons.map((nav) => {
                const Icon = nav.icon
                const isActive = pathname === nav.href
                return (
                  <Button
                    key={nav.href}
                    onClick={() => {
                      router.push(nav.href)
                      setIsMobileMenuOpen(false)
                    }}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`justify-start w-full ${isActive ? "" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {nav.label}
                  </Button>
                )
              })}
              
              <div className="flex items-center justify-between pt-2 mt-2 border-t">
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
        )}
      </div>
    </header>
  )
}