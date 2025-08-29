import { ProjectFolder } from '@/types/todo.types'

const STORAGE_KEY = 'project-folders'

export class ProjectFolderService {
  static getProjectFolders(): ProjectFolder[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading project folders:', error)
      return []
    }
  }

  static saveProjectFolders(folders: ProjectFolder[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(folders))
    } catch (error) {
      console.error('Error saving project folders:', error)
    }
  }

  static createFolder(name: string, projects: string[] = [], color?: string): ProjectFolder {
    const folder: ProjectFolder = {
      id: crypto.randomUUID(),
      name: name.trim(),
      projects,
      color
    }
    
    const folders = this.getProjectFolders()
    folders.push(folder)
    this.saveProjectFolders(folders)
    
    return folder
  }

  static updateFolder(id: string, updates: Partial<Omit<ProjectFolder, 'id'>>): ProjectFolder | null {
    const folders = this.getProjectFolders()
    const folderIndex = folders.findIndex(f => f.id === id)
    
    if (folderIndex === -1) return null
    
    folders[folderIndex] = { ...folders[folderIndex], ...updates }
    this.saveProjectFolders(folders)
    
    return folders[folderIndex]
  }

  static deleteFolder(id: string): boolean {
    const folders = this.getProjectFolders()
    const filteredFolders = folders.filter(f => f.id !== id)
    
    if (filteredFolders.length === folders.length) return false
    
    this.saveProjectFolders(filteredFolders)
    return true
  }

  static addProjectToFolder(folderId: string, project: string): boolean {
    const folders = this.getProjectFolders()
    const folder = folders.find(f => f.id === folderId)
    
    if (!folder || folder.projects.includes(project)) return false
    
    folder.projects.push(project)
    this.saveProjectFolders(folders)
    
    return true
  }

  static removeProjectFromFolder(folderId: string, project: string): boolean {
    const folders = this.getProjectFolders()
    const folder = folders.find(f => f.id === folderId)
    
    if (!folder) return false
    
    const initialLength = folder.projects.length
    folder.projects = folder.projects.filter(p => p !== project)
    
    if (folder.projects.length === initialLength) return false
    
    this.saveProjectFolders(folders)
    return true
  }

  static getFoldersContainingProject(project: string): ProjectFolder[] {
    return this.getProjectFolders().filter(folder => 
      folder.projects.includes(project)
    )
  }

  static getProjectsInFolders(folderIds: string[]): string[] {
    const folders = this.getProjectFolders()
    const projects = new Set<string>()
    
    folderIds.forEach(folderId => {
      const folder = folders.find(f => f.id === folderId)
      if (folder) {
        folder.projects.forEach(project => projects.add(project))
      }
    })
    
    return Array.from(projects)
  }
}