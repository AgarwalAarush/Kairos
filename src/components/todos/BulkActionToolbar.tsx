'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Check, 
  Trash2, 
  X, 
  Square, 
  CheckSquare,
  Keyboard
} from 'lucide-react'

interface BulkActionToolbarProps {
  selectedCount: number
  totalCount: number
  onBulkComplete: () => void
  onBulkDelete: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function BulkActionToolbar({
  selectedCount,
  totalCount,
  onBulkComplete,
  onBulkDelete,
  onSelectAll,
  onDeselectAll,
  onCancel,
  isLoading = false
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-card border rounded-lg shadow-lg p-4 animate-slide-in">
        <div className="flex items-center gap-3">
          {/* Selection Info */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedCount} of {totalCount} selected
            </Badge>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onBulkComplete}
              disabled={isLoading}
              className="h-8"
            >
              <Check className="h-4 w-4 mr-1" />
              Complete
            </Button>
            
            <Button
              size="sm"
              variant="destructive"
              onClick={onBulkDelete}
              disabled={isLoading}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Selection Controls */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
              className="h-8 px-2"
            >
              {selectedCount === totalCount ? (
                <Square className="h-4 w-4" />
              ) : (
                <CheckSquare className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Keyboard className="h-3 w-3" />
          <span>ESC: Cancel • DEL: Delete • ENTER: Complete • CTRL+A: Select All</span>
        </div>
      </div>
    </div>
  )
}