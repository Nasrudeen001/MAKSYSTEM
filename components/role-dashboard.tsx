"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNavigation } from "@/components/main-navigation"
import { Users, BookOpen, MessageSquare, ShoppingBag, Calendar, CheckCircle, Heart, Activity } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type SectionKey = "tabligh" | "tabligh_digital" | "umumi" | "talim_ul_quran" | "talim" | "isaar" | "sihat"

interface DashboardStats {
  [key: string]: number
}

interface RoleDashboardProps {
  role: string
  sectionKey: SectionKey | SectionKey[]
  title: string
  description: string
  statsConfig: Array<{
    key: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    description: string
  }>
}

export function RoleDashboard({ role, sectionKey, title, description, statsConfig }: RoleDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient()

        const parts = Array.isArray(sectionKey) ? sectionKey : [sectionKey]
        let allData: any[] = []

        for (const part of parts) {
          const { data, error } = await supabase
            .from("other_reports")
            .select("*")
            .eq("part", part)

          if (error) throw error
          if (data) allData = allData.concat(data)
        }

        // Aggregate stats based on config
        const aggregated: DashboardStats = {}
        statsConfig.forEach(config => {
          // Map config key to database column
          const dbKey = config.key.replace(/([A-Z])/g, '_$1').toLowerCase()
          aggregated[config.key] = allData?.reduce((sum, row) => sum + (row[dbKey] || 0), 0) || 0
        })

        setStats(aggregated)
      } catch (error) {
        console.error(`Error fetching ${sectionKey} stats:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [sectionKey, statsConfig])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading {title} Dashboard...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">{title} Dashboard</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>

        <div className="mb-6 text-center">
          <Link href="/other-reports">
            <Button variant="outline">Enter {title} Data</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsConfig.map((config) => {
            const Icon = config.icon
            return (
              <Card key={config.key} className="shadow-md">
                <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">{config.label}</CardTitle>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-primary">{stats[config.key] || 0}</div>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}