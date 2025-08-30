'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { WeeklyStats } from '@/lib/services/analyticsService'

interface WeeklyChartProps {
  data: WeeklyStats[]
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  const formatWeek = (dateString: string) => {
    const date = parseISO(dateString)
    return format(date, 'MMM d')
  }

  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean, 
    payload?: Array<{ value?: number, payload?: { completion_rate?: number } }>, 
    label?: string 
  }) => {
    if (active && payload && payload.length && label) {
      const weekStart = parseISO(label)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      return (
        <div className="bg-card border rounded-lg shadow-lg p-3">
          <p className="font-medium">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
          </p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Completed: <span className="font-medium">{payload[0]?.value || 0}</span>
            </p>
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Created: <span className="font-medium">{payload[1]?.value || 0}</span>
            </p>
            <p className="text-sm">
              Rate: <span className="font-medium">{payload[0]?.payload?.completion_rate?.toFixed(1) || 0}%</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        <p>No weekly data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="week_start" 
              tickFormatter={formatWeek}
              className="text-xs text-muted-foreground"
            />
            <YAxis className="text-xs text-muted-foreground" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="created"
              stackId="1"
              stroke="#3b82f6"
              fill="url(#createdGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stackId="2"
              stroke="#22c55e"
              fill="url(#completedGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Created</span>
        </div>
      </div>
    </div>
  )
}