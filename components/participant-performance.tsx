"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Eye, Download, Mail } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import Image from "next/image"
import { usePagination } from "@/lib/hooks/usePagination"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination"

const participants = [
  {
    id: "MAK2024001",
    name: "Ahmed Hassan",
    email: "ahmed.hassan@email.com",
    jamaat: "Nairobi Central",
    assessments: 2,
    averageScore: 81.8,
    grade: "A-",
    attendance: 100,
    certificates: 1,
    status: "active",
  },
  {
    id: "MAK2024002",
    name: "Fatima Ali",
    email: "fatima.ali@email.com",
    jamaat: "Mombasa",
    assessments: 2,
    averageScore: 92.0,
    grade: "A+",
    attendance: 100,
    certificates: 1,
    status: "active",
  },
  {
    id: "MAK2024003",
    name: "Omar Ibrahim",
    email: "omar.ibrahim@email.com",
    jamaat: "Kisumu",
    assessments: 2,
    averageScore: 81.8,
    grade: "A-",
    attendance: 100,
    certificates: 0,
    status: "active",
  },
  {
    id: "MAK2024004",
    name: "Aisha Mohamed",
    email: "aisha.mohamed@email.com",
    jamaat: "Nakuru",
    assessments: 1,
    averageScore: 68.0,
    grade: "B",
    attendance: 67,
    certificates: 0,
    status: "active",
  },
  {
    id: "MAK2024005",
    name: "Yusuf Ahmad",
    email: "yusuf.ahmad@email.com",
    jamaat: "Eldoret",
    assessments: 2,
    averageScore: 88.5,
    grade: "A",
    attendance: 100,
    certificates: 1,
    status: "active",
  },
  {
    id: "MAK2024006",
    name: "Khadija Osman",
    email: "khadija.osman@email.com",
    jamaat: "Garissa",
    assessments: 0,
    averageScore: 0,
    grade: "N/A",
    attendance: 67,
    certificates: 0,
    status: "enrolled",
  },
  {
    id: "MAK2024007",
    name: "Abdullahi Sheikh",
    email: "abdullahi.sheikh@email.com",
    jamaat: "Thika",
    assessments: 0,
    averageScore: 0,
    grade: "N/A",
    attendance: 100,
    certificates: 0,
    status: "enrolled",
  },
  {
    id: "MAK2024008",
    name: "Zainab Musa",
    email: "zainab.musa@email.com",
    jamaat: "Machakos",
    assessments: 0,
    averageScore: 0,
    grade: "N/A",
    attendance: 67,
    certificates: 0,
    status: "enrolled",
  },
]

const getGradeColor = (grade: string) => {
  switch (grade) {
    case "A+":
      return "bg-primary text-primary-foreground"
    case "A":
    case "A-":
      return "bg-secondary text-secondary-foreground"
    case "B+":
    case "B":
      return "bg-chart-4/20 text-chart-4"
    case "C+":
    case "C":
      return "bg-chart-5/20 text-chart-5"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-primary/10 text-primary"
    case "enrolled":
      return "bg-secondary/10 text-secondary-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function ParticipantPerformance() {
  const handleExportReport = () => {
    const doc = new jsPDF({ orientation: "landscape" })

  const logoImg = document.createElement('img')
    logoImg.onload = () => {
      const logoSize = 20
      const pageWidth = doc.internal.pageSize.getWidth()
      const logoX = (pageWidth - logoSize) / 2

      doc.addImage(logoImg, "JPEG", logoX, 10, logoSize, logoSize)

      // Add title below logo
      doc.setFontSize(20)
      doc.text("Participant Performance Report", 20, 40)

      // Add generation date
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 50)
      doc.text(`Total Participants: ${participants.length}`, 20, 55)

      // Prepare table data
      const tableData = participants.map((p) => [
        p.id,
        p.name,
        p.jamaat,
        p.assessments.toString(),
        p.averageScore > 0 ? `${p.averageScore}%` : "N/A",
        p.grade,
        `${p.attendance}%`,
        p.certificates.toString(),
        p.status,
      ])

      // Add table
  autoTable(doc, {
        head: [
          ["ID", "Name", "Jamaat", "Assessments", "Average Score", "Grade", "Attendance", "Certificates", "Status"],
        ],
        body: tableData,
        startY: 65,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })

      // Add summary statistics
      const activeParticipants = participants.filter((p) => p.status === "active").length
      const averagePerformance = participants.reduce((sum, p) => sum + p.averageScore, 0) / participants.length
      const totalCertificates = participants.reduce((sum, p) => sum + p.certificates, 0)

  doc.setFontSize(12)
  doc.text("Summary Statistics", 20, (doc as any).lastAutoTable.finalY + 20)
  doc.setFontSize(10)
  doc.text(`Active Participants: ${activeParticipants}`, 20, (doc as any).lastAutoTable.finalY + 30)
  doc.text(`Average Performance: ${averagePerformance.toFixed(1)}%`, 20, (doc as any).lastAutoTable.finalY + 35)
  doc.text(`Total Certificates: ${totalCertificates}`, 20, (doc as any).lastAutoTable.finalY + 40)

      // Save the PDF
      doc.save("participant-performance-report.pdf")
    }

    logoImg.src = "/ansar-logo.jpeg"
  }

  const { paginated, page, setPage, totalPages } = usePagination(participants, 50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Participant Performance</h3>
          <p className="text-sm text-muted-foreground">
            Individual performance tracking for all registered participants
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Send Updates
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {paginated.map((participant) => (
          <Card key={participant.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {participant.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">{participant.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {participant.id}
                      </Badge>
                      <Badge className={getStatusColor(participant.status)}>{participant.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{participant.email}</p>
                    <p className="text-sm text-muted-foreground">{participant.jamaat}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Assessments</div>
                    <div className="font-semibold">{participant.assessments}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Average</div>
                    <div className="font-semibold">
                      {participant.averageScore > 0 ? `${participant.averageScore}%` : "N/A"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Grade</div>
                    <Badge className={getGradeColor(participant.grade)}>{participant.grade}</Badge>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <div className="text-sm text-muted-foreground mb-1">Attendance</div>
                    <div className="space-y-1">
                      <div className="font-semibold text-sm">{participant.attendance}%</div>
                      <Progress value={participant.attendance} className="h-1" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Certificates</div>
                    <div className="font-semibold">{participant.certificates}</div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {totalPages > 1 && (
          <div className="col-span-full">
            <nav className="flex justify-center py-2">
              <Pagination aria-label="Performance pagination">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} href="#" />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink isActive={i + 1 === page} href="#" onClick={() => setPage(i + 1)}>
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage(Math.min(totalPages, page + 1))} href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </nav>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Overall statistics for all participants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">8</div>
              <div className="text-sm text-muted-foreground">Total Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">5</div>
              <div className="text-sm text-muted-foreground">Active Participants</div>
            </div>
            <div className="text-2xl font-bold text-primary mb-1 text-center">82.3%</div>
            <div className="text-sm text-muted-foreground text-center">Average Performance</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">3</div>
              <div className="text-sm text-muted-foreground">Certificates Earned</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
