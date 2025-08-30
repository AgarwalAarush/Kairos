'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format, parseISO } from 'date-fns'
import { DailyStats } from '@/lib/services/analyticsService'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface DailyChartProps {
  data: DailyStats[]
}

type ChartType = 'line' | 'bar'

export default function DailyChart({ data }: DailyChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line')

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d')
  }

  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean, 
    payload?: Array<{ value?: number, payload?: { completion_rate?: number } }>, 
    label?: string 
  }) => {
    if (active && payload && payload.length && label) {
      return (
        <div className="bg-card border rounded-lg shadow-lg p-3">
          <p className="font-medium">{format(parseISO(label), 'MMM d, yyyy')}</p>
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
              <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
              Rate: <span className="font-medium">{payload[2]?.value?.toFixed(1) || 0}%</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <p>No data available for the selected period</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Chart Type Toggle */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={chartType === 'line' ? 'default' : 'outline'}
          onClick={() => setChartType('line')}
        >
          Line Chart
        </Button>
        <Button
          size="sm"
          variant={chartType === 'bar' ? 'default' : 'outline'}
          onClick={() => setChartType('bar')}
        >
          Bar Chart
        </Button>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-xs text-muted-foreground"
              />
              <YAxis className="text-xs text-muted-foreground" />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="created" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-xs text-muted-foreground"
              />
              <YAxis className="text-xs text-muted-foreground" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="created" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Tasks Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Tasks Created</span>
        </div>
      </div>
    </div>
  )
}