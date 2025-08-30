import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from './analytics-client'

export const metadata = {
  title: 'Analytics - Kairos',
  description: 'Track your productivity and task completion analytics',
}

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth')
  }

  return <AnalyticsClient user={user} />
}