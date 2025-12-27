"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, Users, MapPin, ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { downloadStyledExcel, createStyledExcel } from "@/lib/utils"
import { DownloadMenu } from "@/components/download-menu"
import { usePagination } from "@/lib/hooks/usePagination"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination"

const sessions = [
  {
    id: 1,
    code: "QUR001",
    title: "Quranic Recitation and Tajweed",
    description: "Learn proper pronunciation and recitation of the Holy Quran",
    instructor: "Qari Muhammad Ahmad",
    type: "workshop",
    duration: 90,
    maxParticipants: 50,
    venue: "Main Hall A",
    date: "2024-12-15",
    startTime: "09:00",
    endTime: "10:30",
    enrolled: 42,
  },
  {
    id: 2,
    code: "HAD001",
    title: "Hadith Studies: Sahih Bukhari",
    description: "Study of selected Hadith from Sahih Bukhari",
    instructor: "Maulana Abdul Rahman",
    type: "lecture",
    duration: 60,
    maxParticipants: 100,
    venue: "Lecture Hall B",
    date: "2024-12-15",
    startTime: "11:00",
    endTime: "12:00",
    enrolled: 78,
  },
  {
    id: 3,
    code: "FIQ001",
    title: "Islamic Jurisprudence Basics",
    description: "Introduction to Islamic law and its practical applications",
    instructor: "Dr. Mirza Tahir Ahmad",
    type: "lecture",
    duration: 75,
    maxParticipants: 80,
    venue: "Conference Room C",
    date: "2024-12-15",
    startTime: "14:00",
    endTime: "15:15",
    enrolled: 65,
  },
  {
    id: 4,
    code: "HIS001",
    title: "Early Islamic History",
    description: "Study of the time of Prophet Muhammad (PBUH) and the Rightly Guided Caliphs",
    instructor: "Prof. Ahmad Hassan",
    type: "discussion",
    duration: 60,
    maxParticipants: 60,
    venue: "Seminar Room D",
    date: "2024-12-16",
    startTime: "09:00",
    endTime: "10:00",
    enrolled: 45,
  },
  {
    id: 5,
    code: "SPR001",
    title: "Spiritual Development Workshop",
    description: "Practical guidance on spiritual growth and connection with Allah",
    instructor: "Imam Nasir Ahmad",
    type: "workshop",
    duration: 120,
    maxParticipants: 40,
    venue: "Prayer Hall",
    date: "2024-12-16",
    startTime: "15:00",
    endTime: "17:00",
    enrolled: 38,
  },
]

