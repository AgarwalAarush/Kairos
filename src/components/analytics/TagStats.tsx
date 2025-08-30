'use client'

import { TagStats as TagStatsType } from '@/lib/services/analyticsService'
import { Badge } from '@/components/ui/badge'

interface TagStatsProps {
  data: TagStatsType[]
}

export default function TagStats({ data }: TagStatsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No tag data available</p>
        <p className="text-sm mt-1">Start using #tags to see tag analytics</p>
      </div>
    )
  }

  // Group tags by completion rate for visual organization
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (rate >= 60) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (rate >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getCompletionLabel = (rate: number) => {
    if (rate >= 80) return 'High'
    if (rate >= 60) return 'Good'
    if (rate >= 40) return 'Fair'
    return 'Low'
  }

  return (
    <div className="space-y-6">
      {/* Top performing tags */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Most Used Tags</h4>
        <div className="flex flex-wrap gap-2">
          {data.slice(0, 15).map((tag) => (
            <div key={tag.tag} className="relative">
              <Badge
                variant="secondary"
                className={`px-3 py-1 text-xs ${getCompletionColor(tag.completion_rate)}`}
              >
                #{tag.tag}
                <span className="ml-2 text-[10px] opacity-70">
                  {tag.completed}/{tag.total}
                </span>
              </Badge>
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-current opacity-30 transition-all"
                  style={{ width: `${tag.completion_rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion rate breakdown */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Completion Rates</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'High (80%+)', color: 'bg-green-100 border-green-200', tags: data.filter(t => t.completion_rate >= 80) },
            { label: 'Good (60-79%)', color: 'bg-blue-100 border-blue-200', tags: data.filter(t => t.completion_rate >= 60 && t.completion_rate < 80) },
            { label: 'Fair (40-59%)', color: 'bg-yellow-100 border-yellow-200', tags: data.filter(t => t.completion_rate >= 40 && t.completion_rate < 60) },
            { label: 'Low (<40%)', color: 'bg-red-100 border-red-200', tags: data.filter(t => t.completion_rate < 40) }
          ].map((group) => (
            <div key={group.label} className={`${group.color} border rounded-lg p-3`}>
              <div className="text-center">
                <p className="text-sm font-medium">{group.label}</p>
                <p className="text-2xl font-bold mt-1">{group.tags.length}</p>
                <p className="text-xs text-muted-foreground">tags</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed breakdown */}
      {data.length > 15 && (
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">All Tags</h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {data.map((tag) => (
              <div key={tag.tag} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    #{tag.tag}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {tag.completed}/{tag.total} tasks
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${getCompletionColor(tag.completion_rate)}`}>
                    {getCompletionLabel(tag.completion_rate)} ({tag.completion_rate.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}