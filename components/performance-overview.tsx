"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, BookOpen, Award, Calendar, Download } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const overviewStats = [
  {
    title: "Total Participants",
    value: "8",
    change: "+2 from last week",
    trend: "up",
    icon: Users,
  },
  {
    title: "Average Performance",
    value: "82.3%",
    change: "+5.2% from last assessment",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Completed Assessments",
    value: "9",
    change: "3 pending",
    trend: "neutral",
    icon: BookOpen,
  },
  {
    title: "Certificates Issued",
    value: "3",
    change: "Excellence: 2, Completion: 1",
    trend: "up",
    icon: Award,
  },
]

const topPerformers = [
  { name: "Fatima Ali", score: 92.0, subject: "Quranic Studies", grade: "A+" },
  { name: "Yusuf Ahmad", score: 90.0, subject: "Tajweed", grade: "A" },
  { name: "Omar Ibrahim", score: 88.5, subject: "Islamic History", grade: "A" },
  { name: "Ahmed Hassan", score: 85.5, subject: "Quranic Knowledge", grade: "A" },
]

const subjectPerformance = [
  { subject: "Quranic Studies", average: 88.5, participants: 4, color: "bg-chart-1" },
  { subject: "Hadith Studies", average: 76.8, participants: 3, color: "bg-chart-2" },
  { subject: "Tajweed", average: 92.5, participants: 2, color: "bg-chart-3" },
  { subject: "Islamic History", average: 85.3, participants: 2, color: "bg-chart-4" },
]

export function PerformanceOverview() {
  const handleExportPDF = () => {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(20)
    doc.text("Performance Overview Report", 20, 20)

    // Add generation date
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)

    // Add overview statistics
    doc.setFontSize(14)
    doc.text("Overview Statistics", 20, 45)

    const statsData = overviewStats.map((stat) => [stat.title, stat.value, stat.change])

  autoTable(doc, {
      head: [["Metric", "Value", "Change"]],
      body: statsData,
      startY: 55,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Add top performers
    doc.setFontSize(14)
  doc.text("Top Performers", 20, (doc as any).lastAutoTable.finalY + 20)

    const performersData = topPerformers.map((performer) => [
      performer.name,
      performer.subject,
      `${performer.score}%`,
      performer.grade,
    ])

  autoTable(doc, {
      head: [["Name", "Subject", "Score", "Grade"]],
      body: performersData,
  startY: (doc as any).lastAutoTable.finalY + 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Add subject performance
    doc.setFontSize(14)
  doc.text("Subject Performance", 20, (doc as any).lastAutoTable.finalY + 20)

    const subjectData = subjectPerformance.map((subject) => [
      subject.subject,
      `${subject.average}%`,
      subject.participants.toString(),
    ])

  autoTable(doc, {
      head: [["Subject", "Average Score", "Participants"]],
      body: subjectData,
  startY: (doc as any).lastAutoTable.finalY + 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Save the PDF
    doc.save("performance-overview-report.pdf")
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Performance Overview</h3>
          <p className="text-sm text-muted-foreground">Comprehensive performance statistics and insights</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => { /* TODO: Add Excel export logic */ }}>
            <Download className="w-4 h-4 mr-2" />
            Download Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stat.trend === "up" && <TrendingUp className="w-3 h-3 mr-1 text-primary" />}
                  {stat.trend === "down" && <TrendingDown className="w-3 h-3 mr-1 text-destructive" />}
                  <span>{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Highest scoring participants across all assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">{performer.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">
                      {performer.grade}
                    </Badge>
                    <p className="text-sm font-medium">{performer.score}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Average scores by subject area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectPerformance.map((subject, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                      <span className="font-medium">{subject.subject}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{subject.average}%</span>
                      <span className="text-sm text-muted-foreground ml-2">({subject.participants})</span>
                    </div>
                  </div>
                  <Progress value={subject.average} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest assessment submissions and results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <div>
                  <p className="font-medium">Yusuf Ahmad completed Tajweed Assessment</p>
                  <p className="text-sm text-muted-foreground">Score: 95/100 (A+) • 2 hours ago</p>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary">New</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-secondary rounded-full" />
                <div>
                  <p className="font-medium">Omar Ibrahim submitted Islamic History Assignment</p>
                  <p className="text-sm text-muted-foreground">Score: 88.5/100 (A) • 5 hours ago</p>
                </div>
              </div>
              <Badge variant="outline">Completed</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-chart-3 rounded-full" />
                <div>
                  <p className="font-medium">Fatima Ali earned Certificate of Excellence</p>
                  <p className="text-sm text-muted-foreground">Quranic Studies • 1 day ago</p>
                </div>
              </div>
              <Badge className="bg-chart-3/10 text-chart-3">Certificate</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