const getTypeColor = (type: string) => {
  switch (type) {
    case "workshop":
      return "bg-primary/10 text-primary"
    case "lecture":
      return "bg-secondary/10 text-secondary-foreground"
    case "discussion":
      return "bg-accent/10 text-accent-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function SessionsPage() {
  const handleDownloadPDF = () => {
    const doc = new jsPDF()

    // Add logo and headers
    const logoImg = new Image()
    const pageWidth = doc.internal.pageSize.getWidth()
    logoImg.onload = () => {
      const logoSize = 20
      const logoX = (pageWidth - logoSize) / 2
      doc.addImage(logoImg, "JPEG", logoX, 10, logoSize, logoSize)

      doc.setFontSize(18)
      try { doc.setFont("Algerian", "bold") } catch (_) { doc.setFont("helvetica", "bold") }
      const orgName = "Majlis Ansarullah Kenya"
      const orgWidth = doc.getTextWidth(orgName)
      const orgX = (pageWidth - orgWidth) / 2
      doc.text(orgName, orgX, 40)
      doc.setFontSize(14)
      try { doc.setFont("helvetica", "normal") } catch (_) {}
      const docType = "Academic Sessions Schedule"
      const typeWidth = doc.getTextWidth(docType)
      const typeX = (pageWidth - typeWidth) / 2
      doc.text(docType, typeX, 48)

    // Add generation date and stats
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)
    doc.text(`Total Sessions: ${sessions.length}`, 20, 35)

    const totalEnrolled = sessions.reduce((sum, session) => sum + session.enrolled, 0)
    const totalCapacity = sessions.reduce((sum, session) => sum + session.maxParticipants, 0)
    doc.text(`Total Enrolled: ${totalEnrolled}/${totalCapacity}`, 20, 40)

    // Prepare table data
    const tableData = sessions.map((session) => [
      session.code,
      session.title,
      session.instructor,
      session.type,
      `${session.duration} min`,
      session.venue,
      new Date(session.date).toLocaleDateString(),
      `${session.startTime}-${session.endTime}`,
      `${session.enrolled}/${session.maxParticipants}`,
    ])
      ;(doc as any).autoTable({
      head: [["Code", "Title", "Instructor", "Type", "Duration", "Venue", "Date", "Time", "Enrollment"]],
      body: tableData,
        startY: 58,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    })

    // Add session details
    doc.setFontSize(14)
    doc.text("Session Details", 20, (doc as any).lastAutoTable.finalY + 20)

    sessions.forEach((session, index) => {
      const yPosition = (doc as any).lastAutoTable.finalY + 35 + index * 25

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        doc.setFontSize(14)
        doc.text("Session Details (continued)", 20, 20)
      }

      const currentY =
        yPosition > 250
          ? 35 + (index - Math.floor((yPosition - (doc as any).lastAutoTable.finalY - 35) / 25)) * 25
          : yPosition

      doc.setFontSize(12)
      doc.text(`${session.code}: ${session.title}`, 20, currentY)
      doc.setFontSize(10)
      doc.text(`Instructor: ${session.instructor}`, 20, currentY + 5)
      doc.text(`Description: ${session.description}`, 20, currentY + 10)
      doc.text(
        `Venue: ${session.venue} | Duration: ${session.duration} min | Enrolled: ${session.enrolled}/${session.maxParticipants}`,
        20,
        currentY + 15,
      )
    })

    // Save the PDF
      doc.save("Events_report.pdf")
    }

    logoImg.onerror = () => {
      // Fallback without logo
      doc.setFontSize(18)
      try { doc.setFont("Algerian", "bold") } catch (_) { doc.setFont("helvetica", "bold") }
      const orgName = "Majlis Ansarullah Kenya"
      const orgWidth = doc.getTextWidth(orgName)
      const orgX = (pageWidth - orgWidth) / 2
      doc.text(orgName, orgX, 20)
      doc.setFontSize(14)
      try { doc.setFont("helvetica", "normal") } catch (_) {}
      const docType = "Academic Sessions Schedule"
      const typeWidth = doc.getTextWidth(docType)
      const typeX = (pageWidth - typeWidth) / 2
      doc.text(docType, typeX, 28)

      const tableData = sessions.map((session) => [
        session.code,
        session.title,
        session.instructor,
        session.type,
        `${session.duration} min`,
        session.venue,
        new Date(session.date).toLocaleDateString(),
        `${session.startTime}-${session.endTime}`,
        `${session.enrolled}/${session.maxParticipants}`,
      ])
      ;(doc as any).autoTable({
        head: [["Code", "Title", "Instructor", "Type", "Duration", "Venue", "Date", "Time", "Enrollment"]],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      })

      doc.save("Events_report.pdf")
    }

    logoImg.crossOrigin = "anonymous"
    logoImg.src = "/ansar-logo.jpeg"
  }

  const handleDownloadExcel = () => {
    const orgName = "Majlis Ansarullah Kenya"
    const subtitle = "Academic Sessions Schedule"
    
    const headers = ["Code", "Title", "Instructor", "Type", "Duration", "Venue", "Date", "Time", "Enrollment"]
    
    const data = sessions.map((session) => [
      session.code,
      session.title,
      session.instructor,
      session.type,
      `${session.duration} min`,
      session.venue,
      new Date(session.date).toLocaleDateString(),
      `${session.startTime}-${session.endTime}`,
      `${session.enrolled}/${session.maxParticipants}`,
    ])
    
    const workbook = createStyledExcel(data, headers, orgName, subtitle, "Sessions")
    downloadStyledExcel("Academic_Sessions_Schedule.xlsx", workbook)
  }

  const { paginated, page, setPage, totalPages } = usePagination(sessions, 50)

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
                  <BookOpen className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground mb-4">Academic Sessions</h1>
                  <p className="text-sm text-muted-foreground">Ijtema 2024 Program</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <DownloadMenu
                onDownloadPdf={handleDownloadPDF}
                onDownloadExcel={handleDownloadExcel}
                triggerLabel={
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                }
              />
              <Link href="/participants">
                <Button>Register Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Reduced py-8 to py-2 to align content to top */}
      <div className="container mx-auto px-4 py-2">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">Academic Sessions</h2>
          <p className="text-muted-foreground text-lg">
            Explore our comprehensive Islamic education program featuring expert instructors and diverse learning
            formats.
          </p>
        </div>

        <div className="grid gap-6">
          {paginated.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-mono">
                        {session.code}
                      </Badge>
                      <Badge className={getTypeColor(session.type)}>{session.type}</Badge>
                    </div>
                    <CardTitle className="text-xl mb-2">{session.title}</CardTitle>
                    <CardDescription className="text-base">{session.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4 mr-2" />
                      <span className="font-medium">Instructor:</span>
                      <span className="ml-1">{session.instructor}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="font-medium">Duration:</span>
                      <span className="ml-1">{session.duration} minutes</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="font-medium">Venue:</span>
                      <span className="ml-1">{session.venue}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="font-medium">Date:</span>
                      <span className="ml-1">{new Date(session.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="font-medium">Time:</span>
                      <span className="ml-1">
                        {session.startTime} - {session.endTime}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="font-medium">Enrollment:</span>
                      <span className="ml-1">
                        {session.enrolled}/{session.maxParticipants}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(session.enrolled / session.maxParticipants) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.maxParticipants - session.enrolled} spots remaining
                    </p>
                  </div>
                  <Button className="ml-4" disabled={session.enrolled >= session.maxParticipants}>
                    {session.enrolled >= session.maxParticipants ? "Full" : "Enroll"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div>
              <nav className="flex justify-center py-4">
                <Pagination aria-label="Sessions pagination">
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
      </div>
    </div>
  )
}
