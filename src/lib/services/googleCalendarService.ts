import { CalendarEvent } from '@/components/Calendar'

interface GoogleCalendarEvent {
  id: string
  summary: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  colorId?: string
}

interface GoogleCalendar {
  id: string
  summary: string
  primary?: boolean
}

const colorMap = {
  '1': 'blue' as const,
  '2': 'green' as const,
  '3': 'purple' as const,
  '4': 'pink' as const,
  '5': 'default' as const,
}

export class GoogleCalendarService {
  private static readonly BASE_URL = 'https://www.googleapis.com/calendar/v3'
  
  static async getEvents(accessToken: string, calendarId: string = 'primary'): Promise<CalendarEvent[]> {
    try {
      const timeMin = new Date()
      timeMin.setDate(timeMin.getDate() - 7) // Get events from 1 week ago
      
      const timeMax = new Date()
      timeMax.setDate(timeMax.getDate() + 30) // Get events up to 30 days ahead
      
      const response = await fetch(
        `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?` +
        new URLSearchParams({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: '250'
        }),
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar events: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.items) {
        return []
      }

      return data.items
        .filter((event: GoogleCalendarEvent) => event.start && event.end)
        .map((event: GoogleCalendarEvent) => this.transformEvent(event))
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error)
      throw error
    }
  }

  static async getCalendars(accessToken: string): Promise<{ id: string; summary: string; primary?: boolean }[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/users/me/calendarList`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch calendars: ${response.statusText}`)
      }

      const data = await response.json()
      
      return data.items?.map((calendar: GoogleCalendar) => ({
        id: calendar.id,
        summary: calendar.summary,
        primary: calendar.primary
      })) || []
    } catch (error) {
      console.error('Error fetching Google Calendars:', error)
      throw error
    }
  }

  private static transformEvent(event: GoogleCalendarEvent): CalendarEvent {
    const start = this.parseDateTime(event.start)
    const end = this.parseDateTime(event.end)
    
    return {
      id: event.id,
      title: event.summary || 'Untitled Event',
      start,
      end,
      color: colorMap[event.colorId as keyof typeof colorMap] || 'default'
    }
  }

  private static parseDateTime(dateTime: { dateTime?: string; date?: string }): Date {
    if (dateTime.dateTime) {
      return new Date(dateTime.dateTime)
    } else if (dateTime.date) {
      return new Date(dateTime.date + 'T00:00:00')
    }
    return new Date()
  }
}