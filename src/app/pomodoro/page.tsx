import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PomodoroClient from './pomodoro-client'

export default async function PomodoroPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return <PomodoroClient user={user} />
}