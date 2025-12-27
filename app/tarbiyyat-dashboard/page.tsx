"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNavigation } from "@/components/main-navigation"
import { BookOpen, Calendar, TrendingUp, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

type AcademicRecord = {
  id: string
  participant_id: string
  report_month: string
  report_year: number
  avg_prayers_per_day?: number
  tilawat_days?: number
  tahajjud_days?: number
  quran_classes_attended?: number
  friday_prayers?: number
  friday_sermons?: number
  nafli_fasts?: number
  created_at: string
}

export default function TarbiyyatDashboard() {
  const [stats, setStats] = useState({
    totalRecords: 0,
    uniqueParticipants: 0,
    averagePrayers: 0,
    averageTilawat: 0,
    byMonth: {} as Record<string, number>
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient()
        const { data: academicData, error } = await supabase
          .from('academic_data')
          .select('*')

        if (error) throw error

        const records: AcademicRecord[] = academicData || []

        const totalRecords = records.length
        const participants = new Set<string>()
        let totalPrayers = 0
        let totalTilawat = 0
        let prayersCount = 0
        let tilawatCount = 0
        const byMonth: Record<string, number> = {}

        records.forEach(r => {
          participants.add(r.participant_id)

          if (r.avg_prayers_per_day) {
            totalPrayers += r.avg_prayers_per_day
            prayersCount++
          }

          if (r.tilawat_days) {
            totalTilawat += r.tilawat_days
            tilawatCount++
          }

          const monthKey = `${r.report_month} ${r.report_year}`
          byMonth[monthKey] = (byMonth[monthKey] || 0) + 1
        })

        const averagePrayers = prayersCount > 0 ? totalPrayers / prayersCount : 0
        const averageTilawat = tilawatCount > 0 ? totalTilawat / tilawatCount : 0

        setStats({
          totalRecords,
          uniqueParticipants: participants.size,
          averagePrayers: Math.round(averagePrayers * 10) / 10,
          averageTilawat: Math.round(averageTilawat * 10) / 10,
          byMonth
        })
      } catch (error) {
        console.error('Error fetching academic stats:', error)
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
          <div className="text-center">Loading Tarbiyyat Dashboard...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Tarbiyyat Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of academic performance statistics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecords}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueParticipants}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Prayers/Day</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averagePrayers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Tilawat Days</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageTilawat}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Records by Month</CardTitle>
              <CardDescription>Number of academic records per month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byMonth).slice(0, 10).map(([month, count]) => (
                  <div key={month} className="flex justify-between items-center">
                    <span className="text-sm">{month}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic Metrics Summary</CardTitle>
              <CardDescription>Average performance across all records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Prayers per Day</span>
                  <Badge variant="secondary">{stats.averagePrayers}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Tilawat Days</span>
                  <Badge variant="secondary">{stats.averageTilawat}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Academic Records</span>
                  <Badge variant="secondary">{stats.totalRecords}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Unique Participants</span>
                  <Badge variant="secondary">{stats.uniqueParticipants}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}