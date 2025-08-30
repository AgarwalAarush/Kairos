import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HomePage from '@/components/homepage/HomePage'
import Navbar from '@/components/layout/Navbar'

export default async function Home() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        user={user} 
        title="Kairos"
        subtitle="Your personal productivity hub"
      />
      <HomePage user={user} />
    </div>
  )
}
