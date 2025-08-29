'use client'

import { useState, useEffect } from 'react'
import { AdvancedFilters, FilterConnector, ProjectFolder } from '@/types/todo.types'
import { ProjectFolderService } from '@/lib/services/projectFolderService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  X, 
  Hash,
  AtSign,
  FolderOpen,
  Settings
} from 'lucide-react'
import ProjectFolderManager from './ProjectFolderManager'

interface AdvancedFiltersProps {
  filters: AdvancedFilters
  availableTags: string[]
  availableProjects: string[]
  onFiltersChange: (filters: AdvancedFilters) => void
  totalCount: number
  filteredCount: number
}

export default function AdvancedFiltersComponent({
  filters,
  availableTags,
  availableProjects,
  onFiltersChange,
  totalCount,
  filteredCount
}: AdvancedFiltersProps) {
  const [projectFolders, setProjectFolders] = useState<ProjectFolder[]>([])
  const [showFolderManager, setShowFolderManager] = useState(false)

  // Load project folders
  useEffect(() => {
    const folders = ProjectFolderService.getProjectFolders()
    setProjectFolders(folders)
  }, [])

  const hasActiveFilters = !!(
    filters.completed !== undefined ||
    (filters.tags && filters.tags.values.length > 0) ||
    (filters.projects && filters.projects.values.length > 0) ||
    (filters.projectFolders && filters.projectFolders.values.length > 0) ||
    filters.priority ||
    filters.search
  )

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  // Tag filter handlers
  const toggleTag = (tag: string) => {
    const currentTags = filters.tags?.values || []
    const isSelected = currentTags.includes(tag)
    
    const newValues = isSelected 
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]

    onFiltersChange({
      ...filters,
      tags: newValues.length > 0 ? {
        values: newValues,
        connector: filters.tags?.connector || 'OR'
      } : undefined
    })
  }

  const setTagConnector = (connector: FilterConnector) => {
    if (filters.tags) {
      onFiltersChange({
        ...filters,
        tags: { ...filters.tags, connector }
      })
    }
  }

  const removeTag = (tag: string) => {
    toggleTag(tag) // This will remove it since it's already selected
  }

  // Project filter handlers
  const toggleProject = (project: string) => {
    const currentProjects = filters.projects?.values || []
    const isSelected = currentProjects.includes(project)
    
    const newValues = isSelected 
      ? currentProjects.filter(p => p !== project)
      : [...currentProjects, project]

    onFiltersChange({
      ...filters,
      projects: newValues.length > 0 ? {
        values: newValues,
        connector: filters.projects?.connector || 'OR'
      } : undefined
    })
  }

  const setProjectConnector = (connector: FilterConnector) => {
    if (filters.projects) {
      onFiltersChange({
        ...filters,
        projects: { ...filters.projects, connector }
      })
    }
  }

  const removeProject = (project: string) => {
    toggleProject(project)
  }

  // Project folder handlers
  const toggleProjectFolder = (folderId: string) => {
    const currentFolders = filters.projectFolders?.values || []
    const isSelected = currentFolders.includes(folderId)
    
    const newValues = isSelected 
      ? currentFolders.filter(f => f !== folderId)
      : [...currentFolders, folderId]

    onFiltersChange({
      ...filters,
      projectFolders: newValues.length > 0 ? {
        values: newValues,
        connector: filters.projectFolders?.connector || 'OR'
      } : undefined
    })
  }

  const setProjectFolderConnector = (connector: FilterConnector) => {
    if (filters.projectFolders) {
      onFiltersChange({
        ...filters,
        projectFolders: { ...filters.projectFolders, connector }
      })
    }
  }

  const removeProjectFolder = (folderId: string) => {
    toggleProjectFolder(folderId)
  }

  return (
    <div className="space-y-4">
      {/* Multi-select Filter Controls */}
      <div className="flex flex-wrap gap-2">
        {/* Completion Status Filter */}
        <Select
          value={filters.completed === undefined ? 'all' : filters.completed ? 'completed' : 'pending'}
          onValueChange={(value) => {
            const completed = value === 'all' ? undefined : value === 'completed'
            onFiltersChange({ ...filters, completed })
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filters.priority?.toString() || 'all'}
          onValueChange={(value) => {
            const priority = value === 'all' ? undefined : parseInt(value) as 1 | 2 | 3
            onFiltersChange({ ...filters, priority })
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="1">High !</SelectItem>
            <SelectItem value="2">Medium !!</SelectItem>
            <SelectItem value="3">Low !!!</SelectItem>
          </SelectContent>
        </Select>

        {/* Tags Multi-Select */}
        {availableTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Hash className="h-4 w-4 mr-1" />
                Tags ({filters.tags?.values.length || 0})
                {filters.tags && filters.tags.values.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {filters.tags.connector}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-64 overflow-y-auto w-64">
              <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
              {filters.tags && filters.tags.values.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1">
                    <label className="text-xs font-medium">Match:</label>
                    <div className="flex gap-1 mt-1">
                      <Button
                        size="sm"
                        variant={filters.tags.connector === 'OR' ? 'default' : 'outline'}
                        className="h-6 text-xs"
                        onClick={() => setTagConnector('OR')}
                      >
                        Any (OR)
                      </Button>
                      <Button
                        size="sm"
                        variant={filters.tags.connector === 'AND' ? 'default' : 'outline'}
                        className="h-6 text-xs"
                        onClick={() => setTagConnector('AND')}
                      >
                        All (AND)
                      </Button>
                    </div>
                  </div>
                </>
              )}
              <DropdownMenuSeparator />
              {availableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={filters.tags?.values.includes(tag) || false}
                  onCheckedChange={() => toggleTag(tag)}
                >
                  #{tag}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Projects Multi-Select */}
        {availableProjects.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <AtSign className="h-4 w-4 mr-1" />
                Projects ({filters.projects?.values.length || 0})
                {filters.projects && filters.projects.values.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {filters.projects.connector}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-64 overflow-y-auto w-64">
              <DropdownMenuLabel>Filter by Projects</DropdownMenuLabel>
              {filters.projects && filters.projects.values.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1">
                    <label className="text-xs font-medium">Match:</label>
                    <div className="flex gap-1 mt-1">
                      <Button
                        size="sm"
                        variant={filters.projects.connector === 'OR' ? 'default' : 'outline'}
                        className="h-6 text-xs"
                        onClick={() => setProjectConnector('OR')}
                      >
                        Any (OR)
                      </Button>
                    </div>
                  </div>
                </>
              )}
              <DropdownMenuSeparator />
              {availableProjects.map((project) => (
                <DropdownMenuCheckboxItem
                  key={project}
                  checked={filters.projects?.values.includes(project) || false}
                  onCheckedChange={() => toggleProject(project)}
                >
                  @{project}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Project Folders Multi-Select */}
        {projectFolders.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderOpen className="h-4 w-4 mr-1" />
                Folders ({filters.projectFolders?.values.length || 0})
                {filters.projectFolders && filters.projectFolders.values.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {filters.projectFolders.connector}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-64 overflow-y-auto w-64">
              <DropdownMenuLabel>Filter by Project Folders</DropdownMenuLabel>
              {filters.projectFolders && filters.projectFolders.values.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1">
                    <label className="text-xs font-medium">Match:</label>
                    <div className="flex gap-1 mt-1">
                      <Button
                        size="sm"
                        variant={filters.projectFolders.connector === 'OR' ? 'default' : 'outline'}
                        className="h-6 text-xs"
                        onClick={() => setProjectFolderConnector('OR')}
                      >
                        Any (OR)
                      </Button>
                      <Button
                        size="sm"
                        variant={filters.projectFolders.connector === 'AND' ? 'default' : 'outline'}
                        className="h-6 text-xs"
                        onClick={() => setProjectFolderConnector('AND')}
                      >
                        All (AND)
                      </Button>
                    </div>
                  </div>
                </>
              )}
              <DropdownMenuSeparator />
              {projectFolders.map((folder) => (
                <DropdownMenuCheckboxItem
                  key={folder.id}
                  checked={filters.projectFolders?.values.includes(folder.id) || false}
                  onCheckedChange={() => toggleProjectFolder(folder.id)}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {folder.name} ({folder.projects.length})
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Folder Manager */}
        <Dialog open={showFolderManager} onOpenChange={setShowFolderManager}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Manage Folders
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Project Folders</DialogTitle>
              <DialogDescription>
                Create and manage folders to organize your projects for advanced filtering.
              </DialogDescription>
            </DialogHeader>
            <ProjectFolderManager 
              availableProjects={availableProjects}
              onFoldersChange={setProjectFolders}
            />
          </DialogContent>
        </Dialog>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.completed !== undefined && (
            <Badge variant="secondary">
              {filters.completed ? 'Completed' : 'Pending'}
              <button
                onClick={() => onFiltersChange({ ...filters, completed: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.priority && (
            <Badge variant="secondary">
              Priority: {filters.priority === 1 ? 'High' : filters.priority === 2 ? 'Medium' : 'Low'}
              <button
                onClick={() => onFiltersChange({ ...filters, priority: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.tags?.values.map((tag) => (
            <Badge key={tag} variant="secondary">
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.projects?.values.map((project) => (
            <Badge key={project} variant="secondary">
              @{project}
              <button
                onClick={() => removeProject(project)}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.projectFolders?.values.map((folderId) => {
            const folder = projectFolders.find(f => f.id === folderId)
            return folder ? (
              <Badge key={folderId} variant="secondary">
                <FolderOpen className="h-3 w-3 mr-1" />
                {folder.name}
                <button
                  onClick={() => removeProjectFolder(folderId)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null
          })}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCount} of {totalCount} todos
      </div>
    </div>
  )
}