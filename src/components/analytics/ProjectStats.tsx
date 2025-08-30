'use client'

import { ProjectStats as ProjectStatsType } from '@/lib/services/analyticsService'
import { Progress } from '@/components/ui/progress'

interface ProjectStatsProps {
  data: ProjectStatsType[]
}

export default function ProjectStats({ data }: ProjectStatsProps) {
  const formatTime = (hours: number | null) => {
    if (!hours) return 'N/A'
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${hours.toFixed(1)}h`
    return `${Math.round(hours / 24)}d`
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No project data available</p>
        <p className="text-sm mt-1">Start using @project tags to see project analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {data.slice(0, 10).map((project) => (
        <div key={project.project} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm">@{project.project}</h4>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{project.completed}/{project.total} completed</span>
                <span>Avg: {formatTime(project.avg_completion_time_hours)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{project.completion_rate.toFixed(1)}%</p>
            </div>
          </div>
          <Progress value={project.completion_rate} className="h-2" />
        </div>
      ))}
      
      {data.length > 10 && (
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Showing top 10 projects ({data.length} total)
          </p>
        </div>
      )}
    </div>
  )
}