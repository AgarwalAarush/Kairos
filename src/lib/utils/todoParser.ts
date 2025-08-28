import { ParsedTodoData } from '@/types/todo.types'
import * as chrono from 'chrono-node'

export class TodoParser {
  static parse(text: string): ParsedTodoData {
    // Extract hashtags (#tag)
    const tagRegex = /#(\w+)/g
    const tags: string[] = []
    let match
    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[1])
    }

    // Extract project (@project)
    const projectRegex = /@(\w+)/g
    const projectMatch = projectRegex.exec(text)
    const project = projectMatch ? projectMatch[1] : undefined

    // Extract priority (!!! = 3, !! = 2, ! = 1)
    let priority: 1 | 2 | 3 | undefined
    if (text.includes('!!!')) {
      priority = 3 // lowest priority
    } else if (text.includes('!!')) {
      priority = 2 // medium priority
    } else if (text.includes('!')) {
      priority = 1 // highest priority
    }

    // Parse natural language dates using chrono
    const parsedDates = chrono.parse(text, new Date(), { forwardDate: true })
    const extractedDates = parsedDates.map(result => ({
      text: result.text,
      date: result.start.date(),
      type: this.classifyDateType(result.text) as 'due' | 'work' | 'general'
    }))

    // Determine due_date and work_date from extracted dates
    let due_date: Date | undefined
    let work_date: Date | undefined

    for (const extracted of extractedDates) {
      if (extracted.type === 'due' && !due_date) {
        due_date = extracted.date
      } else if (extracted.type === 'work' && !work_date) {
        work_date = extracted.date
      } else if (extracted.type === 'general' && !due_date) {
        // Use general dates as due dates if no specific due date found
        due_date = extracted.date
      }
    }

    // Clean the title by removing extracted elements and date expressions
    let cleanTitle = text
      .replace(/#\w+/g, '') // remove hashtags
      .replace(/@\w+/g, '') // remove projects
      .replace(/!+/g, '') // remove priority indicators

    // Remove recognized date expressions from title
    for (const dateResult of parsedDates) {
      cleanTitle = cleanTitle.replace(dateResult.text, '')
    }

    cleanTitle = cleanTitle
      .trim()
      .replace(/\s+/g, ' ') // normalize whitespace
      .replace(/^(by|due|until|before|on|at)\s+/i, '') // remove common date prefixes
      .trim()

    return {
      title: cleanTitle || text, // fallback to original if title becomes empty
      tags: [...new Set(tags)], // deduplicate
      project,
      priority,
      due_date,
      work_date,
      extractedDates,
    }
  }

  // Helper method to classify date types based on context
  private static classifyDateType(dateText: string): 'due' | 'work' | 'general' {
    const lowerText = dateText.toLowerCase()
    
    // Due date indicators
    if (lowerText.match(/\b(by|due|deadline|until|before)\b/)) {
      return 'due'
    }
    
    // Work date indicators
    if (lowerText.match(/\b(work on|start|begin|schedule)\b/)) {
      return 'work'
    }
    
    return 'general'
  }

  static formatTodoText(title: string, tags?: string[], project?: string, priority?: 1 | 2 | 3): string {
    let formatted = title

    // Add tags
    if (tags?.length) {
      formatted += ' ' + tags.map(tag => `#${tag}`).join(' ')
    }

    // Add project
    if (project) {
      formatted += ` @${project}`
    }

    // Add priority
    if (priority === 1) {
      formatted += ' !'
    } else if (priority === 2) {
      formatted += ' !!'
    } else if (priority === 3) {
      formatted += ' !!!'
    }

    return formatted.trim()
  }

  static getPriorityLabel(priority?: 1 | 2 | 3): string {
    switch (priority) {
      case 1:
        return 'High'
      case 2:
        return 'Medium'
      case 3:
        return 'Low'
      default:
        return 'None'
    }
  }

  static getPriorityIcon(priority?: 1 | 2 | 3): string {
    switch (priority) {
      case 1:
        return '!'
      case 2:
        return '!!'
      case 3:
        return '!!!'
      default:
        return ''
    }
  }
}