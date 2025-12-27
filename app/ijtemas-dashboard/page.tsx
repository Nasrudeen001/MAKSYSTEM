"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNavigation } from "@/components/main-navigation"
import { Calendar, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Event = {
  id: string
  event_name: string
  event_location?: string
  event_start_date?: string
  total_days?: number
  is_active?: boolean
  created_at?: string
}

type Attendee = {
  participant_id: string
  event_id: string
}

export default function IjtemasDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    averageAttendeesPerEvent: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient()

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('event_settings')
          .select('*')

        if (eventsError) throw eventsError

        const events: Event[] = eventsData || []

        // Fetch attendance
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('event_attendance')
          .select('*')

        if (attendanceError) throw attendanceError

        const attendance: Attendee[] = attendanceData || []

        const totalEvents = events.length
        const totalAttendees = attendance.length
        const averageAttendeesPerEvent = totalEvents > 0 ? Math.round(totalAttendees / totalEvents) : 0

        setStats({
          totalEvents,
          averageAttendeesPerEvent
        })
      } catch (error) {
        console.error('Error fetching event stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading Ijtemas Dashboard...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Ijtemas Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of event and attendance statistics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Number of Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendees/Event</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageAttendeesPerEvent}</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}