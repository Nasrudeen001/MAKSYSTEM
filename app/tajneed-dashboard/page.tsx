"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNavigation } from "@/components/main-navigation"
import { Users, UserCheck, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Participant = {
  id: string
  full_name: string
  category: string
  region?: string
  majlis?: string
  date_of_birth?: string
  status?: string
}

export default function TajneedDashboard() {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    safAwwal: 0,
    safDom: 0,
    totalRegions: 0,
    byCategory: {} as Record<string, number>,
    byRegion: {} as Record<string, number>
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/participants')
        if (!response.ok) throw new Error('Failed to fetch participants')
        const participants: Participant[] = await response.json()

        const totalParticipants = participants.length

        const computeAge = (dob?: string): number | undefined => {
          if (!dob) return undefined
          const today = new Date()
          const birthDate = new Date(dob)
          const age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age
        }

        const deriveCategory = (dob?: string, stored?: string): string => {
          const age = computeAge(dob)
          if (age === undefined) return stored || ""
          if (age > 55) return "Saf Awwal"
          if (age >= 40 && age <= 55) return "Saf Dom"
          return "General"
        }

        const safAwwal = participants.filter(p => deriveCategory(p.date_of_birth, p.category) === "Saf Awwal").length
        const safDom = participants.filter(p => deriveCategory(p.date_of_birth, p.category) === "Saf Dom").length
        const totalRegions = new Set(participants.map(p => p.region).filter(Boolean)).size

        const byCategory: Record<string, number> = {}
        const byRegion: Record<string, number> = {}

        participants.forEach(p => {
          const derivedCat = deriveCategory(p.date_of_birth, p.category)
          byCategory[derivedCat] = (byCategory[derivedCat] || 0) + 1

          if (p.region) {
            byRegion[p.region] = (byRegion[p.region] || 0) + 1
          }
        })

        setStats({
          totalParticipants,
          safAwwal,
          safDom,
          totalRegions,
          byCategory,
          byRegion
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
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
          <div className="text-center">Loading Tajneed Dashboard...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Tajneed Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of participant statistics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-md">
            <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Saf Awwal</CardTitle>
              <UserCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.safAwwal}</div>
              <p className="text-xs text-muted-foreground">Above 55 years</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Saf Dom</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.safDom}</div>
              <p className="text-xs text-muted-foreground">40-55 years</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Total Members</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.totalParticipants}</div>
              <p className="text-xs text-muted-foreground">All registered Ansar</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Members by Category</CardTitle>
              <CardDescription>Distribution of participants across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm">{category}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Members by Region</CardTitle>
              <CardDescription>Distribution of participants across regions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byRegion).slice(0, 10).map(([region, count]) => (
                  <div key={region} className="flex justify-between items-center">
                    <span className="text-sm">{region}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
                {Object.keys(stats.byRegion).length > 10 && (
                  <div className="text-sm text-muted-foreground text-center">
                    And {Object.keys(stats.byRegion).length - 10} more regions...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 text-center">
          <Card className="inline-block">
            <CardContent className="pt-6">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold text-primary">{stats.totalRegions}</div>
                <p className="text-sm text-muted-foreground">Total Regions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}