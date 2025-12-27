"use client"

import type React from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { SearchSelect } from "@/components/ui/search-select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination"
import { Search, Plus, Edit, Trash2, Download, Eye, Loader2, GraduationCap, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { cn, downloadStyledExcel, createStyledExcel } from "@/lib/utils"
import { DownloadMenu } from "@/components/download-menu"
import { usePagination } from "@/lib/hooks/usePagination"
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]
export default function AcademicsPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedParticipant, setSelectedParticipant] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [regions, setRegions] = useState<Region[]>([])
  const [majlisList, setMajlisList] = useState<Majlis[]>([])
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [selectedMajlis, setSelectedMajlis] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  // Dialog-specific filters (independent from table filters)
  const [dialogRegion, setDialogRegion] = useState("all")
  const [dialogMajlis, setDialogMajlis] = useState("all")
  // Removed random questions from Academics (migrated to Registration)
  const [avgPrayersPerDay, setAvgPrayersPerDay] = useState("")
  const [tilawatDays, setTilawatDays] = useState("")
  const [tahajjudDays, setTahajjudDays] = useState("")
  const [quranClassesAttended, setQuranClassesAttended] = useState("")
  const [fridayPrayers, setFridayPrayers] = useState("")
  const [fridaySermons, setFridaySermons] = useState("")
  const [nafliFasts, setNafliFasts] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AcademicRecord | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [filterYear, setFilterYear] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()

        // Fetch all participants in batches to avoid server-side limits
        const allParticipants: any[] = []
        const batchSize = 1000
        let start = 0
        while (true) {
          const end = start + batchSize - 1
          const { data: batch, error } = await supabase
            .from("participants")
            .select("id, full_name, registration_number, category, region_id, majlis_id, region, majlis")
            .order("full_name")
            .range(start, end)

          if (error) {
            console.error("[v0] Error fetching participants batch:", error)
            break
          }

          if (!batch || batch.length === 0) break

          allParticipants.push(...batch)

          // If we received fewer than batchSize rows, we've reached the end
          if (batch.length < batchSize) break

          start += batchSize
        }

        setParticipants(allParticipants)

        const { data: regionsData, error: regionsError } = await supabase
          .from("regions")
          .select("id, name")
          .order("name")

        if (regionsError) {
          console.error("[v0] Error fetching regions:", regionsError)
        } else {
          setRegions(regionsData || [])
        }

        const { data: majlisData, error: majlisError } = await supabase
          .from("majlis")
          .select("id, name, region_id")
          .order("name")

        if (majlisError) {
          console.error("[v0] Error fetching majlis:", majlisError)
        } else {
          setMajlisList(majlisData || [])
        }

        const { data: academicData, error: academicError } = await supabase
          .from("academic_data")
          .select(`
            *,
            participants!inner(full_name, registration_number)
          `)
          .order("created_at", { ascending: false })

        if (academicError) {
          console.error("[v0] Error fetching academic data:", academicError)
        } else {
          const monthlyOnly = (academicData || []).filter((r: any) => r.report_month && r.report_year)
          setAcademicRecords(monthlyOnly)
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])
  const selectedRegionName = selectedRegion !== "all" ? regions.find((r) => r.id === selectedRegion)?.name : undefined
  const selectedMajlisName = selectedMajlis !== "all" ? majlisList.find((m) => m.id === selectedMajlis)?.name : undefined
  const filteredMajlis = selectedRegion !== "all" ? majlisList.filter((m) => m.region_id === selectedRegion) : majlisList
  const filteredParticipantsByGeo = participants.filter((p) => {
    const regionOk =
      selectedRegion === "all" ||
      p.region_id === selectedRegion ||
      (!!selectedRegionName && (p.region || "").toLowerCase() === selectedRegionName.toLowerCase())
    const majlisOk =
      selectedMajlis === "all" ||
      p.majlis_id === selectedMajlis ||
      (!!selectedMajlisName && (p.majlis || "").toLowerCase() === selectedMajlisName.toLowerCase())
    return regionOk && majlisOk
  })

  // Dialog-scoped filtering
  const dialogRegionName = dialogRegion !== "all" ? regions.find((r) => r.id === dialogRegion)?.name : undefined
  const dialogMajlisName = dialogMajlis !== "all" ? majlisList.find((m) => m.id === dialogMajlis)?.name : undefined
  const dialogFilteredMajlis = dialogRegion !== "all" ? majlisList.filter((m) => m.region_id === dialogRegion) : majlisList
  const filteredParticipantsForDialog = participants.filter((p) => {
    const regionOk =
      dialogRegion === "all" ||
      p.region_id === dialogRegion ||
      (!!dialogRegionName && (p.region || "").toLowerCase() === dialogRegionName.toLowerCase())
    const majlisOk =
      dialogMajlis === "all" ||
      p.majlis_id === dialogMajlis ||
      (!!dialogMajlisName && (p.majlis || "").toLowerCase() === dialogMajlisName.toLowerCase())
    return regionOk && majlisOk
  })

  // Random questions removed; Academics now only handles Spiritual Monthly Report

  const handleSaveAcademicData = async () => {
    if (!selectedParticipant || !selectedMonth || !selectedYear) {
      toast({
        title: "Missing Information",
        description: "Please select a participant, month and year.",
        variant: "destructive",
      })
      return
    }

    try {
      if (isSaving) return
      setIsSaving(true)
      const supabase = createClient()

      const { error } = await supabase.from("academic_data").insert({
        participant_id: selectedParticipant,
        report_month: selectedMonth, // Changed from 'month' to 'report_month'
        report_year: selectedYear ? Number.parseInt(selectedYear) : null,
        avg_prayers_per_day: avgPrayersPerDay ? Number.parseInt(avgPrayersPerDay) : null,
        days_tilawat_done: tilawatDays ? Number.parseInt(tilawatDays) : null, // Changed from 'tilawat_days'
        tahajjud_days: tahajjudDays ? Number.parseInt(tahajjudDays) : null,
        quran_classes_attended: quranClassesAttended ? Number.parseInt(quranClassesAttended) : null,
        friday_prayers_attended: fridayPrayers ? Number.parseInt(fridayPrayers) : null, // Changed from 'friday_prayers'
        huzur_sermons_listened: fridaySermons ? Number.parseInt(fridaySermons) : null, // Changed from 'friday_sermons'
        nafli_fasts: nafliFasts ? Number.parseInt(nafliFasts) : null,
      })

      if (error) {
        throw error
      }

      

      // Reset form and refresh data
      setSelectedParticipant("")
      setSelectedMonth("")
      setSelectedYear("")
      setAvgPrayersPerDay("")
      setTilawatDays("")
      setTahajjudDays("")
      setQuranClassesAttended("")
      setFridayPrayers("")
      setFridaySermons("")
      setNafliFasts("")
      setIsDialogOpen(false)
      setIsSaving(false)

      // Refresh academic records
      const { data: academicData } = await supabase
        .from("academic_data")
        .select(`
          *,
          participants!inner(full_name, registration_number)
        `)
        .order("created_at", { ascending: false })

      const monthlyOnly = (academicData || []).filter((r: any) => r.report_month && r.report_year)
      setAcademicRecords(monthlyOnly)
    } catch (error) {
      console.error("[v0] Error saving academic data:", error)
      toast({
        title: "Error",
        description: "Failed to save academic data. Please try again.",
        variant: "destructive",
      })
      setIsSaving(false)
    }
  }

  const handleDeleteAcademicRecord = async (recordId: string) => {
    setDeletingId(recordId)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("academic_data").delete().eq("id", recordId)

      if (error) {
        throw error
      }

      setAcademicRecords((prev) => prev.filter((record) => record.id !== recordId))
      
    } catch (error) {
      console.error("[v0] Error deleting academic record:", error)
      toast({
        title: "Error",
        description: "Failed to delete academic record",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record)
    setViewDialogOpen(true)
  }

  const handleEditRecord = (record: any) => {
    setSelectedRecord(record)
    // Pre-populate form fields with existing data
    setSelectedParticipant(record.participant_id)
    setSelectedMonth(record.report_month)
    setSelectedYear(record.report_year?.toString() || "")
    setAvgPrayersPerDay(record.avg_prayers_per_day?.toString() || "")
    setTilawatDays(record.days_tilawat_done?.toString() || "")
    setTahajjudDays((record as any).tahajjud_days?.toString() || "")
    setQuranClassesAttended((record as any).quran_classes_attended?.toString() || "")
    setFridayPrayers(record.friday_prayers_attended?.toString() || "")
    setFridaySermons(record.huzur_sermons_listened?.toString() || "")
    setNafliFasts(record.nafli_fasts?.toString() || "")
    setEditDialogOpen(true)
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" })

    const eventSettings = localStorage.getItem("eventSettings")
    const eventName = eventSettings ? JSON.parse(eventSettings).eventName : "Ijtema 2024"

    const logoImg = new Image()
    logoImg.onload = () => {
      // Add the logo at the top center
      const logoSize = 20
      const pageWidth = doc.internal.pageSize.getWidth()
      const logoX = (pageWidth - logoSize) / 2

      doc.addImage(logoImg, "JPEG", logoX, 10, logoSize, logoSize)

      doc.setFontSize(18)
      try { doc.setFont("Algerian", "bold") } catch (_) { doc.setFont("helvetica", "bold") }
      const orgName = "Majlis Ansarullah Kenya"
      const orgNameWidth = doc.getTextWidth(orgName)
      const orgNameX = (pageWidth - orgNameWidth) / 2
      doc.text(orgName, orgNameX, 40)

      doc.setFontSize(14)
      try { doc.setFont("helvetica", "normal") } catch (_) {}
      const docType = "Academics Report"
      const docTypeWidth = doc.getTextWidth(docType)
      const docTypeX = (pageWidth - docTypeWidth) / 2
      doc.text(docType, docTypeX, 50)

      // Add generation date and stats
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 65)
      doc.text(`Total Records: ${filteredRecords.length}`, 20, 70)

      // Prepare table data
      const tableData = filteredRecords.map((data) => [
        data.participants?.full_name ?? "",
        data.report_month || "N/A",
        (data as any).report_year?.toString() || "N/A",
        data.avg_prayers_per_day?.toString() || "0",
        data.days_tilawat_done?.toString() || "0",
        (data as any).tahajjud_days?.toString() || "0",
        (data as any).quran_classes_attended?.toString() || "0",
        data.friday_prayers_attended?.toString() || "0",
        data.huzur_sermons_listened?.toString() || "0",
        data.nafli_fasts?.toString() || "0",
      ])

      autoTable(doc, {
        head: [
          [
            "Participant",
            "Month",
            "Year",
            "Daily Prayers",
            "Tilawat Pages",
            "Tahajjud Days",
            "Quran Classes",
            "Friday Prayers",
            "Huzur Sermons",
            "Nafil Fasts",
          ],
        ],
        body: tableData,
        startY: 80, // Adjusted startY to accommodate new headers
        styles: { fontSize: 6 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      })

      // Save the PDF
      doc.save("tarbiyyat_report.pdf")
    }

    logoImg.onerror = () => {
      console.log("[v0] Logo image failed to load, generating PDF without logo")

      const doc = new jsPDF({ orientation: "landscape" })
      const pageWidth = doc.internal.pageSize.getWidth()

      doc.setFontSize(18)
      try { doc.setFont("Algerian", "bold") } catch (_) { doc.setFont("helvetica", "bold") }
      const orgName = "Majlis Ansarullah Kenya"
      const orgNameWidth = doc.getTextWidth(orgName)
      const orgNameX = (pageWidth - orgNameWidth) / 2
      doc.text(orgName, orgNameX, 20)

      doc.setFontSize(14)
      try { doc.setFont("helvetica", "normal") } catch (_) {}
      const docType = "Academics Report"
      const docTypeWidth = doc.getTextWidth(docType)
      const docTypeX = (pageWidth - docTypeWidth) / 2
      doc.text(docType, docTypeX, 30)

      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45)
      doc.text(`Total Records: ${academicRecords.length}`, 20, 50)

      const tableData = filteredRecords.map((data) => [
        data.participants?.full_name ?? "",
        data.report_month || "N/A",
        (data as any).report_year?.toString() || "N/A",
        data.avg_prayers_per_day?.toString() || "0",
        data.days_tilawat_done?.toString() || "0",
        (data as any).tahajjud_days?.toString() || "0",
        (data as any).quran_classes_attended?.toString() || "0",
        data.friday_prayers_attended?.toString() || "0",
        data.huzur_sermons_listened?.toString() || "0",
        data.nafli_fasts?.toString() || "0",
      ])

      autoTable(doc, {
        head: [
          [
            "Participant",
            "Month",
            "Year",
            "Daily Prayers",
            "Tilawat Pages",
            "Tahajjud Days",
            "Quran Classes",
            "Friday Prayers",
            "Huzur Sermons",
            "Nafil Fasts",
          ],
        ],
        body: tableData,
        startY: 60,
        styles: { fontSize: 6 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      })

      doc.save("tarbiyyat_report.pdf")
    }

    logoImg.src = "/ansar-logo.jpeg"
  }

  const handleDownloadCSV = () => {
    const header = [
      "Participant",
      "Month",
      "Year",
      "Daily Prayers",
      "Tilawat Pages",
      "Tahajjud Days",
      "Quran Classes",
      "Friday Prayers",
      "Huzur Sermons",
  "Nafil Fasts",
    ]
    const rows = filteredRecords.map((data) => [
      data.participants?.full_name ?? "",
      data.report_month || "N/A",
      (data as any).report_year?.toString() || "N/A",
      data.avg_prayers_per_day?.toString() || "0",
      data.days_tilawat_done?.toString() || "0",
      (data as any).tahajjud_days?.toString() || "0",
      (data as any).quran_classes_attended?.toString() || "0",
      data.friday_prayers_attended?.toString() || "0",
      data.huzur_sermons_listened?.toString() || "0",
      data.nafli_fasts?.toString() || "0",
    ])
    const csv = toCsv(rows, header)
    downloadCsv("tarbiyyat_report.csv", csv)
  }

  const handleDownloadExcel = () => {
    const eventSettings = localStorage.getItem("eventSettings")
    const eventName = eventSettings ? JSON.parse(eventSettings).eventName : "Ijtema 2024"

    const orgName = "Majlis Ansarullah Kenya"
    const subtitle = "Academics Report"

    const headers = [
      "Participant",
      "Registration Number",
      "Month",
      "Year",
      "Avg Prayers/Day",
      "Tilawat Days",
      "Tahajjud Days",
      "Quran Classes Attended",
      "Friday Prayers Attended",
      "Huzur Sermons Listened",
  "Nafil Fasts",
      "Record Created At"
    ]

    const data = filteredRecords.map((data) => [
      data.participants?.full_name ?? "",
      data.participants?.registration_number ?? "",
      data.report_month || "N/A",
      (data as any).report_year?.toString() || "N/A",
      data.avg_prayers_per_day?.toString() || "0",
      data.days_tilawat_done?.toString() || "0",
      (data as any).tahajjud_days?.toString() || "0",
      (data as any).quran_classes_attended?.toString() || "0",
      data.friday_prayers_attended?.toString() || "0",
      data.huzur_sermons_listened?.toString() || "0",
      data.nafli_fasts?.toString() || "0",
      data.created_at ? new Date(data.created_at).toLocaleDateString() : "-"
    ])

    const workbook = createStyledExcel(data, headers, orgName, subtitle, "Academics")
    downloadStyledExcel("tarbiyyat_report.xlsx", workbook)
  }

  const filteredRecords = academicRecords.filter((record) => {
    const matchesSearch =
      record.participants?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.participants?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.report_month?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMonth = selectedMonth === "" || selectedMonth === "all" || record.report_month === selectedMonth
    const matchesYear = filterYear === "all" || filterYear === "" || (record as any).report_year?.toString() === filterYear
    const participant = participants.find((p) => p.id === record.participant_id)
    const selectedRegionName = selectedRegion !== "all" ? regions.find((r) => r.id === selectedRegion)?.name : undefined
    const selectedMajlisName = selectedMajlis !== "all" ? majlisList.find((m) => m.id === selectedMajlis)?.name : undefined
    const matchesRegion =
      selectedRegion === "all" ||
      (!!participant && (participant.region_id === selectedRegion || (!!selectedRegionName && (participant.region || "").toLowerCase() === selectedRegionName.toLowerCase())))
    const matchesMajlis =
      selectedMajlis === "all" ||
      (!!participant && (participant.majlis_id === selectedMajlis || (!!selectedMajlisName && (participant.majlis || "").toLowerCase() === selectedMajlisName.toLowerCase())))
    return matchesSearch && matchesMonth && matchesYear && matchesRegion && matchesMajlis
  })

  const { paginated, page, setPage, totalPages } = usePagination(filteredRecords, 50)

  if (loading) {
    return (
      <div>
        <MainNavigation />
        <main className="container mx-auto px-4 py-2">
          <div className="text-center py-8">
            <p>Loading Tarbiyyat...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div>
      <MainNavigation />

      <main className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between mb-8 gap-2 flex-wrap">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-foreground">Tarbiyyat Data</h1>
            <p className="text-muted-foreground">Manage member tarbiyyat and spiritual progress</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleDownloadPDF} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleDownloadExcel} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Download Excel
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Data
            </Button>
          </div>
        </div>

        {/* Random Questions dashboard removed */}

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by member name, registration number, or month..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="month-filter">Filter by Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="year-filter">Filter by Year</Label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger>
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {Array.from(
                  new Set(
                    academicRecords
                      .map((r) => (r as any).report_year)
                      .filter((y) => y !== null && y !== undefined),
                  ),
                )
                  .sort((a: any, b: any) => a - b)
                  .map((year: any) => (
                    <SelectItem key={year.toString()} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="region-filter">Filter by Region</Label>
            <Select value={selectedRegion} onValueChange={(val) => { setSelectedRegion(val) }}>
              <SelectTrigger>
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="majlis-filter">Filter by Majlis</Label>
            <Select value={selectedMajlis} onValueChange={setSelectedMajlis}>
              <SelectTrigger>
                <SelectValue placeholder="All majlis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All majlis</SelectItem>
                {filteredMajlis.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={false}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record Spiritual Monthly Report</DialogTitle>
                <DialogDescription>Fill spiritual monthly report information for a member</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Select value={dialogRegion} onValueChange={(val) => { setDialogRegion(val) }}>
                      <SelectTrigger>
                        <SelectValue placeholder="All regions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All regions</SelectItem>
                        {regions.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="majlis">Majlis</Label>
                    <Select value={dialogMajlis} onValueChange={setDialogMajlis}>
                      <SelectTrigger>
                        <SelectValue placeholder="All majlis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All majlis</SelectItem>
                        {dialogFilteredMajlis.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="month">Month</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      min="2000"
                      max="2100"
                      placeholder="e.g. 2025"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="member">Name as per ID Card</Label>
                  <SearchSelect
                    value={selectedParticipant}
                    onValueChange={setSelectedParticipant}
                    options={filteredParticipantsForDialog.map((p) => ({
                      value: p.id,
                      label: `${p.full_name} (${p.registration_number})`,
                      searchText: `${p.full_name} ${p.registration_number}`,
                    }))}
                    placeholder="Select member"
                    searchPlaceholder="Search member by name or reg no..."
                    emptyText="No member found"
                    className="w-full"
                  />
                </div>

                {/* Random Questions section removed (migrated to Registration) */}

                <Card className="border-islamic-green/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-islamic-green">Spiritual Monthly Report</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="avg-prayers">Average Number of prayers offered per day</Label>
                        <Input
                          id="avg-prayers"
                          type="number"
                          min="0"
                          max="5"
                          value={avgPrayersPerDay}
                          onChange={(e) => setAvgPrayersPerDay(e.target.value)}
                          placeholder="0-5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="tilawat-days">Number of days Tilawat of Holy Quran was done</Label>
                        <Input
                          id="tilawat-days"
                          type="number"
                          min="0"
                          max="31"
                          value={tilawatDays}
                          onChange={(e) => setTilawatDays(e.target.value)}
                          placeholder="0-31"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tahajjud-days">Number of days offered Tahajjud prayer</Label>
                        <Input
                          id="tahajjud-days"
                          type="number"
                          min="0"
                          max="31"
                          value={tahajjudDays}
                          onChange={(e) => setTahajjudDays(e.target.value)}
                          placeholder="0-31"
                        />
                      </div>

                      <div>
                        <Label htmlFor="quran-classes">Number of Quran Class attended</Label>
                        <Input
                          id="quran-classes"
                          type="number"
                          min="0"
                          max="31"
                          value={quranClassesAttended}
                          onChange={(e) => setQuranClassesAttended(e.target.value)}
                          placeholder="0-31"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="friday-prayers">Number of Friday prayers attended</Label>
                        <Input
                          id="friday-prayers"
                          type="number"
                          min="0"
                          max="5"
                          value={fridayPrayers}
                          onChange={(e) => setFridayPrayers(e.target.value)}
                          placeholder="0-5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="friday-sermons">Number of Huzur's Friday sermon listened</Label>
                        <Input
                          id="friday-sermons"
                          type="number"
                          min="0"
                          max="5"
                          value={fridaySermons}
                          onChange={(e) => setFridaySermons(e.target.value)}
                          placeholder="0-5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="nafil-fasts">Number of Nafil fasts</Label>
                      <Input
                        id="nafli-fasts"
                        type="number"
                        min="0"
                        value={nafliFasts}
                        onChange={(e) => setNafliFasts(e.target.value)}
                        placeholder="Enter number"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleSaveAcademicData}
                  className="w-full"
                  disabled={isSaving || !selectedParticipant || !selectedMonth || !selectedYear}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Data"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5" />
              <span>Tarbiyyat Records ({filteredRecords.length})</span>
            </CardTitle>
            <CardDescription>Tarbiyyat and spiritual data for all members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="stacked-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Year</TableHead>
                    <TableHead>Avg Prayers/Day</TableHead>
                    <TableHead>Tilawat Days</TableHead>
                    <TableHead>Tahajjud Days</TableHead>
                    <TableHead>Quran Classes</TableHead>
                    <TableHead>Friday Prayers</TableHead>
                    <TableHead>Friday Sermons</TableHead>
                    <TableHead>Nafil Fasts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <>
                    {paginated.map((record) => (
                      <TableRow key={record.id}>
                      <TableCell data-label="Member" className="font-medium">{record.participants?.full_name}</TableCell>
                      <TableCell data-label="Month">{record.report_month}</TableCell>
                      <TableCell data-label="Year">{(record as any).report_year ?? "N/A"}</TableCell>
                      <TableCell data-label="Avg Prayers/Day">{record.avg_prayers_per_day}</TableCell>
                      <TableCell data-label="Tilawat Days">{record.days_tilawat_done}</TableCell>
                      <TableCell data-label="Tahajjud Days">{(record as any).tahajjud_days}</TableCell>
                      <TableCell data-label="Quran Classes">{(record as any).quran_classes_attended}</TableCell>
                      <TableCell data-label="Friday Prayers">{record.friday_prayers_attended}</TableCell>
                      <TableCell data-label="Friday Sermons">{record.huzur_sermons_listened}</TableCell>
                      <TableCell data-label="Nafil Fasts">{record.nafli_fasts}</TableCell>
                      <TableCell data-label="Actions" className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewRecord(record)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditRecord(record)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive bg-transparent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Academic Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this academic record for{" "}
                                  {record.participants?.full_name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAcademicRecord(record.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deletingId === record.id}
                                >
                                  {deletingId === record.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                        ))}
                        {totalPages > 1 && (
                          <TableRow>
                            <TableCell colSpan={11} className="px-4 py-3">
                              <nav className="flex justify-center">
                                <Pagination aria-label="Academics pagination">
                                  <PaginationContent>
                                    <PaginationItem>
                                      <PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} href="#" />
                                    </PaginationItem>
                                    {(() => {
                                      const maxVisible = 11 // show up to 11 numeric links (with ellipses)
                                      const pages: (number | "...")[] = []
                                      if (totalPages <= maxVisible) {
                                        for (let i = 1; i <= totalPages; i++) pages.push(i)
                                      } else {
                                        const left = Math.max(2, page - 2)
                                        const right = Math.min(totalPages - 1, page + 2)
                                        pages.push(1)
                                        if (left > 2) pages.push("...")
                                        for (let i = left; i <= right; i++) pages.push(i)
                                        if (right < totalPages - 1) pages.push("...")
                                        pages.push(totalPages)
                                      }

                                      return pages.map((p, idx) => {
                                        if (p === "...") {
                                          return (
                                            <PaginationItem key={`e-${idx}`}>
                                              <PaginationEllipsis />
                                            </PaginationItem>
                                          )
                                        }
                                        return (
                                          <PaginationItem key={p}>
                                            <PaginationLink isActive={p === page} href="#" onClick={() => setPage(p as number)}>
                                              {p}
                                            </PaginationLink>
                                          </PaginationItem>
                                        )
                                      })
                                    })()}
                                    <PaginationItem>
                                      <PaginationNext onClick={() => setPage(Math.min(totalPages, page + 1))} href="#" />
                                    </PaginationItem>
                                  </PaginationContent>
                                </Pagination>
                              </nav>
                            </TableCell>
                          </TableRow>
                        )}
                    </>
                  </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Academic Records - {selectedRecord?.participants?.full_name}</DialogTitle>
              <DialogDescription>
                Viewing all academic data for {selectedRecord?.participants?.full_name} organized by month
              </DialogDescription>
            </DialogHeader>
            {selectedRecord &&
              (() => {
                const participantRecords = academicRecords.filter(
                  (record) => record.participant_id === selectedRecord.participant_id,
                )

                // Group records by month
                const recordsByMonth = participantRecords.reduce(
                  (acc, record) => {
                    const month = record.report_month
                    if (!acc[month]) {
                      acc[month] = []
                    }
                    acc[month].push(record)
                    return acc
                  },
                  {} as Record<string, AcademicRecord[]>,
                )

                // Sort months chronologically
                const sortedMonths = Object.keys(recordsByMonth).sort((a, b) => months.indexOf(a) - months.indexOf(b))

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Participant</Label>
                        <p className="text-lg font-semibold">{selectedRecord.participants?.full_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Registration Number</Label>
                        <p className="text-lg font-semibold">{selectedRecord.participants?.registration_number}</p>
                      </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Year</Label>
                  <p className="text-lg font-semibold">{(selectedRecord as any)?.report_year ?? "N/A"}</p>
                </div>
                    </div>

                    {/* Random question summary removed */}

                    <div>
                      <h3 className="text-xl font-semibold text-islamic-green mb-4">Monthly Reports</h3>
                      {sortedMonths.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No monthly reports found for this participant.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {sortedMonths.map((month) => (
                            <Card key={month} className="border-islamic-green/20">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg text-islamic-green flex items-center space-x-2">
                                  <BookOpen className="w-5 h-5" />
                                  <span>{month} Spiritual Report</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {recordsByMonth[month].map((monthRecord, index) => (
                                  <div key={monthRecord.id} className="space-y-4">
                                    {index > 0 && <hr className="my-4" />}

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm">Average Prayers per Day:</span>
                                        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          {monthRecord.avg_prayers_per_day || "Not specified"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm">Tilawat Days:</span>
                                        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          {monthRecord.days_tilawat_done || "Not specified"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm">Tahajjud Days:</span>
                                        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          {(monthRecord as any).tahajjud_days || "Not specified"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm">Quran Classes Attended:</span>
                                        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          {(monthRecord as any).quran_classes_attended || "Not specified"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm">Friday Prayers Attended:</span>
                                        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          {monthRecord.friday_prayers_attended || "Not specified"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm">Friday Sermons Listened:</span>
                                        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          {monthRecord.huzur_sermons_listened || "Not specified"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm">Nafil Fasts:</span>
                                        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          {monthRecord.nafli_fasts || "Not specified"}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-xs text-muted-foreground text-right">
                                      Record created: {new Date(monthRecord.created_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen} modal={false}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Academic Record</DialogTitle>
              <DialogDescription>Update academic data for {selectedRecord?.participants?.full_name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="participant">Name as per ID Card</Label>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Select value={selectedRegion} onValueChange={(val) => { setSelectedRegion(val) }}>
                        <SelectTrigger>
                          <SelectValue placeholder="All regions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All regions</SelectItem>
                          {regions.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="majlis">Majlis</Label>
                      <Select value={selectedMajlis} onValueChange={setSelectedMajlis}>
                        <SelectTrigger>
                          <SelectValue placeholder="All majlis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All majlis</SelectItem>
                          {filteredMajlis.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <SearchSelect
                    value={selectedParticipant}
                    onValueChange={setSelectedParticipant}
                    options={filteredParticipantsByGeo.map((p) => ({
                      value: p.id,
                      label: `${p.full_name} (${p.registration_number})`,
                      searchText: `${p.full_name} ${p.registration_number}`,
                    }))}
                    placeholder="Select participant"
                    searchPlaceholder="Search member by name or reg no..."
                    emptyText="No member found"
                    className="w-full"
                  />
                </div>
                  <div>
                  <Label htmlFor="month">Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      min="2000"
                      max="2100"
                      placeholder="e.g. 2025"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    />
                  </div>
              </div>

              {/* Random Questions edit section removed */}

              <Card className="border-islamic-green/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-islamic-green">Spiritual Monthly Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-avg-prayers">Average Number of prayers offered per day</Label>
                      <Input
                        id="edit-avg-prayers"
                        type="number"
                        min="0"
                        max="5"
                        value={avgPrayersPerDay}
                        onChange={(e) => setAvgPrayersPerDay(e.target.value)}
                        placeholder="0-5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-tilawat-days">Number of days Tilawat of Holy Quran was done</Label>
                      <Input
                        id="edit-tilawat-days"
                        type="number"
                        min="0"
                        max="31"
                        value={tilawatDays}
                        onChange={(e) => setTilawatDays(e.target.value)}
                        placeholder="0-31"
                      />
                    </div>
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-tahajjud-days">Number of days offered Tahajjud prayer</Label>
                    <Input
                      id="edit-tahajjud-days"
                      type="number"
                      min="0"
                      max="31"
                      value={tahajjudDays}
                      onChange={(e) => setTahajjudDays(e.target.value)}
                      placeholder="0-31"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-quran-classes">Number of Quran Class attended</Label>
                    <Input
                      id="edit-quran-classes"
                      type="number"
                      min="0"
                      max="31"
                      value={quranClassesAttended}
                      onChange={(e) => setQuranClassesAttended(e.target.value)}
                      placeholder="0-31"
                    />
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-friday-prayers">Number of Friday prayers attended</Label>
                      <Input
                        id="edit-friday-prayers"
                        type="number"
                        min="0"
                        max="5"
                        value={fridayPrayers}
                        onChange={(e) => setFridayPrayers(e.target.value)}
                        placeholder="0-5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-friday-sermons">Number of Huzur's Friday sermon listened</Label>
                      <Input
                        id="edit-friday-sermons"
                        type="number"
                        min="0"
                        max="5"
                        value={fridaySermons}
                        onChange={(e) => setFridaySermons(e.target.value)}
                        placeholder="0-5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-nafil-fasts">Number of Nafil fasts</Label>
                    <Input
                      id="edit-nafli-fasts"
                      type="number"
                      min="0"
                      value={nafliFasts}
                      onChange={(e) => setNafliFasts(e.target.value)}
                      placeholder="Enter number"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex space-x-2">
                <Button
                  onClick={async () => {
                    // Update existing record
                    try {
                      if (!selectedRecord) return
                      const supabase = createClient()
                      const { error } = await supabase
                        .from("academic_data")
                        .update({
                          participant_id: selectedParticipant,
                          report_month: selectedMonth,
                          avg_prayers_per_day: avgPrayersPerDay ? Number.parseInt(avgPrayersPerDay) : null,
                          days_tilawat_done: tilawatDays ? Number.parseInt(tilawatDays) : null,
                          tahajjud_days: tahajjudDays ? Number.parseInt(tahajjudDays) : null,
                          quran_classes_attended: quranClassesAttended ? Number.parseInt(quranClassesAttended) : null,
                          friday_prayers_attended: fridayPrayers ? Number.parseInt(fridayPrayers) : null,
                          huzur_sermons_listened: fridaySermons ? Number.parseInt(fridaySermons) : null,
                          nafli_fasts: nafliFasts ? Number.parseInt(nafliFasts) : null,
                        })
                        .eq("id", selectedRecord!.id)

                      if (error) throw error

                      

                      // Refresh data
                      const { data: academicData } = await supabase
                        .from("academic_data")
                        .select(`
                          *,
                          participants!inner(full_name, registration_number)
                        `)
                        .order("created_at", { ascending: false })

                      setAcademicRecords(academicData || [])
                      setEditDialogOpen(false)
                    } catch (error) {
                      console.error("[v0] Error updating record:", error)
                      toast({
                        title: "Error",
                        description: "Failed to update record. Please try again.",
                        variant: "destructive",
                      })
                    }
                  }}
                  className="flex-1"
                  disabled={!selectedParticipant || !selectedMonth}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Record
                </Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
