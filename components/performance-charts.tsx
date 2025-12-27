"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Download } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const performanceData = [
  { name: "Quranic Knowledge", average: 88.5, participants: 4 },
  { name: "Hadith Studies", average: 76.8, participants: 3 },
  { name: "Tajweed", average: 92.5, participants: 2 },
  { name: "Islamic History", average: 85.3, participants: 2 },
  { name: "Jurisprudence", average: 0, participants: 0 },
]

const progressData = [
  { week: "Week 1", average: 75.2, assessments: 2 },
  { week: "Week 2", average: 78.5, assessments: 4 },
  { week: "Week 3", average: 82.3, assessments: 9 },
]

const gradeDistribution = [
  { grade: "A+", count: 2, percentage: 22.2 },
  { grade: "A", count: 3, percentage: 33.3 },
  { grade: "B+", count: 3, percentage: 33.3 },
  { grade: "B", count: 1, percentage: 11.1 },
]

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

export function PerformanceCharts() {
  const handleExportPDF = () => {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(20)
    doc.text("Performance Analytics Report", 20, 20)

    // Add generation date
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)

    // Add subject performance data
    doc.setFontSize(14)
    doc.text("Subject Performance", 20, 45)

    const subjectData = performanceData.map((subject) => [
      subject.name,
      `${subject.average}%`,
      subject.participants.toString(),
    ])

  autoTable(doc, {
      head: [["Subject", "Average Score", "Participants"]],
      body: subjectData,
      startY: 55,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Add grade distribution
    doc.setFontSize(14)
  doc.text("Grade Distribution", 20, (doc as any).lastAutoTable.finalY + 20)

    const gradeData = gradeDistribution.map((grade) => [grade.grade, grade.count.toString(), `${grade.percentage}%`])

  autoTable(doc, {
      head: [["Grade", "Count", "Percentage"]],
      body: gradeData,
  startY: (doc as any).lastAutoTable.finalY + 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Add progress over time
    doc.setFontSize(14)
  doc.text("Progress Over Time", 20, (doc as any).lastAutoTable.finalY + 20)

    const progressTableData = progressData.map((progress) => [
      progress.week,
      `${progress.average}%`,
      progress.assessments.toString(),
    ])

  autoTable(doc, {
      head: [["Week", "Average Score", "Total Assessments"]],
      body: progressTableData,
  startY: (doc as any).lastAutoTable.finalY + 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Add performance metrics summary
    doc.setFontSize(14)
  doc.text("Performance Metrics Summary", 20, (doc as any).lastAutoTable.finalY + 20)

    const metricsData = [
      ["Attendance Rate", "87.5%"],
      ["Completion Rate", "75%"],
      ["Excellence Rate (A grade and above)", "55.6%"],
    ]

  autoTable(doc, {
      head: [["Metric", "Value"]],
      body: metricsData,
  startY: (doc as any).lastAutoTable.finalY + 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Save the PDF
    doc.save("performance-analytics-report.pdf")
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">Performance Analytics</h3>
          <p className="text-sm text-muted-foreground">Visual analytics and charts for performance tracking</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => { /* TODO: Add Excel export logic */ }} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Download Excel
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subject Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Average scores across different subject areas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name === "average" ? "Average Score" : "Participants"]}
                />
                <Bar dataKey="average" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Grade Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Distribution of grades across all assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ grade, percentage }) => `${grade} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} students`, "Count"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Progress Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Over Time</CardTitle>
          <CardDescription>Average performance improvement throughout the ijtema</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[70, 90]} />
              <Tooltip
                formatter={(value, name) => [
                  name === "average" ? `${value}%` : value,
                  name === "average" ? "Average Score" : "Total Assessments",
                ]}
              />
              <Line
                type="monotone"
                dataKey="average"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-2">87.5%</div>
            <p className="text-sm text-muted-foreground">Average session attendance</p>
            <div className="mt-4 w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "87.5%" }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-2">75%</div>
            <p className="text-sm text-muted-foreground">Assessment completion rate</p>
            <div className="mt-4 w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "75%" }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Excellence Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-2">55.6%</div>
            <p className="text-sm text-muted-foreground">A grade and above</p>
            <div className="mt-4 w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "55.6%" }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
