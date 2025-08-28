'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession()
        if (session?.user) {
          router.push('/dashboard')
        } else {
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/auth/signin')
      }
    }
    
    checkAuth()
  }, [router])

  // Show loading while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
