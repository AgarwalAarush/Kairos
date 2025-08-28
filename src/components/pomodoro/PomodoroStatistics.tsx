import { Card } from '@/components/ui/card'
import { PomodoroStatistics } from '@/lib/services/pomodoroService'
import { Clock, Target, Zap, TrendingUp } from 'lucide-react'

interface PomodoroStatisticsProps {
  statistics: PomodoroStatistics
}

export default function PomodoroStatisticsComponent({ statistics }: PomodoroStatisticsProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours === 0) {
      return `${mins}m`
    }
    return `${hours}h ${mins}m`
  }

  const completionRate = statistics.totalSessions > 0 
    ? Math.round((statistics.completedSessions / statistics.totalSessions) * 100) 
    : 0

  const interruptionRate = statistics.totalSessions > 0 
    ? Math.round((statistics.interruptedSessions / statistics.totalSessions) * 100)
    : 0

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-center">Your Pomodoro Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Study Time Stats */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Today</span>
          </div>
          <div className="text-2xl font-bold">{formatTime(statistics.todayStudyTime)}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">This Week</span>
          </div>
          <div className="text-2xl font-bold">{formatTime(statistics.weekStudyTime)}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">This Month</span>
          </div>
          <div className="text-2xl font-bold">{formatTime(statistics.monthStudyTime)}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Total Time</span>
          </div>
          <div className="text-2xl font-bold">{formatTime(statistics.totalStudyTime)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Session Stats */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
          <div className="text-xs text-muted-foreground">
            {statistics.completedSessions}/{statistics.totalSessions} sessions
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Interruptions</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{interruptionRate}%</div>
          <div className="text-xs text-muted-foreground">
            {statistics.interruptedSessions} interrupted
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Current Streak</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{statistics.currentStreak}</div>
          <div className="text-xs text-muted-foreground">sessions</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Best Streak</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{statistics.longestStreak}</div>
          <div className="text-xs text-muted-foreground">sessions</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Average Work Session</div>
          <div className="text-xl font-bold">{statistics.averageWorkDuration.toFixed(1)}m</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Average Break Length</div>
          <div className="text-xl font-bold">{statistics.averageBreakDuration.toFixed(1)}m</div>
        </Card>
      </div>
    </div>
  )
}