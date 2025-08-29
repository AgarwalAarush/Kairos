'use client'

import { useState, useEffect } from 'react'
import { ProjectFolder } from '@/types/todo.types'
import { ProjectFolderService } from '@/lib/services/projectFolderService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { 
  FolderPlus, 
  FolderOpen, 
  MoreVertical, 
  Edit2, 
  Trash2,
  X,
  Save
} from 'lucide-react'
import { toast } from 'sonner'

interface ProjectFolderManagerProps {
  availableProjects: string[]
  onFoldersChange?: (folders: ProjectFolder[]) => void
}

export default function ProjectFolderManager({ 
  availableProjects, 
  onFoldersChange 
}: ProjectFolderManagerProps) {
  const [folders, setFolders] = useState<ProjectFolder[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  // Load folders on mount
  useEffect(() => {
    const loadedFolders = ProjectFolderService.getProjectFolders()
    setFolders(loadedFolders)
    onFoldersChange?.(loadedFolders)
  }, [onFoldersChange])

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name')
      return
    }

    try {
      const newFolder = ProjectFolderService.createFolder(newFolderName, selectedProjects)
      const updatedFolders = [...folders, newFolder]
      setFolders(updatedFolders)
      onFoldersChange?.(updatedFolders)
      
      // Reset form
      setNewFolderName('')
      setSelectedProjects([])
      setIsCreateDialogOpen(false)
      
      toast.success(`Folder "${newFolder.name}" created successfully`)
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error('Failed to create folder')
    }
  }

  const handleUpdateFolder = () => {
    if (!editingFolder || !newFolderName.trim()) {
      toast.error('Please enter a folder name')
      return
    }

    try {
      ProjectFolderService.updateFolder(editingFolder.id, {
        name: newFolderName,
        projects: selectedProjects
      })
      
      const updatedFolders = folders.map(f => 
        f.id === editingFolder.id 
          ? { ...f, name: newFolderName, projects: selectedProjects }
          : f
      )
      setFolders(updatedFolders)
      onFoldersChange?.(updatedFolders)
      
      // Reset form
      setEditingFolder(null)
      setNewFolderName('')
      setSelectedProjects([])
      
      toast.success(`Folder updated successfully`)
    } catch (error) {
      console.error('Error updating folder:', error)
      toast.error('Failed to update folder')
    }
  }

  const handleDeleteFolder = (folder: ProjectFolder) => {
    try {
      ProjectFolderService.deleteFolder(folder.id)
      const updatedFolders = folders.filter(f => f.id !== folder.id)
      setFolders(updatedFolders)
      onFoldersChange?.(updatedFolders)
      
      toast.success(`Folder "${folder.name}" deleted successfully`)
    } catch (error) {
      console.error('Error deleting folder:', error)
      toast.error('Failed to delete folder')
    }
  }

  const startEditing = (folder: ProjectFolder) => {
    setEditingFolder(folder)
    setNewFolderName(folder.name)
    setSelectedProjects([...folder.projects])
  }

  const cancelEditing = () => {
    setEditingFolder(null)
    setNewFolderName('')
    setSelectedProjects([])
  }

  const toggleProjectSelection = (project: string) => {
    setSelectedProjects(prev => 
      prev.includes(project)
        ? prev.filter(p => p !== project)
        : [...prev, project]
    )
  }

  const resetCreateForm = () => {
    setNewFolderName('')
    setSelectedProjects([])
    setIsCreateDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Project Folders
        </h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project Folder</DialogTitle>
              <DialogDescription>
                Create a folder to group related projects together for easier filtering.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Folder Name</label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Work Projects, Personal, etc."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Projects ({selectedProjects.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                  {availableProjects.length > 0 ? (
                    <div className="space-y-1">
                      {availableProjects.map((project) => (
                        <label key={project} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedProjects.includes(project)}
                            onChange={() => toggleProjectSelection(project)}
                            className="rounded"
                          />
                          <span className="text-sm">{project}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No projects available</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetCreateForm}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>
                Create Folder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {folders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No project folders created yet</p>
                <p className="text-sm">Create folders to organize your projects for easier filtering</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          folders.map((folder) => (
            <Card key={folder.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    {editingFolder?.id === folder.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="h-8"
                        />
                        <Button size="sm" variant="ghost" onClick={handleUpdateFolder}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      folder.name
                    )}
                  </CardTitle>
                  {editingFolder?.id !== folder.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditing(folder)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteFolder(folder)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingFolder?.id === folder.id ? (
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                    {availableProjects.map((project) => (
                      <label key={project} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project)}
                          onChange={() => toggleProjectSelection(project)}
                          className="rounded"
                        />
                        <span className="text-sm">{project}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {folder.projects.length > 0 ? (
                      folder.projects.map((project) => (
                        <Badge key={project} variant="secondary" className="text-xs">
                          {project}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No projects in this folder</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}