import { Todo, AdvancedFilters, ProjectFolder, TodoFilters } from '@/types/todo.types'

export class AdvancedFilteringUtils {
  static applyFilters(todos: Todo[], filters: AdvancedFilters, projectFolders: ProjectFolder[]): Todo[] {
    let filtered = [...todos]

    // Apply completion filter
    if (filters.completed !== undefined) {
      filtered = filtered.filter(todo => todo.completed === filters.completed)
    }

    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter(todo => todo.priority === filters.priority)
    }

    // Apply tags filter with AND/OR logic
    if (filters.tags && filters.tags.values.length > 0) {
      filtered = filtered.filter(todo => {
        if (!todo.tags || todo.tags.length === 0) return false
        
        if (filters.tags!.connector === 'AND') {
          // All selected tags must be present
          return filters.tags!.values.every(tag => todo.tags!.includes(tag))
        } else {
          // At least one selected tag must be present (OR)
          return filters.tags!.values.some(tag => todo.tags!.includes(tag))
        }
      })
    }

    // Apply projects filter with AND/OR logic
    if (filters.projects && filters.projects.values.length > 0) {
      filtered = filtered.filter(todo => {
        if (!todo.project) return false
        
        if (filters.projects!.connector === 'AND') {
          // This doesn't make logical sense for single project per todo
          // So we treat it as exact match to any of the selected projects
          return filters.projects!.values.includes(todo.project)
        } else {
          // At least one selected project must match (OR)
          return filters.projects!.values.includes(todo.project)
        }
      })
    }

    // Apply project folders filter with AND/OR logic
    if (filters.projectFolders && filters.projectFolders.values.length > 0) {
      filtered = filtered.filter(todo => {
        if (!todo.project) return false
        
        if (filters.projectFolders!.connector === 'AND') {
          // For folders, AND means the project must be in ALL selected folders
          return filters.projectFolders!.values.every(folderId => {
            const folder = projectFolders.find(f => f.id === folderId)
            return folder && folder.projects.includes(todo.project!)
          })
        } else {
          // OR means the project must be in ANY of the selected folders
          return filters.projectFolders!.values.some(folderId => {
            const folder = projectFolders.find(f => f.id === folderId)
            return folder && folder.projects.includes(todo.project!)
          })
        }
      })
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      
      if (searchLower === 'overdue') {
        // Special case for overdue filter
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        filtered = filtered.filter(todo =>
          todo.due_date && 
          new Date(todo.due_date) < today && 
          !todo.completed
        )
      } else {
        // Regular text search
        filtered = filtered.filter(todo =>
          todo.title.toLowerCase().includes(searchLower) ||
          todo.description?.toLowerCase().includes(searchLower)
        )
      }
    }

    return filtered
  }

  static convertLegacyFilters(legacyFilters: TodoFilters): AdvancedFilters {
    const advanced: AdvancedFilters = {
      completed: legacyFilters.completed,
      priority: legacyFilters.priority,
      search: legacyFilters.search
    }

    if (legacyFilters.tags && legacyFilters.tags.length > 0) {
      advanced.tags = {
        values: legacyFilters.tags,
        connector: 'OR' // Default to OR for backward compatibility
      }
    }

    if (legacyFilters.project) {
      advanced.projects = {
        values: [legacyFilters.project],
        connector: 'OR'
      }
    }

    return advanced
  }

  static convertToLegacyFilters(advancedFilters: AdvancedFilters): TodoFilters {
    const legacy: TodoFilters = {
      completed: advancedFilters.completed,
      priority: advancedFilters.priority,
      search: advancedFilters.search
    }

    if (advancedFilters.tags && advancedFilters.tags.values.length > 0) {
      legacy.tags = advancedFilters.tags.values
    }

    if (advancedFilters.projects && advancedFilters.projects.values.length > 0) {
      // For legacy compatibility, just take the first project
      legacy.project = advancedFilters.projects.values[0]
    }

    return legacy
  }
}