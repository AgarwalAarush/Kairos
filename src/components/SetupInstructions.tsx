'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Database, Key, Settings } from 'lucide-react'

export default function SetupInstructions() {
  return (
    <Card className="mb-6 border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Settings className="h-5 w-5" />
          Database Setup Required
        </CardTitle>
        <CardDescription className="text-amber-700">
          Complete these steps to start using your todo app
        </CardDescription>
      </CardHeader>
      <CardContent className="text-amber-800">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Circle className="h-5 w-5 mt-0.5 text-amber-600" />
            <div>
              <p className="font-medium">1. Create Supabase Project</p>
              <p className="text-sm text-amber-700">
                Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a> and create a new project
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Circle className="h-5 w-5 mt-0.5 text-amber-600" />
            <div>
              <p className="font-medium">2. Set Environment Variables</p>
              <p className="text-sm text-amber-700 mb-2">
                Copy your project URL and API key to <code className="bg-amber-100 px-1 rounded">.env.local</code>
              </p>
              <div className="bg-amber-100 p-2 rounded text-xs font-mono">
                NEXT_PUBLIC_SUPABASE_URL=your-url<br/>
                NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Circle className="h-5 w-5 mt-0.5 text-amber-600" />
            <div>
              <p className="font-medium">3. Create Database Schema</p>
              <p className="text-sm text-amber-700">
                In Supabase SQL Editor, run the schema from <code className="bg-amber-100 px-1 rounded">supabase/schema.sql</code>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Circle className="h-5 w-5 mt-0.5 text-amber-600" />
            <div>
              <p className="font-medium">4. Configure Google OAuth</p>
              <p className="text-sm text-amber-700">
                Enable Google provider in Supabase Authentication settings
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 bg-amber-100 rounded-lg">
          <p className="text-sm font-medium">📖 Need detailed instructions?</p>
          <p className="text-sm">Check out <code>SETUP_GUIDE.md</code> in your project folder for step-by-step guidance.</p>
        </div>
      </CardContent>
    </Card>
  )
}