'use client'

import { CheckCircle, Clock, TrendingUp, Calendar } from 'lucide-react'
import { OverallStats } from '@/lib/services/analyticsService'

interface StatsCardsProps {
  stats: OverallStats
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const formatTime = (hours: number | null) => {
    if (!hours) return 'N/A'
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${hours.toFixed(1)}h`
    return `${Math.round(hours / 24)}d`
  }

  const cards = [
    {
      title: 'Total Tasks',
      value: stats.total_tasks.toString(),
      subtitle: `${stats.pending_tasks} pending`,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Completion Rate',
      value: `${stats.completion_rate.toFixed(1)}%`,
      subtitle: `${stats.completed_tasks} of ${stats.total_tasks} completed`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Avg. Completion Time',
      value: formatTime(stats.avg_completion_time_hours),
      subtitle: stats.most_productive_day ? `Best: ${stats.most_productive_day}` : 'No data yet',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Recent Activity',
      value: stats.tasks_completed_today.toString(),
      subtitle: `${stats.tasks_completed_this_week} this week, ${stats.tasks_completed_this_month} this month`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.title} className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              </div>
              <div className={`${card.bgColor} ${card.color} p-3 rounded-full`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}