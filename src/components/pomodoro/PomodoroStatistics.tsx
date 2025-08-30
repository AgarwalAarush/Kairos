import { Card } from '@/components/ui/card'
import { PomodoroStatistics } from '@/lib/services/pomodoroService'
import { Clock, Target, Zap, TrendingUp, Calendar, Timer } from 'lucide-react'

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
      <h3 className="text-2xl font-light mb-8 text-center text-foreground tracking-wide" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
        Your Focus Statistics
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {/* Study Time Stats */}
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Today</span>
          </div>
          <div className="text-3xl font-light text-blue-900 dark:text-blue-100" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            {formatTime(statistics.todayStudyTime)}
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">This Week</span>
          </div>
          <div className="text-3xl font-light text-emerald-900 dark:text-emerald-100" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            {formatTime(statistics.weekStudyTime)}
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900/50">
              <Calendar className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-sm font-medium text-violet-800 dark:text-violet-200">This Month</span>
          </div>
          <div className="text-3xl font-light text-violet-900 dark:text-violet-100" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            {formatTime(statistics.monthStudyTime)}
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
              <Timer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">All Time</span>
          </div>
          <div className="text-3xl font-light text-amber-900 dark:text-amber-100" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            {formatTime(statistics.totalStudyTime)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Session Stats */}
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
              <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-green-800 dark:text-green-200">Success Rate</span>
          </div>
          <div className="text-3xl font-light text-green-900 dark:text-green-100 mb-1" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            {completionRate}%
          </div>
          <div className="text-xs text-green-600/70 dark:text-green-400/70">
            {statistics.completedSessions}/{statistics.totalSessions} sessions
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/50">
              <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Interruptions</span>
          </div>
          <div className="text-3xl font-light text-orange-900 dark:text-orange-100 mb-1" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            {interruptionRate}%
          </div>
          <div className="text-xs text-orange-600/70 dark:text-orange-400/70">
            {statistics.interruptedSessions} interrupted
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-cyan-100 dark:bg-cyan-900/50">
              <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <span className="text-sm font-medium text-cyan-800 dark:text-cyan-200">Current Streak</span>
          </div>
          <div className="text-3xl font-light text-cyan-900 dark:text-cyan-100 mb-1" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            {statistics.currentStreak}
          </div>
          <div className="text-xs text-cyan-600/70 dark:text-cyan-400/70">sessions</div>
        </Card>

        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/50">
              <TrendingUp className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <span className="text-sm font-medium text-pink-800 dark:text-pink-200">Best Streak</span>
          </div>
          <div className="text-3xl font-light text-pink-900 dark:text-pink-100 mb-1" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            {statistics.longestStreak}
          </div>
          <div className="text-xs text-pink-600/70 dark:text-pink-400/70">sessions</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-900/50">
              <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Average Work Session</span>
          </div>
          <div className="text-3xl font-light text-slate-900 dark:text-slate-100" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            {statistics.averageWorkDuration.toFixed(1)}m
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
              <Timer className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Average Break Length</span>
          </div>
          <div className="text-3xl font-light text-indigo-900 dark:text-indigo-100" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            {statistics.averageBreakDuration.toFixed(1)}m
          </div>
        </Card>
      </div>
    </div>
  )
}