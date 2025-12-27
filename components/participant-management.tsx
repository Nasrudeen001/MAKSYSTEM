"use client"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

// Define the Participant type here since '@/lib/types' does not exist
export type Participant = {
  id: string;
  full_name: string;
  registration_number: string;
  islamic_names?: string;
  category: string;
  mobile_number?: string;
  region?: string;
  majlis?: string;
  baiat_type?: string;
  baiat_date?: string;
  date_of_birth?: string;
  years?: number;
  knows_prayer_full?: boolean;
  knows_prayer_meaning?: boolean;
  can_read_quran?: boolean;
  owns_bicycle?: boolean;
  status?: 'active' | 'inactive' | string;
};

type Majlis = {
  id: string
  name: string
  regionId: string
}

type Region = {
  id: string
  name: string
  majlis: Majlis[]
}

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, Search, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { downloadStyledExcel, createStyledExcel } from "@/lib/utils"
import { DownloadMenu } from "@/components/download-menu"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination"
import { usePagination } from "@/lib/hooks/usePagination"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { RegistrationForm } from "@/components/registration-form"
import { Plus } from "lucide-react"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
export function ParticipantManagement() {
  const { toast } = useToast()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  // Use "all" as the default value for filters instead of ""
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [majlisFilter, setMajlisFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editFormData, setEditFormData] = useState<Partial<Participant>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [regions, setRegions] = useState<Region[]>([])
  const [availableMajlis, setAvailableMajlis] = useState<Majlis[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [midnightTick, setMidnightTick] = useState(0)

    // IMPORTANT: For Select components, only use value="" for the "All" option in filters.
    // Never use <Select.Item value=""> for placeholders. Use <SelectValue placeholder="..." /> for placeholders.
    // The default state (no filter) is when the Select value is "" (shows "All").


  useEffect(() => {
    fetchParticipants()

    // Listen for participantAdded event to refresh participants
    const handleParticipantAdded = () => {
      fetchParticipants()
      toast({
        title: "Success",
        description: "Member added successfully",
      })
    }
    window.addEventListener("participantAdded", handleParticipantAdded)
    return () => {
      window.removeEventListener("participantAdded", handleParticipantAdded)
    }
  }, [])

  useEffect(() => {
    filterParticipants()
  }, [participants, searchTerm, categoryFilter, regionFilter, majlisFilter, statusFilter, midnightTick])

  // Lightweight daily re-render at midnight so derived age/category and Nau-Mobaeen update automatically
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
      // Store interval id on window to allow cleanup below scope
      ;(window as any).__tajneedDailyInterval = dailyInterval
    }, msUntilMidnight)

    return () => {
      clearTimeout(midnightTimeout)
      if ((window as any).__tajneedDailyInterval) clearInterval((window as any).__tajneedDailyInterval)
    }
  }, [])

  // Fetch Regions for dropdowns (used in Edit dialog)
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch("/api/regions")
        if (response.ok) {
          const data = await response.json()
          setRegions(data)
        } else {
          // Fallback to a minimal set if API not available
          const initialRegions: Region[] = [
            { id: "1", name: "Nairobi", majlis: [
              { id: "1", name: "Nairobi Central", regionId: "1" },
              { id: "2", name: "Nairobi East", regionId: "1" },
              { id: "3", name: "Nairobi West", regionId: "1" },
              { id: "4", name: "Nairobi South", regionId: "1" },
            ]},
          ]
          setRegions(initialRegions)
        }
      } catch (err) {
        // Silently ignore; edit dialog will still work with text values
      }
    }
    fetchRegions()
  }, [])

  // Keep majlis options in sync with selected region for edit form
  useEffect(() => {
    if (!editFormData.region) {
      setAvailableMajlis([])
      return
    }
    const selectedRegion = regions.find(r => r.name === editFormData.region)
    setAvailableMajlis(selectedRegion?.majlis || [])
    // If current majlis is not in the available list, clear it
    if (
      editFormData.majlis &&
      !(selectedRegion?.majlis || []).some(m => m.name === editFormData.majlis)
    ) {
      setEditFormData(prev => ({ ...prev, majlis: "" }))
    }
  }, [editFormData.region, regions])

  const calculateAge = (dateOfBirth?: string): number | undefined => {
    if (!dateOfBirth) return undefined
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age
  }

  const calculateCategory = (dateOfBirth?: string): string | undefined => {
    const age = calculateAge(dateOfBirth)
    if (age === undefined) return undefined
    if (age > 55) return "Saf Awwal"
    if (age >= 40 && age <= 55) return "Saf Dom"
    return "General"
  }

  const fetchParticipants = async () => {
    try {
      const response = await fetch("/api/participants")
      if (response.ok) {
        const data = await response.json()
        // Deduplicate returned participants by `id` to avoid duplicate UI rows
        const arr = data || []
        const map = new Map<string, Participant>()
        for (const p of arr) {
          if (!p || !p.id) continue
          if (!map.has(p.id)) map.set(p.id, p)
        }
        setParticipants(Array.from(map.values()))
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch participants",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching participants:", error)
      toast({
        title: "Error",
        description: "Failed to fetch participants",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterParticipants = () => {
    const deriveCategory = (dob?: string, stored?: string) => {
      const computed = calculateCategory(dob)
      return computed || stored || ""
    }
    let filtered = [...participants]

    if (searchTerm) {
      filtered = filtered.filter(
        (participant) =>
          participant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          participant.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          participant.islamic_names?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deriveCategory(participant.date_of_birth, participant.category).toLowerCase().includes(searchTerm.toLowerCase()) ||
          participant.mobile_number?.includes(searchTerm) ||
          participant.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          participant.majlis?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((participant) => deriveCategory(participant.date_of_birth, participant.category) === categoryFilter)
    }
    if (regionFilter !== "all") {
      filtered = filtered.filter((participant) => participant.region === regionFilter)
    }
    if (majlisFilter !== "all") {
      filtered = filtered.filter((participant) => participant.majlis === majlisFilter)
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((participant) => (participant.status || "").toLowerCase() === statusFilter.toLowerCase())
    }

    setFilteredParticipants(filtered)
  }

  const handleView = (participant: Participant) => {
    setSelectedParticipant(participant)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (participant: Participant) => {
    setSelectedParticipant(participant)
    setEditFormData(participant)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (participantId: string) => {
    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setParticipants(participants.filter((p) => p.id !== participantId))
      } else {
        toast({
          title: "Error",
          description: "Failed to delete participant",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting participant:", error)
      toast({
        title: "Error",
        description: "Failed to delete participant",
        variant: "destructive",
      })
    }
  }

  const handleUpdateParticipant = async () => {
    if (!selectedParticipant) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/participants/${selectedParticipant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: editFormData.full_name,
          islamicNames: editFormData.islamic_names,
          dateOfBirth: editFormData.date_of_birth,
          years: editFormData.years?.toString(),
          category: editFormData.category,
          mobileNumber: editFormData.mobile_number,
          region: editFormData.region,
          majlis: editFormData.majlis,
          baiatType: editFormData.baiat_type,
          baiatDate: editFormData.baiat_date,
          knowsPrayerFull: editFormData.knows_prayer_full?.toString(),
          knowsPrayerMeaning: editFormData.knows_prayer_meaning?.toString(),
          canReadQuran: editFormData.can_read_quran?.toString(),
          ownsBicycle: editFormData.owns_bicycle?.toString(),
          status: editFormData.status,
        }),
      })

      if (response.ok) {
        const updatedParticipant = await response.json()
        setParticipants(participants.map(p => p.id === selectedParticipant.id ? updatedParticipant.participant : p))
        setIsEditDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to update participant",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating participant:", error)
      toast({
        title: "Error",
        description: "Failed to update participant",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()

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
      const docType = "Tajneed Report"
      const docTypeWidth = doc.getTextWidth(docType)
      const docTypeX = (pageWidth - docTypeWidth) / 2
      doc.text(docType, docTypeX, 50)

      // Add generation date and stats
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 65)
      doc.text(`Total Members: ${filteredParticipants.length}`, 20, 70)

      // Prepare table data
      const tableData = filteredParticipants.map((participant, index) => [
        String(index + 1),
        participant.full_name,
        participant.registration_number,
        participant.islamic_names || "-",
        (participant.status || "-").toString(),
        participant.baiat_type || "-",
        participant.category,
        participant.mobile_number || "-",
        participant.region || "-",
        participant.majlis || "-",
      ])

      autoTable(doc, {
        head: [["S/N", "Full Name", "Reg No", "Islamic Name", "Status", "Baiat", "Category", "Mobile", "Region", "Majlis"]],
        body: tableData,
        startY: 85,
        styles: { fontSize: 6 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      })

      // Save the PDF
      doc.save("Tajneed_report.pdf")
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
      const docType = "Tajneed Report"
      const docTypeWidth = doc.getTextWidth(docType)
      const docTypeX = (pageWidth - docTypeWidth) / 2
      doc.text(docType, docTypeX, 40)

      // Add generation date and stats
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 55)
      doc.text(`Total Members: ${filteredParticipants.length}`, 20, 60)

      // Prepare table data
      const tableData = filteredParticipants.map((participant, index) => [
        String(index + 1),
        participant.full_name,
        participant.registration_number,
        participant.islamic_names || "-",
        (participant.status || "-").toString(),
        participant.baiat_type || "-",
        participant.category,
        participant.mobile_number || "-",
        participant.region || "-",
        participant.majlis || "-",
      ])

      autoTable(doc, {
        head: [["S/N", "Full Name", "Reg No", "Islamic Name", "Status", "Baiat", "Category", "Mobile", "Region", "Majlis"]],
        body: tableData,
        startY: 75,
        styles: { fontSize: 6 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      })

      // Save the PDF
      doc.save("Tajneed_report.pdf")
    }

    // Set the logo source
    logoImg.src = "/ansar-logo.jpeg"
  }

  const handleDownloadExcel = () => {
    const orgName = "Majlis Ansarullah Kenya"
    const subtitle = "Tajneed Report"

    // Only include required fields for each member
    const headers = [
      "S/N",
      "Full Name",
      "Registration Number",
      "Islamic Name",
      "Status",
      "Category",
      "Mobile Number",
      "Region",
      "Majlis",
      "Baiat Type",
      "Baiat Date",
      "Nau-Mobaeen",
      "Date of Birth",
      "Age",
      "Knows Prayer Full",
      "Knows Prayer Meaning",
      "Can Read Quran",
      "Owns Bicycle"
    ];

    const data = filteredParticipants.map((participant, index) => {
      // Determine Nau-Mobaeen status: Baiat date within last 3 years
      let nauMobaeen = "No";
      if (participant.baiat_date) {
        const baiatDateObj = new Date(participant.baiat_date);
        const currentDate = new Date();
        const yearsDifference = (currentDate.getTime() - baiatDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (yearsDifference < 3) nauMobaeen = "Yes";
      }
      return [
        String(index + 1),
        participant.full_name,
        participant.registration_number,
        participant.islamic_names || "-",
        (participant.status || "-").toString(),
        participant.category,
        participant.mobile_number || "-",
        participant.region || "-",
        participant.majlis || "-",
        participant.baiat_type || "-",
        participant.baiat_date || "-",
        nauMobaeen,
        participant.date_of_birth || "-",
        participant.years !== undefined ? participant.years : "-",
        participant.knows_prayer_full ? "Yes" : "No",
        participant.knows_prayer_meaning ? "Yes" : "No",
        participant.can_read_quran ? "Yes" : "No",
        participant.owns_bicycle ? "Yes" : "No"
      ];
    });

    const workbook = createStyledExcel(data, headers, orgName, subtitle, "Tajneed")
    downloadStyledExcel("Tajneed_report.xlsx", workbook)
  }

  const getCategoryDisplay = (participant: Participant) => {
    const category = calculateCategory(participant.date_of_birth) || participant.category
    const baiatDate = participant.baiat_date
    
    if (!baiatDate) {
      return category
    }

    const baiatDateObj = new Date(baiatDate)
    const currentDate = new Date()
    const yearsDifference = (currentDate.getTime() - baiatDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365)

    if (yearsDifference < 3) {
      return (
        <div>
          <div>{category}</div>
          <div className="text-xs text-muted-foreground">Nau-Mobaeen</div>
        </div>
      )
    }

    return category
  }

  const getMemberDisplay = (participant: Participant) => {
    return (
      <div>
        <div className="font-medium">{participant.full_name}</div>
        <div className="text-xs text-muted-foreground">{participant.registration_number}</div>
      </div>
    )
  }


  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [addedMember, setAddedMember] = useState<any>(null);

  useEffect(() => {
    // Listen for participantAdded event to show success message
    const handleParticipantAdded = (e: any) => {
      fetchParticipants();
      toast({
        title: "Success",
        description: "Member added successfully",
      });
      setShowAddSuccess(true);
      setAddedMember(e?.detail || null);
    };
    window.addEventListener("participantAdded", handleParticipantAdded);
    return () => {
      window.removeEventListener("participantAdded", handleParticipantAdded);
    };
    // eslint-disable-next-line
  }, []);

  // Pagination for filtered participants (50 per page)
  const { paginated, page, setPage, totalPages } = usePagination(filteredParticipants, 50)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading Tajneed...</div>
      </div>
    );
  }

  if (showAddSuccess) {
    return (
      <div className="text-center py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex flex-col items-center justify-center">
              <svg className="w-16 h-16 text-primary mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4 -4" /><circle cx="12" cy="12" r="10" /></svg>
              <h3 className="text-2xl font-bold text-foreground mb-2">Addition Complete!</h3>
              <p className="text-muted-foreground mb-4">Thank you for adding a member.</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-left">
              <div><strong>Registration Number Assigned:</strong> {addedMember?.registrationNumber}</div>
              <div><strong>Name as per ID Card:</strong> {addedMember?.fullName}</div>
              <div><strong>Date of Birth:</strong> {addedMember?.dateOfBirth}</div>
              <div><strong>Mobile Number:</strong> {addedMember?.mobileNumber}</div>
              <div><strong>Region:</strong> {addedMember?.region}</div>
              <div><strong>Majlis:</strong> {addedMember?.majlis}</div>
            </div>
            <div className="mt-6 space-x-4 flex justify-center">
              <a href="/dashboard">
                <Button>Back to Dashboard</Button>
              </a>
              <Button variant="outline" onClick={() => { setShowAddSuccess(false); setAddedMember(null); }}>
                Add Another Member
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tajneed Section Refactored
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="w-full flex items-start justify-between">
            <div>
              <CardTitle>Tajneed</CardTitle>
              <CardDescription>Manage all Members</CardDescription>
            </div>
            <div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Member</DialogTitle>
                    <DialogDescription>Register a new Tajneed member</DialogDescription>
                  </DialogHeader>
                  <RegistrationForm />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div className="flex flex-col md:flex-row gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search Members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="min-w-[120px]">
                  {/* Placeholder is shown when value is "all" (All) */}
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {/* Use value="all" for the "All" option */}
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Saf Awwal">Saf Awwal</SelectItem>
                  <SelectItem value="Saf Dom">Saf Dom</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="min-w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {[...new Set(participants.map(p => (p.status || "").toString()).filter(s => s && s.trim() !== ""))]
                    .map(status => (
                      <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="min-w-[120px]">
                  {/* Placeholder is shown when value is "all" (All) */}
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  {/* Use value="all" for the "All" option */}
                  <SelectItem value="all">All Regions</SelectItem>
                  {[...new Set(participants.map(p => p.region))]
                    .filter(region => typeof region === "string" && region !== undefined && region.trim() !== "")
                    .map(region => (
                      <SelectItem key={region as string} value={region as string}>{region as string}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={majlisFilter} onValueChange={setMajlisFilter}>
                <SelectTrigger className="min-w-[120px]">
                  {/* Placeholder is shown when value is "all" (All) */}
                  <SelectValue placeholder="Majlis" />
                </SelectTrigger>
                <SelectContent>
                  {/* Use value="all" for the "All" option */}
                  <SelectItem value="all">All Majlis</SelectItem>
                  {[...new Set(participants.map(p => p.majlis))]
                    .filter(majlis => typeof majlis === "string" && majlis !== undefined && majlis.trim() !== "")
                    .map(majlis => (
                      <SelectItem key={majlis as string} value={majlis as string}>{majlis as string}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button variant="outline" onClick={handleDownloadPDF} disabled={filteredParticipants.length === 0} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button variant="outline" onClick={handleDownloadExcel} disabled={filteredParticipants.length === 0} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" /> Excel
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table className="stacked-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Islamic Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Baiat</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Majlis</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.length > 0 ? (
                  <>
                    {paginated.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell data-label="Member">{getMemberDisplay(participant)}</TableCell>
                        <TableCell data-label="Islamic Name">{participant.islamic_names || "-"}</TableCell>
                        <TableCell data-label="Status">
                          {participant.status ? (
                            <Badge variant={participant.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                              {participant.status}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell data-label="Baiat">{participant.baiat_type || "-"}</TableCell>
                        <TableCell data-label="Category">{getCategoryDisplay(participant)}</TableCell>
                        <TableCell data-label="Mobile">{participant.mobile_number || "-"}</TableCell>
                        <TableCell data-label="Region">{participant.region || "-"}</TableCell>
                        <TableCell data-label="Majlis">{participant.majlis || "-"}</TableCell>
                        <TableCell data-label="Actions" className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleView(participant)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(participant)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the participant "{participant.full_name}" from the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(participant.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
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
                        <TableCell colSpan={9} className="px-4 py-3">
                          <nav className="flex justify-center">
                            <Pagination aria-label="Participants pagination">
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
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {participants.length === 0
                        ? "No participants registered yet."
                        : "No participants found matching your search or filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Participant Details</DialogTitle>
            <DialogDescription>
              View detailed information about {selectedParticipant?.full_name}
            </DialogDescription>
            {selectedParticipant && (
              <div className="mt-2">
                <Badge
                  variant={selectedParticipant.status === 'active' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {selectedParticipant.status || 'not set'}
                </Badge>
              </div>
            )}
          </DialogHeader>
          {selectedParticipant && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                  <p className="text-lg font-semibold">{selectedParticipant.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Registration Number</Label>
                  <p className="text-lg font-semibold">{selectedParticipant.registration_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Islamic Name</Label>
                  <p className="text-lg font-semibold">{selectedParticipant.islamic_names || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <p className="text-lg font-semibold">{getCategoryDisplay(selectedParticipant)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Mobile Number</Label>
                  <p className="text-lg font-semibold">{selectedParticipant.mobile_number || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Region</Label>
                  <p className="text-lg font-semibold">{selectedParticipant.region || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Majlis</Label>
                  <p className="text-lg font-semibold">{selectedParticipant.majlis || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <p className="text-lg font-semibold capitalize">{selectedParticipant.status || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Baiat Type</Label>
                  <p className="text-lg font-semibold">{selectedParticipant.baiat_type || "-"}</p>
                </div>
                {selectedParticipant.baiat_date && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Baiat Date</Label>
                    <p className="text-lg font-semibold">
                      {new Date(selectedParticipant.baiat_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedParticipant.date_of_birth && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                    <p className="text-lg font-semibold">
                      {new Date(selectedParticipant.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedParticipant.years && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                    <p className="text-lg font-semibold">{selectedParticipant.years} years</p>
                  </div>
                )}
              </div>

              {/* Key Questions Section */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Key Questions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Knows Prayer Full</Label>
                    <p className="text-lg font-semibold">
                      {selectedParticipant.knows_prayer_full ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Knows Prayer Meaning</Label>
                    <p className="text-lg font-semibold">
                      {selectedParticipant.knows_prayer_meaning ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Can Read Quran</Label>
                    <p className="text-lg font-semibold">
                      {selectedParticipant.can_read_quran ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Owns Bicycle</Label>
                    <p className="text-lg font-semibold">
                      {selectedParticipant.owns_bicycle ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Participant</DialogTitle>
            <DialogDescription>
              Update information for {selectedParticipant?.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedParticipant && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-full-name">Full Name</Label>
                    <Input
                      id="edit-full-name"
                      value={editFormData.full_name || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-islamic-names">Islamic Name</Label>
                    <Input
                      id="edit-islamic-names"
                      value={editFormData.islamic_names || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, islamic_names: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-date-of-birth">Date of Birth</Label>
                    <Input
                      id="edit-date-of-birth"
                      type="date"
                      value={editFormData.date_of_birth || ""}
                      onChange={(e) => {
                        const nextDob = e.target.value
                        const nextYears = calculateAge(nextDob)
                        const nextCategory = calculateCategory(nextDob)
                        setEditFormData({
                          ...editFormData,
                          date_of_birth: nextDob,
                          years: nextYears,
                          category: nextCategory,
                        })
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-years">Age</Label>
                    <Input
                      id="edit-years"
                      type="text"
                      value={editFormData.years ?? ""}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-category">Category</Label>
                    <Input
                      id="edit-category"
                      value={editFormData.category || ""}
                      readOnly
                      className="bg-muted"
                      placeholder="Auto-calculated from date of birth"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-mobile">Mobile Number</Label>
                    <Input
                      id="edit-mobile"
                      value={editFormData.mobile_number || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, mobile_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editFormData.status || ""}
                      onValueChange={(value) => setEditFormData({ ...editFormData, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-region">Region</Label>
                    <Select
                      value={editFormData.region || ""}
                      onValueChange={(value) => setEditFormData({ ...editFormData, region: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-majlis">Majlis</Label>
                    <Select
                      value={editFormData.majlis || ""}
                      onValueChange={(value) => setEditFormData({ ...editFormData, majlis: value })}
                      disabled={!editFormData.region}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={editFormData.region ? "Select majlis" : "Select region first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMajlis.map((m) => (
                          <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Baiat Information */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Baiat Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-baiat-type">Baiat Type</Label>
                    <Select
                      value={editFormData.baiat_type || ""}
                      onValueChange={(value) => setEditFormData({ ...editFormData, baiat_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select baiat type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="By birth">By birth</SelectItem>
                        <SelectItem value="By Baiat">By Baiat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editFormData.baiat_type === "By Baiat" && (
                  <div>
                    <Label htmlFor="edit-baiat-date">Baiat Date</Label>
                    <Input
                      id="edit-baiat-date"
                      type="date"
                      value={editFormData.baiat_date || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, baiat_date: e.target.value })}
                    />
                  </div>
                  )}
                </div>
              </div>

              {/* Key Questions */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Key Questions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-knows-prayer-full"
                      checked={editFormData.knows_prayer_full || false}
                      onCheckedChange={(checked) => setEditFormData({ ...editFormData, knows_prayer_full: !!checked })}
                    />
                    <Label htmlFor="edit-knows-prayer-full">Knows Prayer Full</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-knows-prayer-meaning"
                      checked={editFormData.knows_prayer_meaning || false}
                      onCheckedChange={(checked) => setEditFormData({ ...editFormData, knows_prayer_meaning: !!checked })}
                    />
                    <Label htmlFor="edit-knows-prayer-meaning">Knows Prayer Meaning</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-can-read-quran"
                      checked={editFormData.can_read_quran || false}
                      onCheckedChange={(checked) => setEditFormData({ ...editFormData, can_read_quran: !!checked })}
                    />
                    <Label htmlFor="edit-can-read-quran">Can Read Quran</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-owns-bicycle"
                      checked={editFormData.owns_bicycle || false}
                      onCheckedChange={(checked) => setEditFormData({ ...editFormData, owns_bicycle: !!checked })}
                    />
                    <Label htmlFor="edit-owns-bicycle">Owns Bicycle</Label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateParticipant} disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Participant"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
