"use client"

import type React from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
// import Image from "next/image"

import { useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { SearchSelect } from "@/components/ui/search-select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Download, Check, ChevronsUpDown, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { cn, downloadStyledExcel, createStyledExcel } from "@/lib/utils"
import { DownloadMenu } from "@/components/download-menu"
import { usePagination } from "@/lib/hooks/usePagination"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination"

interface Maal {
  id: string
  participant_id: string
  participant_name: string
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

interface Participant {
  id: string
  full_name: string
  registration_number: string
  region_id?: string | null
  majlis_id?: string | null
  region?: string | null
  majlis?: string | null
}

interface Region { id: string; name: string }
interface Majlis { id: string; name: string; region_id: string }

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

export default function MaalPage() {
  const [maals, setMaals] = useState<Maal[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [majlisList, setMajlisList] = useState<Majlis[]>([])
  // Removed unused contributions state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [selectedMajlis, setSelectedMajlis] = useState("all")
  // Dialog-specific filters (independent from table filters)
  const [dialogRegion, setDialogRegion] = useState("all")
  const [dialogMajlis, setDialogMajlis] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editingMaal, setEditingMaal] = useState<Maal | null>(null)
  const [loading, setLoading] = useState(true)
  const [participantComboboxOpen, setParticipantComboboxOpen] = useState(false)
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    participantId: "",
    month: "",
    year: "",
    chandaMajlis: "",
    chandaIjtema: "",
    tehrikEJadid: "",
    waqfEJadid: "",
    publication: "",
    khidmatEKhalq: "",
    ansarProject: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()

      // Fetch all participants in batches like the API does
      const allParticipants: Participant[] = []
      const batchSize = 1000
      let start = 0
      while (true) {
        const end = start + batchSize - 1
        const { data: batch, error } = await supabase
          .from("participants")
          .select("id, full_name, registration_number, region_id, majlis_id, region, majlis")
          .order("full_name")
          .range(start, end)

        if (error) {
          console.error("[v0] Error fetching participants batch:", error)
          break
        }

        if (!batch || batch.length === 0) break

        allParticipants.push(...batch)

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

      const { data: contributionsData, error: contributionsError } = await supabase
        .from("contributions")
        .select(`
          *,
          participants!inner(full_name, registration_number)
        `)
        .order("created_at", { ascending: false })

      if (contributionsError) {
        console.error("[v0] Error fetching contributions:", contributionsError)
      } else {
        // Transform data to match component interface
        const transformedMaals =
          contributionsData?.map((contrib) => ({
            ...contrib,
            participant_name: contrib.participants.full_name,
          })) || []
        setMaals(transformedMaals)
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const participant = participants.find((p) => p.id === formData.participantId)
    if (!participant) return

    try {
      if (isSaving) return
      setIsSaving(true)
      const supabase = createClient()

      const contributionData = {
        participant_id: formData.participantId,
        month: formData.month,
        year: formData.year ? Number.parseInt(formData.year) : null,
        chanda_majlis: formData.chandaMajlis ? Number.parseFloat(formData.chandaMajlis) : null,
        chanda_ijtema: formData.chandaIjtema ? Number.parseFloat(formData.chandaIjtema) : null,
        tehrik_e_jadid: formData.tehrikEJadid ? Number.parseFloat(formData.tehrikEJadid) : null,
        waqf_e_jadid: formData.waqfEJadid ? Number.parseFloat(formData.waqfEJadid) : null,
        publication: formData.publication ? Number.parseFloat(formData.publication) : null,
        khidmat_e_khalq: formData.khidmatEKhalq ? Number.parseFloat(formData.khidmatEKhalq) : null,
        ansar_project: formData.ansarProject ? Number.parseFloat(formData.ansarProject) : null,
      }

      if (editingMaal) {
        const { error } = await supabase.from("contributions").update(contributionData).eq("id", editingMaal.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("contributions").insert(contributionData)

        if (error) throw error
      }

      resetForm()
      loadData() // Refresh data
      setIsSaving(false)
    } catch (error) {
      console.error("[v0] Error saving contribution:", error)
      toast({
        title: "Error",
        description: "Failed to save contribution. Please try again.",
        variant: "destructive",
      })
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      participantId: "",
      month: "",
      year: "",
      chandaMajlis: "",
      chandaIjtema: "",
      tehrikEJadid: "",
      waqfEJadid: "",
      publication: "",
      khidmatEKhalq: "",
      ansarProject: "",
    })
    setShowForm(false)
  setEditingMaal(null)
  }

  const handleEdit = (maal: Maal) => {
    setFormData({
      participantId: maal.participant_id,
      month: maal.month,
      year: maal.year?.toString() || "",
      chandaMajlis: maal.chanda_majlis?.toString() || "",
      chandaIjtema: maal.chanda_ijtema?.toString() || "",
      tehrikEJadid: maal.tehrik_e_jadid?.toString() || "",
      waqfEJadid: maal.waqf_e_jadid?.toString() || "",
      publication: maal.publication?.toString() || "",
      khidmatEKhalq: maal.khidmat_e_khalq?.toString() || "",
      ansarProject: maal.ansar_project?.toString() || "",
    })
    setEditingMaal(maal)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase.from("contributions").delete().eq("id", id)

      if (error) throw error

      
      loadData() // Refresh data
    } catch (error) {
      console.error("[v0] Error deleting contribution:", error)
      toast({
        title: "Error",
        description: "Failed to delete contribution. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()

    const eventSettings = localStorage.getItem("eventSettings")
    const eventName = eventSettings ? JSON.parse(eventSettings).eventName : "Ijtema 2024"

    // Add logo to the center-top of the PDF
    const logoImg = new window.Image()
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
      const docType = "Contribution Report"
      const docTypeWidth = doc.getTextWidth(docType)
      const docTypeX = (pageWidth - docTypeWidth) / 2
      doc.text(docType, docTypeX, 50)

      // Add generation date and stats
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 65)
  doc.text(`Total Records: ${filteredMaals.length}`, 20, 70)

  const totalAmount = filteredMaals.reduce((sum, maal) => sum + calculateTotal(maal), 0)
      doc.text(`Total Amount: KES ${totalAmount.toLocaleString()}`, 20, 75)

      // Prepare table data
  const tableData = filteredMaals.map((c) => [
        c.participant_name,
        c.month,
        (c as any).year?.toString() || "N/A",
        c.chanda_majlis?.toLocaleString() || "0",
        c.chanda_ijtema?.toLocaleString() || "0",
        c.tehrik_e_jadid?.toLocaleString() || "0",
        c.waqf_e_jadid?.toLocaleString() || "0",
        c.publication?.toLocaleString() || "0",
        c.khidmat_e_khalq?.toLocaleString() || "0",
        c.ansar_project?.toLocaleString() || "0",
        calculateTotal(c).toLocaleString(),
      ])

      autoTable(doc, {
        head: [
          [
            "Name as per ID Card",
            "Month",
            "Year",
            "Chanda Majlis",
            "Chanda Ijtema",
            "Tehrik-e-Jadid",
            "Waqf-e-jadid",
            "Publication",
            "Khidmat-e-khalq",
            "Ansar Project",
            "Total",
          ],
        ],
        body: tableData,
        startY: 85, // Adjusted startY to accommodate new headers
        styles: { fontSize: 6 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      })

      // Save the PDF
  doc.save("maal_report.pdf")
    }

    logoImg.onerror = () => {
      console.warn("[v0] Logo image failed to load, generating PDF without logo")
      // Generate PDF without logo if image fails to load
      const pageWidth = doc.internal.pageSize.getWidth()

      doc.setFontSize(18)
      try { doc.setFont("Algerian", "bold") } catch (_) { doc.setFont("helvetica", "bold") }
      const orgName = "Majlis Ansarullah Kenya"
      const orgNameWidth = doc.getTextWidth(orgName)
      const orgNameX = (pageWidth - orgNameWidth) / 2
      doc.text(orgName, orgNameX, 30)

      doc.setFontSize(14)
      try { doc.setFont("helvetica", "normal") } catch (_) {}
      const docType = "maal Report"
      const docTypeWidth = doc.getTextWidth(docType)
      const docTypeX = (pageWidth - docTypeWidth) / 2
      doc.text(docType, docTypeX, 40)

      // Add generation date and stats
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 55)
  doc.text(`Total Records: ${filteredMaals.length}`, 20, 60)

  const totalAmount = filteredMaals.reduce((sum, maal) => sum + calculateTotal(maal), 0)
      doc.text(`Total Amount: KES ${totalAmount.toLocaleString()}`, 20, 65)

      // Prepare table data
  const tableData = filteredMaals.map((c) => [
        c.participant_name,
        c.month,
        (c as any).year?.toString() || "N/A",
        c.chanda_majlis?.toLocaleString() || "0",
        c.chanda_ijtema?.toLocaleString() || "0",
        c.tehrik_e_jadid?.toLocaleString() || "0",
        c.waqf_e_jadid?.toLocaleString() || "0",
        c.publication?.toLocaleString() || "0",
        c.khidmat_e_khalq?.toLocaleString() || "0",
        c.ansar_project?.toLocaleString() || "0",
        calculateTotal(c).toLocaleString(),
      ])

      autoTable(doc, {
        head: [
          [
            "Name as per ID Card",
            "Month",
            "Year",
            "Chanda Majlis",
            "Chanda Ijtema",
            "Tehrik-e-Jadid",
            "Waqf-e-jadid",
            "Publication",
            "Khidmat-e-khalq",
            "Ansar Project",
            "Total",
          ],
        ],
        body: tableData,
        startY: 75,
        styles: { fontSize: 6 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      })

      // Save the PDF
  doc.save("maal_report.pdf")
    }

    logoImg.crossOrigin = "anonymous"
    logoImg.src = "/ansar-logo.jpeg"
  }

  const handleDownloadExcel = () => {
    const eventSettings = localStorage.getItem("eventSettings")
    const eventName = eventSettings ? JSON.parse(eventSettings).eventName : "Ijtema 2024"

    const orgName = "Majlis Ansarullah Kenya"
    const subtitle = "maal Report"

    const headers = [
  "Name as per ID Card",
      "Registration Number",
      "Month",
      "Year",
      "Chanda Majlis",
      "Chanda Ijtema",
      "Tehrik-e-Jadid",
      "Waqf-e-jadid",
      "Publication",
      "Khidmat-e-khalq",
      "Ansar Project",
      "Total",
      "Record Created At"
    ]

  const data = filteredMaals.map((c) => [
      c.participant_name,
      (participants.find((p) => p.id === c.participant_id)?.registration_number) || "-",
      c.month,
      (c as any).year?.toString() || "N/A",
      c.chanda_majlis?.toLocaleString() || "0",
      c.chanda_ijtema?.toLocaleString() || "0",
      c.tehrik_e_jadid?.toLocaleString() || "0",
      c.waqf_e_jadid?.toLocaleString() || "0",
      c.publication?.toLocaleString() || "0",
      c.khidmat_e_khalq?.toLocaleString() || "0",
      c.ansar_project?.toLocaleString() || "0",
      calculateTotal(c).toLocaleString(),
      c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"
    ])

    const workbook = createStyledExcel(data, headers, orgName, subtitle, "Contributions")
    downloadStyledExcel("maal_report.xlsx", workbook)
  }

  const filteredMaals = maals.filter((maal) => {
    const matchesSearch =
      maal.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maal.participant_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMonth = !selectedMonth || selectedMonth === "all" || maal.month.toLowerCase() === selectedMonth
    const matchesYear = !selectedYear || selectedYear === "all" || (maal as any).year?.toString() === selectedYear
    const participant = participants.find((p) => p.id === maal.participant_id)
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

  const { paginated, page, setPage, totalPages } = usePagination(filteredMaals, 50)

  const calculateTotal = (maal: Maal) => {
    return (
      (maal.chanda_majlis || 0) +
      (maal.chanda_ijtema || 0) +
      (maal.tehrik_e_jadid || 0) +
      (maal.waqf_e_jadid || 0) +
      (maal.publication || 0) +
      (maal.khidmat_e_khalq || 0) +
      (maal.ansar_project || 0)
    )
  }

  if (loading) {
    return (
      <div>
        <MainNavigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p>Loading Maal...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div>
      <MainNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 gap-2 flex-wrap">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-foreground">Maal Management</h1>
            <p className="text-muted-foreground mt-2">Record and manage Members contributions</p>
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
            <Dialog open={showForm} onOpenChange={setShowForm} modal={false}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Record Data
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingMaal ? "Edit" : "Record"} Maal</DialogTitle>
                  <DialogDescription>Fill in the contribution details for the participant</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                        <Label htmlFor="month">Month *</Label>
                        <Select
                          value={formData.month}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, month: value }))}
                          required
                        >
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
                        <Label htmlFor="year">Year *</Label>
                        <Input
                          id="year"
                          type="number"
                          min="2000"
                          max="2100"
                          placeholder="e.g. 2025"
                          value={formData.year}
                          onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="participant">Name as per ID Card *</Label>
                      <SearchSelect
                        value={formData.participantId}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, participantId: value }))}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="chandaMajlis">Chanda Majlis (KES)</Label>
                        <Input
                          id="chandaMajlis"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.chandaMajlis}
                          onChange={(e) => setFormData((prev) => ({ ...prev, chandaMajlis: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="chandaIjtema">Chanda Ijtema (KES)</Label>
                        <Input
                          id="chandaIjtema"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.chandaIjtema}
                          onChange={(e) => setFormData((prev) => ({ ...prev, chandaIjtema: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tehrikEJadid">Tehrik-e-Jadid (KES)</Label>
                        <Input
                          id="tehrikEJadid"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.tehrikEJadid}
                          onChange={(e) => setFormData((prev) => ({ ...prev, tehrikEJadid: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="waqfEJadid">Waqf-e-jadid (KES)</Label>
                        <Input
                          id="waqfEJadid"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.waqfEJadid}
                          onChange={(e) => setFormData((prev) => ({ ...prev, waqfEJadid: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="publication">Publication (KES)</Label>
                        <Input
                          id="publication"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.publication}
                          onChange={(e) => setFormData((prev) => ({ ...prev, publication: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="khidmatEKhalq">Khidmat-e-khalq (KES)</Label>
                        <Input
                          id="khidmatEKhalq"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.khidmatEKhalq}
                          onChange={(e) => setFormData((prev) => ({ ...prev, khidmatEKhalq: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ansarProject">Ansar Project (KES)</Label>
                        <Input
                          id="ansarProject"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.ansarProject}
                          onChange={(e) => setFormData((prev) => ({ ...prev, ansarProject: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto" disabled={isSaving}>
                        {isSaving ? "Saving..." : editingMaal ? "Update" : "Save Data"}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Members</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or registration number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
                    {majlisList.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      <SelectItem key={month} value={month.toLowerCase()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="year-filter">Filter by Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {Array.from(
                      new Set(
                        maals
                          .map((m) => m.year)
                          .filter((y) => y !== null && y !== undefined),
                      ),
                    )
                      .sort((a, b) => a - b)
                      .map((year) => (
                        <SelectItem key={year.toString()} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contribution Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingMaal ? "Edit" : "Record"} Maal</CardTitle>
              <CardDescription>Fill in the contribution details for the participant</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <Label htmlFor="participant">Name as per ID Card *</Label>
            <SearchSelect
              value={formData.participantId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, participantId: value }))}
              options={filteredParticipantsByGeo.map((p) => ({
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
                  <div>
                    <Label htmlFor="month">Month *</Label>
                    <Select
                      value={formData.month}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, month: value }))}
                      required
                    >
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="chandaMajlis">Chanda Majlis (KES)</Label>
                    <Input
                      id="chandaMajlis"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.chandaMajlis}
                      onChange={(e) => setFormData((prev) => ({ ...prev, chandaMajlis: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="chandaIjtema">Chanda Ijtema (KES)</Label>
                    <Input
                      id="chandaIjtema"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.chandaIjtema}
                      onChange={(e) => setFormData((prev) => ({ ...prev, chandaIjtema: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tehrikEJadid">Tehrik-e-Jadid (KES)</Label>
                    <Input
                      id="tehrikEJadid"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.tehrikEJadid}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tehrikEJadid: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="waqfEJadid">Waqf-e-jadid (KES)</Label>
                    <Input
                      id="waqfEJadid"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.waqfEJadid}
                      onChange={(e) => setFormData((prev) => ({ ...prev, waqfEJadid: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="publication">Publication (KES)</Label>
                    <Input
                      id="publication"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.publication}
                      onChange={(e) => setFormData((prev) => ({ ...prev, publication: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="khidmatEKhalq">Khidmat-e-khalq (KES)</Label>
                    <Input
                      id="khidmatEKhalq"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.khidmatEKhalq}
                      onChange={(e) => setFormData((prev) => ({ ...prev, khidmatEKhalq: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ansarProject">Ansar Project (KES)</Label>
                    <Input
                      id="ansarProject"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.ansarProject}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ansarProject: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                    {editingMaal ? "Update" : "Save Data"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Contributions List */}
        <div className="grid gap-4">
          {paginated.map((maal) => (
            <Card key={maal.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{maal.participant_name}</h3>
                        <p className="text-sm text-muted-foreground">{maal.month} {(maal.year && `- ${maal.year}`) || ""}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto">
                        Total: KES {calculateTotal(maal).toLocaleString()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
                      {maal.chanda_majlis ? (
                        <div>
                          <p className="text-muted-foreground">Chanda Majlis</p>
                          <p className="font-medium">KES {maal.chanda_majlis.toLocaleString()}</p>
                        </div>
                      ) : null}
                      {maal.chanda_ijtema ? (
                        <div>
                          <p className="text-muted-foreground">Chanda Ijtema</p>
                          <p className="font-medium">KES {maal.chanda_ijtema.toLocaleString()}</p>
                        </div>
                      ) : null}
                      {maal.tehrik_e_jadid ? (
                        <div>
                          <p className="text-muted-foreground">Tehrik-e-Jadid</p>
                          <p className="font-medium">KES {maal.tehrik_e_jadid.toLocaleString()}</p>
                        </div>
                      ) : null}
                      {maal.waqf_e_jadid ? (
                        <div>
                          <p className="text-muted-foreground">Waqf-e-jadid</p>
                          <p className="font-medium">KES {maal.waqf_e_jadid.toLocaleString()}</p>
                        </div>
                      ) : null}
                      {maal.publication ? (
                        <div>
                          <p className="text-muted-foreground">Publication</p>
                          <p className="font-medium">KES {maal.publication.toLocaleString()}</p>
                        </div>
                      ) : null}
                      {maal.khidmat_e_khalq ? (
                        <div>
                          <p className="text-muted-foreground">Khidmat-e-khalq</p>
                          <p className="font-medium">KES {maal.khidmat_e_khalq.toLocaleString()}</p>
                        </div>
                      ) : null}
                      {maal.ansar_project ? (
                        <div>
                          <p className="text-muted-foreground">Ansar Project</p>
                          <p className="font-medium">KES {maal.ansar_project.toLocaleString()}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(maal)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(maal.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="col-span-full">
              <nav className="flex justify-center py-4">
                <Pagination aria-label="Contributions pagination">
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
            </div>
          )}

          {filteredMaals.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  {participants.length === 0
                    ? "No members registered yet. Please register members first."
                    : "No maal records found matching your criteria."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
