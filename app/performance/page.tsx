import { PerformanceOverview } from "@/components/performance-overview"
import { PerformanceCharts } from "@/components/performance-charts"
import { ParticipantPerformance } from "@/components/participant-performance"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, Award } from "lucide-react"
import Link from "next/link"

export default function PerformancePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Performance Tracking</h1>
                  <p className="text-sm text-muted-foreground">Academic Progress Analytics</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link href="/admin">
                <Button variant="outline">Admin View</Button>
              </Link>
              <Link href="/participant">
                <Button>Participant Portal</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Reduced py-8 to py-2 to align content to top */}
      <div className="container mx-auto px-4 py-2">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">Performance Analytics</h2>
          <p className="text-muted-foreground text-lg">
            Comprehensive tracking of academic performance across all ijtema sessions and assessments.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Analytics</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <PerformanceOverview />
          </TabsContent>

          <TabsContent value="charts">
            <PerformanceCharts />
          </TabsContent>

          <TabsContent value="participants">
            <ParticipantPerformance />
          </TabsContent>

          <TabsContent value="assessments">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Assessment Results
                  </CardTitle>
                  <CardDescription>Detailed breakdown of all assessment performances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Assessment details will be displayed here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
