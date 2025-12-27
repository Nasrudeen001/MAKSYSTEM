"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNavigation } from "@/components/main-navigation"
import { createClient } from "@/lib/supabase/client"

type Contribution = {
  id: string
  participant_id: string
  month: string
  year?: number
  chanda_majlis?: number
  chanda_ijtema?: number
  tehrik_e_jadid?: number
  waqf_e_jadid?: number
  publication?: number
  khidmat_e_khalq?: number
  ansar_project?: number
  created_at: string
}

type ContributionStat = {
  name: string
  payers: number
  total_amount: number
}

export default function MaalDashboard() {
  const [contributionStats, setContributionStats] = useState<ContributionStat[]>([])
  const [totalContributionAmount, setTotalContributionAmount] = useState(0)
  const [totalContributors, setTotalContributors] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient()
        const { data: contributions, error } = await supabase
          .from('contributions')
          .select('*')
          .not("month", "is", null)

        if (error) throw error

        const contribs: Contribution[] = contributions || []

        const stats: ContributionStat[] = [
          {
            name: "Chanda Majlis",
            payers: contribs.filter((c) => c.chanda_majlis && c.chanda_majlis > 0).length,
            total_amount: contribs.reduce((sum, c) => sum + (c.chanda_majlis || 0), 0),
          },
          {
            name: "Chanda Ijtema",
            payers: contribs.filter((c) => c.chanda_ijtema && c.chanda_ijtema > 0).length,
            total_amount: contribs.reduce((sum, c) => sum + (c.chanda_ijtema || 0), 0),
          },
          {
            name: "Tehrik-e-Jadid",
            payers: contribs.filter((c) => c.tehrik_e_jadid && c.tehrik_e_jadid > 0).length,
            total_amount: contribs.reduce((sum, c) => sum + (c.tehrik_e_jadid || 0), 0),
          },
          {
            name: "Waqf-e-jadid",
            payers: contribs.filter((c) => c.waqf_e_jadid && c.waqf_e_jadid > 0).length,
            total_amount: contribs.reduce((sum, c) => sum + (c.waqf_e_jadid || 0), 0),
          },
          {
            name: "Publication",
            payers: contribs.filter((c) => c.publication && c.publication > 0).length,
            total_amount: contribs.reduce((sum, c) => sum + (c.publication || 0), 0),
          },
          {
            name: "Khidmat-e-khalq",
            payers: contribs.filter((c) => c.khidmat_e_khalq && c.khidmat_e_khalq > 0).length,
            total_amount: contribs.reduce((sum, c) => sum + (c.khidmat_e_khalq || 0), 0),
          },
          {
            name: "Ansar Project",
            payers: contribs.filter((c) => c.ansar_project && c.ansar_project > 0).length,
            total_amount: contribs.reduce((sum, c) => sum + (c.ansar_project || 0), 0),
          },
        ]

        const totalAmount = stats.reduce((sum, stat) => sum + stat.total_amount, 0)

        // Calculate unique contributors
        const uniqueContributorIds = new Set(
          contribs
            .filter((c) =>
              (c.chanda_majlis && c.chanda_majlis > 0) ||
              (c.chanda_ijtema && c.chanda_ijtema > 0) ||
              (c.tehrik_e_jadid && c.tehrik_e_jadid > 0) ||
              (c.waqf_e_jadid && c.waqf_e_jadid > 0) ||
              (c.publication && c.publication > 0) ||
              (c.khidmat_e_khalq && c.khidmat_e_khalq > 0) ||
              (c.ansar_project && c.ansar_project > 0)
            )
            .map((c) => c.participant_id)
        )

        setContributionStats(stats)
        setTotalContributionAmount(totalAmount)
        setTotalContributors(uniqueContributorIds.size)
      } catch (error) {
        console.error('Error fetching maal stats:', error)
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
          <div className="text-center">Loading Maal Dashboard...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Maal Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of contribution statistics</p>
        </div>

        <Card className="mb-8 shadow-md w-full max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Maal Statistics</CardTitle>
            <CardDescription>Number of payers and total amounts for each Maal type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contributionStats.map((contrib, idx) => (
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