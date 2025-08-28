import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export const createClient = () => {
  // Get environment variables (only from process.env for client-side)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('=== Supabase Client Debug ===')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', url ? `${url.substring(0, 30)}...` : '❌ MISSING')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? `${key.substring(0, 30)}...` : '❌ MISSING')
  console.log('Running in browser:', typeof window !== 'undefined')
  console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
  
  if (!url || !key) {
    const error = `❌ Missing Supabase environment variables:
    - URL: ${!!url ? '✅' : '❌'} 
    - KEY: ${!!key ? '✅' : '❌'}
    
    Make sure these are set in your deployment:
    - NEXT_PUBLIC_SUPABASE_URL
    - NEXT_PUBLIC_SUPABASE_ANON_KEY`
    
    console.error(error)
    throw new Error(`Missing environment variables - URL: ${!!url}, KEY: ${!!key}`)
  }
  
  return createBrowserClient<Database>(url, key)
}