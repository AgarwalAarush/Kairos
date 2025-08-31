'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Check, 
  X, 
  RotateCcw, 
  Settings, 
  Zap,
  Trash2
} from 'lucide-react'
import { HabitsService } from '@/lib/services/habitsService'
import { Habit, HabitCompletion } from '@/types/database.types'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface HabitTrackerProps {
  userId: string
}

interface HabitWithCompletion extends Habit {
  todayCompletion: number
  completionRate: number
}

const HABIT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
]

export default function HabitTracker({ userId }: HabitTrackerProps) {
  const [habits, setHabits] = useState<HabitWithCompletion[]>([])
  const [_completions, setCompletions] = useState<HabitCompletion[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<string | null>(null)
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly',
    target_count: 1,
    color: HABIT_COLORS[0]
  })
  const [editHabit, setEditHabit] = useState({
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly',
    target_count: 1,
    color: HABIT_COLORS[0]
  })
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    habitId: string | null
    habitName: string
  }>({
    isOpen: false,
    habitId: null,
    habitName: ''
  })

  const loadHabits = useCallback(async () => {
    try {
      const [habitsData, completionsData] = await Promise.all([
        HabitsService.getUserHabits(userId),
        HabitsService.getTodayCompletions(userId)
      ])
      
      setCompletions(completionsData)
      
      // Enhance habits with completion data
      const habitsWithCompletion: HabitWithCompletion[] = habitsData.map(habit => {
        const todayCompletion = completionsData.find(c => c.habit_id === habit.id)?.count || 0
        const completionRate = Math.min((todayCompletion / habit.target_count) * 100, 100)
        
        return {
          ...habit,
          todayCompletion,
          completionRate
        }
      })
      
      setHabits(habitsWithCompletion)
    } catch (error) {
      console.error('Error loading habits:', error instanceof Error ? error.message : 'Unknown error', error)
      toast.error('Failed to load habits')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  const addHabit = async () => {
    if (!newHabit.name.trim()) return

    try {
      await HabitsService.createHabit({
        user_id: userId,
        name: newHabit.name.trim(),
        description: newHabit.description.trim() || null,
        frequency: newHabit.frequency,
        target_count: newHabit.target_count,
        color: newHabit.color
      })

      setNewHabit({
        name: '',
        description: '',
        frequency: 'daily',
        target_count: 1,
        color: HABIT_COLORS[0]
      })
      setShowAddForm(false)
      toast.success('Habit added successfully!')
      loadHabits()
    } catch (error) {
      console.error('Error adding habit:', error instanceof Error ? error.message : 'Unknown error', error)
      toast.error('Failed to add habit')
    }
  }

  const recordProgress = async (habitId: string, increment: number = 1) => {
    try {
      await HabitsService.recordCompletion(userId, habitId, new Date(), increment)
      toast.success('Progress recorded!')
      loadHabits()
    } catch (error) {
      console.error('Error recording progress:', error instanceof Error ? error.message : 'Unknown error', error)
      toast.error('Failed to record progress')
    }
  }

  const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
    try {
      await HabitsService.updateHabit(habitId, updates)
      setEditingHabit(null)
      toast.success('Habit updated!')
      loadHabits()
    } catch (error) {
      console.error('Error updating habit:', error instanceof Error ? error.message : 'Unknown error', error)
      toast.error('Failed to update habit')
    }
  }

  const deleteHabit = async (habitId: string) => {
    try {
      await HabitsService.deleteHabit(habitId)
      toast.success('Habit removed!')
      loadHabits()
    } catch (error) {
      console.error('Error deleting habit:', error instanceof Error ? error.message : 'Unknown error', error)
      toast.error('Failed to remove habit')
    }
  }

  const handleDeleteHabit = (habit: HabitWithCompletion) => {
    setDeleteConfirm({
      isOpen: true,
      habitId: habit.id,
      habitName: habit.name
    })
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    )
  }

  const completedHabits = habits.filter(h => h.todayCompletion >= h.target_count).length
  const totalHabits = habits.length
  const overallProgress = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="flex items-center gap-2">
              Daily Habits
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={overallProgress === 100 ? "default" : "secondary"}>
              {completedHabits}/{totalHabits} completed
            </Badge>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {totalHabits > 0 && (
          <Progress value={overallProgress} className="mt-2" />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new habit form */}
        {showAddForm && (
          <Card className="border-dashed">
            <CardContent className="pt-4 space-y-3">
              <Input
                placeholder="Habit name (e.g., 'Drink water', 'Exercise')"
                value={newHabit.name}
                onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newHabit.description}
                onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={newHabit.frequency}
                  onValueChange={(value: 'daily' | 'weekly') => setNewHabit({ ...newHabit, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Target count"
                  value={newHabit.target_count}
                  onChange={(e) => setNewHabit({ ...newHabit, target_count: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex gap-2">
                {HABIT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded-full border-2 ${
                      newHabit.color === color ? 'border-foreground' : 'border-muted'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewHabit({ ...newHabit, color })}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={addHabit}
                  disabled={!newHabit.name.trim()}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Add Habit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Habits list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {habits.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 col-span-full">
              No habits yet. Add one above to start tracking your daily routine!
            </p>
          ) : (
            habits
              .sort((a, b) => {
                const aCompleted = a.todayCompletion >= a.target_count
                const bCompleted = b.todayCompletion >= b.target_count
                if (aCompleted === bCompleted) return 0
                return aCompleted ? 1 : -1
              })
              .map((habit) => (
              <div
                key={habit.id}
                className={`group flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors ${
                  habit.todayCompletion >= habit.target_count 
                    ? 'opacity-60 bg-muted/20' 
                    : ''
                }`}
              >
                {/* Color indicator */}
                <div
                  className="w-1 h-12 rounded-full"
                  style={{ backgroundColor: habit.color || HABIT_COLORS[0] }}
                />
                
                {/* Habit info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium text-base md:text-sm ${
                      habit.todayCompletion >= habit.target_count 
                        ? 'line-through text-muted-foreground' 
                        : ''
                    }`}>
                      {habit.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {habit.todayCompletion}/{habit.target_count}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (editingHabit === habit.id) {
                            setEditingHabit(null)
                          } else {
                            setEditingHabit(habit.id)
                            setEditHabit({
                              name: habit.name,
                              description: habit.description || '',
                              frequency: habit.frequency,
                              target_count: habit.target_count,
                              color: habit.color || HABIT_COLORS[0]
                            })
                          }
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteHabit(habit)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {habit.description && (
                    <p className={`text-sm text-muted-foreground ${
                      habit.todayCompletion >= habit.target_count 
                        ? 'line-through opacity-75' 
                        : ''
                    }`}>
                      {habit.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <Progress value={habit.completionRate} />
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => recordProgress(habit.id, 1)}
                        disabled={habit.todayCompletion >= habit.target_count}
                        size="sm"
                        className="flex-1"
                      >
                        {habit.todayCompletion >= habit.target_count ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Mark Progress
                          </>
                        )}
                      </Button>
                      {habit.todayCompletion > 0 && (
                        <Button
                          onClick={() => recordProgress(habit.id, -1)}
                          variant="outline"
                          size="sm"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Edit form */}
                  {editingHabit === habit.id && (
                    <Card className="mt-3 border-dashed">
                      <CardContent className="pt-4 space-y-3">
                        <Input
                          placeholder="Habit name"
                          value={editHabit.name}
                          onChange={(e) => setEditHabit({ ...editHabit, name: e.target.value })}
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={editHabit.description}
                          onChange={(e) => setEditHabit({ ...editHabit, description: e.target.value })}
                          rows={2}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Select
                            value={editHabit.frequency}
                            onValueChange={(value: 'daily' | 'weekly') => setEditHabit({ ...editHabit, frequency: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="Target count"
                            value={editHabit.target_count}
                            onChange={(e) => setEditHabit({ ...editHabit, target_count: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div className="flex gap-2">
                          {HABIT_COLORS.map((color) => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded-full border-2 ${
                                editHabit.color === color ? 'border-foreground' : 'border-muted'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setEditHabit({ ...editHabit, color })}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              updateHabit(habit.id, editHabit)
                            }}
                            className="flex-1"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Update Habit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingHabit(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick stats */}
        {habits.length > 0 && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{completedHabits}</div>
              <div className="text-xs text-muted-foreground">Completed today</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{Math.round(overallProgress)}%</div>
              <div className="text-xs text-muted-foreground">Daily progress</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{totalHabits}</div>
              <div className="text-xs text-muted-foreground">Active habits</div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteConfirm.isOpen}
          onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, isOpen: open }))}
          title="Delete Habit"
          description={`Are you sure you want to delete "${deleteConfirm.habitName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={() => {
            if (deleteConfirm.habitId) {
              deleteHabit(deleteConfirm.habitId)
            }
          }}
        />
      </CardContent>
    </Card>
  )
}