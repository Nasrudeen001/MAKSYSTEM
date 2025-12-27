"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Download,
} from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const quickStats = [
  {
    title: "Total Participants",
    value: "8",
    change: "+2 this week",
    trend: "up",
    icon: Users,
    color: "text-primary",
  },
  {
    title: "Active Sessions",
    value: "5",
    change: "2 completed",
    trend: "neutral",
    icon: BookOpen,
    color: "text-secondary-foreground",
  },
  {
    title: "Average Performance",
    value: "82.3%",
    change: "+5.2% improvement",
    trend: "up",
    icon: TrendingUp,
    color: "text-primary",
  },
  {
    title: "Certificates Issued",
    value: "3",
    change: "2 pending approval",
    trend: "neutral",
    icon: Award,
    color: "text-chart-3",
  },
]

const recentActivities = [
  {
    type: "registration",
    message: "New participant registered: Zainab Musa",
    time: "2 hours ago",
    status: "new",
  },
  {
    type: "assessment",
    message: "Yusuf Ahmad completed Tajweed Assessment (95/100)",
    time: "4 hours ago",
    status: "completed",
  },
  {
    type: "certificate",
    message: "Certificate issued to Fatima Ali for Excellence in Quranic Studies",
    time: "1 day ago",
    status: "issued",
  },
  {
    type: "session",
    message: "Islamic History session completed with 45 attendees",
    time: "1 day ago",
    status: "completed",
  },
]

const upcomingSessions = [
  {
    title: "Spiritual Development Workshop",
    instructor: "Imam Nasir Ahmad",
    time: "Today, 3:00 PM - 5:00 PM",
    venue: "Prayer Hall",
    enrolled: 38,
    capacity: 40,
  },
  {
    title: "Quranic Knowledge Quiz",
    instructor: "Qari Muhammad Ahmad",
    time: "Tomorrow, 10:00 AM - 10:45 AM",
    venue: "Main Hall A",
    enrolled: 25,
    capacity: 50,
  },
]

const pendingTasks = [
  {
    task: "Review assessment submissions",
    count: 3,
    priority: "high",
  },
  {
    task: "Approve certificate requests",
    count: 2,
    priority: "medium",
  },
  {
    task: "Update session schedules",
    count: 1,
    priority: "low",
  },
  {
    task: "Send attendance reminders",
    count: 5,
    priority: "medium",
  },
]

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-destructive/10 text-destructive"
    case "medium":
      return "bg-chart-4/10 text-chart-4"
    case "low":
      return "bg-primary/10 text-primary"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "new":
      return <AlertCircle className="w-4 h-4 text-primary" />
    case "completed":
      return <CheckCircle className="w-4 h-4 text-primary" />
    case "issued":
      return <Award className="w-4 h-4 text-chart-3" />
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />
  }
}

export function AdminOverview() {
  const handleExportData = () => {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(20)
    doc.text("Admin Dashboard Overview", 20, 20)

    // Add generation date
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)

    // Add quick stats
    doc.setFontSize(14)
    doc.text("Quick Statistics", 20, 45)

    const statsData = quickStats.map((stat) => [stat.title, stat.value, stat.change])

  autoTable(doc, {
      head: [["Metric", "Value", "Change"]],
      body: statsData,
      startY: 55,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Add recent activities
    doc.setFontSize(14)
  doc.text("Recent Activities", 20, (doc as any).lastAutoTable.finalY + 20)

    const activitiesData = recentActivities.map((activity) => [
      activity.type,
      activity.message,
      activity.time,
      activity.status,
    ])

  autoTable(doc, {
      head: [["Type", "Message", "Time", "Status"]],
      body: activitiesData,
  startY: (doc as any).lastAutoTable.finalY + 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Save the PDF
    doc.save("admin-overview-report.pdf")
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground">Manage your ijtema event efficiently</p>
        </div>
        <div className="flex space-x-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Participant
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest updates and actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  {getStatusIcon(activity.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Next scheduled academic sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.map((session, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{session.title}</h4>
                      <p className="text-sm text-muted-foreground">{session.instructor}</p>
                    </div>
                    <Badge variant="outline">{session.venue}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{session.time}</span>
                    <span className="text-muted-foreground">
                      {session.enrolled}/{session.capacity} enrolled
                    </span>
                  </div>
                  <Progress value={(session.enrolled / session.capacity) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    <span className="text-sm font-medium">{task.task}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{task.count}</Badge>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Connection</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm text-primary">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Service</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm text-primary">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Backup Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm text-primary">Up to date</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage Usage</span>
                <span className="text-sm text-muted-foreground">2.3 GB / 10 GB</span>
              </div>
              <Progress value={23} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <Users className="w-6 h-6 mb-2" />
              <span className="text-xs">Manage Participants</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <BookOpen className="w-6 h-6 mb-2" />
              <span className="text-xs">Schedule Session</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <Calendar className="w-6 h-6 mb-2" />
              <span className="text-xs">Mark Attendance</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <Award className="w-6 h-6 mb-2" />
              <span className="text-xs">Issue Certificate</span>
            </Button>
            {/* ...removed View Reports button... */}
            <Button variant="outline" className="h-20 flex-col bg-transparent" onClick={handleExportData}>
              <Download className="w-6 h-6 mb-2" />
              <span className="text-xs">Export PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
