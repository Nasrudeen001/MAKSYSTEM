"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNavigation } from "@/components/main-navigation"
import { Users, UserCheck, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface EventSettings {
  eventStartDate: string
  eventName: string
  eventLocation: string
  totalDays: number
  createdAt: string
}

interface ContributionStat {
  name: string
  payers: number
  total_amount: number
}

interface RegionStat {
  name: string
  participants: number
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) {
    return num + "st"
  }
  if (j === 2 && k !== 12) {
    return num + "nd"
  }
  if (j === 3 && k !== 13) {
    return num + "rd"
  }
  return num + "th"
}

export default function DashboardPage() {
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [midnightTick, setMidnightTick] = useState(0)

  useEffect(() => {
    const loadEventSettings = () => {
      const savedSettings = localStorage.getItem("eventSettings")
      if (savedSettings) {
        setEventSettings(JSON.parse(savedSettings))
      } else {
        setEventSettings(null)
      }
    }

    // Load initial settings
    loadEventSettings()

    // Listen for event settings updates
    const handleEventUpdate = (event: CustomEvent) => {
      setEventSettings(event.detail)
    }

    window.addEventListener("eventSettingsUpdated", handleEventUpdate as EventListener)

    return () => {
      window.removeEventListener("eventSettingsUpdated", handleEventUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        console.log("[v0] Starting dashboard data fetch")
        const supabase = createClient()

        const { data: _headData, count: totalCount, error: connectionError } = await supabase
          .from("participants")
          .select("id", { count: "exact", head: true })

        if (connectionError) {
          console.log("[v0] Database connection error:", connectionError)
          throw new Error(`Database connection failed: ${connectionError.message}`)
        }

        console.log("[v0] Database connection successful")

        // Fetch all participants in batches (server may cap responses at ~1000 rows)
        const participantStats: any[] = []
        const batchSize = 1000
        let offset = 0
        while (true) {
          const end = offset + batchSize - 1
          const { data: batch, error: batchError } = await supabase
            .from("participants")
            .select("category, region, date_of_birth")
            .order("created_at", { ascending: false })
            .range(offset, end)

          if (batchError) {
            console.log("[v0] Participant batch fetch error:", batchError)
            throw new Error(`Failed to fetch participants: ${batchError.message}`)
          }

          if (!batch || batch.length === 0) break
          participantStats.push(...batch)
          if (batch.length < batchSize) break
          offset += batchSize
        }

        console.log("[v0] Participants fetched:", participantStats.length)

        const totalParticipants = typeof totalCount === "number" ? totalCount : participantStats.length

        const computeAge = (dob?: string | null): number | undefined => {
          if (!dob) return undefined
          const today = new Date()
          const birthDate = new Date(dob)
          const age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age
        }

        const deriveCategory = (dob?: string | null, stored?: string | null): string => {
          const age = computeAge(dob || undefined)
          if (age === undefined) return stored || ""
          if (age > 55) return "Saf Awwal"
          if (age >= 40 && age <= 55) return "Saf Dom"
          return "General"
        }

        const safAwwal = participantStats?.filter((p: any) => deriveCategory(p.date_of_birth, p.category) === "Saf Awwal").length || 0
        const safDom = participantStats?.filter((p: any) => deriveCategory(p.date_of_birth, p.category) === "Saf Dom").length || 0
        const totalRegions = new Set(participantStats?.map((p) => p.region)).size || 0

        // Get contribution statistics
        const { data: contributions, error: contributionError } = await supabase
          .from("contributions")
          .select("*")
          .not("month", "is", null)

        if (contributionError) {
          console.log("[v0] Contribution fetch error:", contributionError)
        }

        console.log("[v0] Contributions fetched:", contributions?.length || 0)

        const contributionStats: ContributionStat[] = [
          {
            name: "Chanda Majlis",
            payers: contributions?.filter((c) => c.chanda_majlis > 0).length || 0,
            total_amount: contributions?.reduce((sum, c) => sum + (c.chanda_majlis || 0), 0) || 0,
          },
          {
            name: "Chanda Ijtema",
            payers: contributions?.filter((c) => c.chanda_ijtema > 0).length || 0,
            total_amount: contributions?.reduce((sum, c) => sum + (c.chanda_ijtema || 0), 0) || 0,
          },
          {
            name: "Tehrik-e-Jadid",
            payers: contributions?.filter((c) => c.tehrik_e_jadid > 0).length || 0,
            total_amount: contributions?.reduce((sum, c) => sum + (c.tehrik_e_jadid || 0), 0) || 0,
          },
          {
            name: "Waqf-e-jadid",
            payers: contributions?.filter((c) => c.waqf_e_jadid > 0).length || 0,
            total_amount: contributions?.reduce((sum, c) => sum + (c.waqf_e_jadid || 0), 0) || 0,
          },
          {
            name: "Publication",
            payers: contributions?.filter((c) => c.publication > 0).length || 0,
            total_amount: contributions?.reduce((sum, c) => sum + (c.publication || 0), 0) || 0,
          },
          {
            name: "Khidmat-e-khalq",
            payers: contributions?.filter((c) => c.khidmat_e_khalq > 0).length || 0,
            total_amount: contributions?.reduce((sum, c) => sum + (c.khidmat_e_khalq || 0), 0) || 0,
          },
          {
            name: "Ansar Project",
            payers: contributions?.filter((c) => c.ansar_project > 0).length || 0,
            total_amount: contributions?.reduce((sum, c) => sum + (c.ansar_project || 0), 0) || 0,
          },
        ]

        // Get regional statistics
        const regionCounts =
          participantStats?.reduce(
            (acc, p) => {
              acc[p.region] = (acc[p.region] || 0) + 1
              return acc
            },
            {} as Record<string, number>,
          ) || {}

        const regionStats = Object.entries(regionCounts)
          .map(([name, participants]) => ({ name, participants }))
          .sort((a, b) => b.participants - a.participants)

        setDashboardData({
          participantStats: {
            total_participants: totalParticipants,
            saf_awwal: safAwwal,
            saf_dom: safDom,
            total_regions: totalRegions,
          },
          contributionStats,
          regionStats,
          contributions, // Pass raw contributions for unique member calculation
        })
        setError(null)
      } catch (error) {
        console.error("[v0] Error fetching dashboard data:", error)
        setError(error instanceof Error ? error.message : "Unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [midnightTick])

  // Lightweight daily refetch at midnight so derived stats update automatically
  useEffect(() => {
    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setHours(24, 0, 0, 0)
    const msUntilMidnight = nextMidnight.getTime() - now.getTime()

    const midnightTimeout = setTimeout(() => {
      setMidnightTick((t) => t + 1)
      const dailyInterval = setInterval(() => {
        setMidnightTick((t) => t + 1)
      }, 24 * 60 * 60 * 1000)
      ;(window as any).__dashboardDailyInterval = dailyInterval
    }, msUntilMidnight)

    return () => {
      clearTimeout(midnightTimeout)
      if ((window as any).__dashboardDailyInterval) clearInterval((window as any).__dashboardDailyInterval)
    }
  }, [])

  const getCurrentDay = () => {
    if (!eventSettings) return "No event configured"

    const startDate = new Date(eventSettings.eventStartDate)
    const currentDate = new Date()
    const diffTime = currentDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 1) return "Event not started"
    if (diffDays > eventSettings.totalDays) return "Event completed"
    return `${getOrdinalSuffix(diffDays)} day of ${eventSettings.totalDays}`
  }

  const getProgressPercentage = () => {
    if (!eventSettings) return 0

    const startDate = new Date(eventSettings.eventStartDate)
    const currentDate = new Date()
    const diffTime = currentDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return Math.min(100, Math.max(0, (diffDays / eventSettings.totalDays) * 100))
  }

  if (loading) {
    return (
      <div>
        <MainNavigation />
        <main className="container mx-auto px-4 pt-0.5 pb-2 flex flex-col items-center justify-center">
          <div className="mb-4 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Loading Dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <MainNavigation />
        <main className="container mx-auto px-4 pt-0.5 pb-2 flex flex-col items-center justify-center">
          <div className="mb-4 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Overview of Majlis Ansarullah Kenya Management System</p>
          </div>
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Database Connection Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">{error}</p>
              <p className="text-sm text-red-600">
                Please ensure the Supabase database schema has been created by running the SQL script.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const { participantStats, contributionStats, regionStats } = dashboardData

  const totalContributionAmount = contributionStats.reduce(
    (sum: number, contrib: ContributionStat) => sum + Number(contrib.total_amount),
    0,
  )
  // Calculate unique contributors (members who have contributed)
  const uniqueContributorIds = new Set(
    (dashboardData.contributions ?? [])
      .filter((c: any) =>
        (c.chanda_majlis > 0 || c.chanda_ijtema > 0 || c.tehrik_e_jadid > 0 || c.waqf_e_jadid > 0 || c.publication > 0 || c.khidmat_e_khalq > 0 || c.ansar_project > 0)
      )
      .map((c: any) => c.participant_id)
  )
  const totalContributors = uniqueContributorIds.size

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-4 pb-8 bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="w-full max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-extrabold text-primary mb-2">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Overview of {eventSettings ? eventSettings.eventName : "Majlis Ansarullah Kenya Management System"}
          </p>
        </div>

        {eventSettings && (
          <Card className="mb-8 border-primary/20 bg-primary/5 mx-auto" style={{maxWidth: '700px'}}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Current Event Details</span>
              </CardTitle>
              <CardDescription>Live event information and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{getCurrentDay()}</div>
                  <p className="text-sm text-muted-foreground">Current Progress</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold mb-1">{eventSettings.eventName}</div>
                  <p className="text-sm text-muted-foreground">Event Name</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold mb-1">{eventSettings.eventLocation}</div>
                  <p className="text-sm text-muted-foreground">Location</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold mb-1">
                    {new Date(eventSettings.eventStartDate).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full max-w-4xl mx-auto">
          <Card className="shadow-md">
            <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Saf Awwal</CardTitle>
              <UserCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-primary">{participantStats.saf_awwal}</div>
              <p className="text-xs text-muted-foreground">Above 55 years</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Saf Dom</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-primary">{participantStats.saf_dom}</div>
              <p className="text-xs text-muted-foreground">40-55 years</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Total Members</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-primary">{participantStats.total_participants}</div>
              <p className="text-xs text-muted-foreground">All registered Ansar</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 shadow-md w-full max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Maal Statistics</CardTitle>
            <CardDescription>Number of payers and total amounts for each Maal type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contributionStats.map((contrib: ContributionStat, idx: number) => (
                <>
                  <div key={contrib.name} className="p-4 bg-secondary/50 rounded-lg text-center">
                    <h4 className="font-semibold text-base mb-2">{contrib.name}</h4>
                    <div className="space-y-2">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">Payers</span>
                        <span className="font-bold text-primary text-lg">{contrib.payers}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">Amount</span>
                        <span className="font-bold text-primary text-lg">KSh {contrib.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {/* Insert extended Total Maal card after Ansar Project */}
                  {contrib.name === "Ansar Project" && (
                    <div key="total-maal" className="lg:col-span-2 md:col-span-2 col-span-1 p-6 bg-primary/10 rounded-lg text-center border border-primary/30 flex flex-col justify-center items-center" style={{ minWidth: '300px', width: '100%' }}>
                      <h4 className="font-semibold text-2xl mb-4 text-primary">Total Maal</h4>
                      <div className="space-y-4 w-full">
                        <div className="flex flex-col items-center">
                          <span className="text-base text-muted-foreground">Total Amount</span>
                          <span className="font-bold text-primary text-3xl">KSh {totalContributionAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-base text-muted-foreground">Total Payers</span>
                          <span className="font-bold text-primary text-3xl">{totalContributors}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
