"use client"

import { useState, useEffect } from "react"

/**
 * AddMemberButton component
 * @param {object} props
 * @param {string} props.eventId
 * @param {string} props.memberId
 * @param {(eventId: string, memberId: string) => Promise<void>} props.addMemberToEvent
 */
function AddMemberButton(props: { eventId: string, memberId: string, addMemberToEvent: (eventId: string, memberId: string) => Promise<void> }) {
  const { eventId, memberId, addMemberToEvent } = props;
  const [loading, setLoading] = useState(false);
  const handleAdd = async () => {
    setLoading(true);
    await addMemberToEvent(eventId, memberId);
    setLoading(false);
  };
  return (
    <button
      className="bg-secondary text-sm px-3 py-1 rounded disabled:opacity-50"
      disabled={loading}
      onClick={handleAdd}
    >
      {loading ? "Adding..." : "Add"}
    </button>
  );
}
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Save, SettingsIcon, Edit, Trash2, Plus, Download, Users } from "lucide-react"
import { downloadStyledExcel, createStyledExcel } from "@/lib/utils"
import { DownloadMenu } from "@/components/download-menu"
import { useToast } from "@/hooks/use-toast"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DialogTrigger } from "@/components/ui/dialog"

interface EventSettings {
  eventStartDate: string
  eventName: string
  eventLocation: string
  totalDays: number
  createdAt: string
}

interface AttendeeRow {
  participant_id: string
  participants?: {
    full_name: string
    registration_number: string
    islamic_names?: string
    category?: string
    mobile_number?: string
    region?: string
    majlis?: string
  }
}

export default function SettingsPage() {
  // Add Member dialog search/filter state (must be at top level)
  const [addMemberSearchTerm, setAddMemberSearchTerm] = useState("");
  const [addMemberRegion, setAddMemberRegion] = useState("__all__");
  const [addMemberMajlis, setAddMemberMajlis] = useState("__all__");
  // Tajneed members state and fetch
  const [tajneedMembers, setTajneedMembers] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/participants')
      .then((res) => res.json())
      .then((data) => setTajneedMembers(data || []))
  }, [])

  // Filtered Tajneed members for Add Member dialog
  const filteredTajneedMembers = tajneedMembers.filter((m: any) =>
    (!addMemberSearchTerm || m.full_name?.toLowerCase().includes(addMemberSearchTerm.toLowerCase())) &&
    (addMemberRegion === "__all__" || m.region === addMemberRegion) &&
    (addMemberMajlis === "__all__" || m.majlis === addMemberMajlis)
  );
  // Core event and attendee state
  const [eventStartDate, setEventStartDate] = useState("2024-03-15")
  const [eventName, setEventName] = useState("Ijtema 2024")
  const [eventLocation, setEventLocation] = useState("Nairobi, Kenya")
  const [totalDays, setTotalDays] = useState("3")
  const [existingEvent, setExistingEvent] = useState<EventSettings | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  // Store attendees per event
  const [attendeesByEvent, setAttendeesByEvent] = useState<{ [eventId: string]: AttendeeRow[] }>({})
  const [events, setEvents] = useState<{
    id: string
    event_name: string
    event_location?: string
    event_start_date?: string
    total_days?: number
    is_active?: boolean
    created_at?: string
  }[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [editEventId, setEditEventId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newEventName, setNewEventName] = useState("")
  const [newEventLocation, setNewEventLocation] = useState("")
  const [newEventStartDate, setNewEventStartDate] = useState("")
  const [newEventTotalDays, setNewEventTotalDays] = useState("1")
  const [editOpen, setEditOpen] = useState(false)
  const [editEventData, setEditEventData] = useState<{ id: string; event_name: string; event_location: string; event_start_date: string; total_days: number } | null>(null)

  // ...existing code...


  // Add member to event function
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const addMemberToEvent = async (eventId: string, participantId: string) => {
    const res = await fetch('/api/event-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, participantId })
    })
    // Optionally refresh attendees list after adding
    let registrationNumber = "";
    let memberName = "";
    // Always update attendees for the event
    const attRes = await fetch(`/api/event-attendance?eventId=${eventId}`)
    if (attRes.ok) {
      const json = await attRes.json()
      setAttendeesByEvent(prev => ({ ...prev, [eventId]: json.attendees || [] }))
      // Find the added member in attendees to get registration number
      const added = (json.attendees || []).find((row: any) => row.participant_id === participantId);
      if (added && added.participants) {
        registrationNumber = added.participants.registration_number || ""
        memberName = added.participants.full_name || ""
      }
    }
    if (res.ok) {
      setAddMemberDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to add member.",
        variant: "destructive"
      });
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        // Load active event from API (Supabase)
        const res = await fetch("/api/event-settings")
        if (res.ok) {
          const json = await res.json()
          if (json.event) {
            const ev = json.event
            const settings: EventSettings = {
              eventStartDate: ev.event_start_date,
              eventName: ev.event_name,
              eventLocation: ev.event_location,
              totalDays: ev.total_days,
              createdAt: ev.created_at,
            }
            setExistingEvent(settings)
            setEventStartDate(settings.eventStartDate)
            setEventName(settings.eventName)
            setEventLocation(settings.eventLocation)
            setTotalDays(settings.totalDays.toString())
          }
        }

        // Load events list
        const evRes = await fetch("/api/events")
        if (evRes.ok) {
          const json = await evRes.json()
          const list = (json.events || []) as { id: string; event_name: string; is_active?: boolean }[]
          setEvents(list)
          const active = list.find((e) => e.is_active)
          if (active) setSelectedEventId(active.id)
          else if (list.length > 0) setSelectedEventId(list[0].id)

          // Load present attendees for all events
          if (list.length > 0) {
            const attendeesMap: { [eventId: string]: AttendeeRow[] } = {};
            await Promise.all(list.map(async (ev: { id: string }) => {
              const attRes = await fetch(`/api/event-attendance?eventId=${ev.id}`);
              if (attRes.ok) {
                const json = await attRes.json();
                attendeesMap[ev.id] = json.attendees || [];
              } else {
                attendeesMap[ev.id] = [];
              }
            }));
            setAttendeesByEvent(attendeesMap);
          }
        }
      } catch (e) {
        console.error("Failed to load event data", e)
      }
    }
    load()
  }, [])

  // Listen for attendance updates and refresh attendees list
  useEffect(() => {
    const refresh = async (eventId?: string | null) => {
      try {
        const id = eventId ?? selectedEventId
        const attRes = await fetch(`/api/event-attendance${id ? `?eventId=${id}` : ""}`)
        if (attRes.ok) {
          const json = await attRes.json()
          setAttendeesByEvent(prev => ({ ...prev, [(id ?? "")]: json.attendees || [] }))
        }
      } catch (e) {
        console.error("Failed to refresh attendance", e)
      }
    }
    const handler = (e: any) => refresh(e?.detail?.eventId)
    window.addEventListener("attendanceUpdated", handler)
    return () => window.removeEventListener("attendanceUpdated", handler)
  }, [selectedEventId])

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) {
      return num + "st"
    }
    if (j === 2 && k !== 12) {
      return num + "nd"
    }
    if (j === 3 && k !== 13) {
      return num + "rd"
    }
    return num + "th"
  }

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/event-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventStartDate,
          eventName,
          eventLocation,
          totalDays,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        const ev = json.event
        const settings: EventSettings = {
          eventStartDate: ev.event_start_date,
          eventName: ev.event_name,
          eventLocation: ev.event_location,
          totalDays: ev.total_days,
          createdAt: ev.created_at,
        }
        setExistingEvent(settings)
        setIsEditing(false)
      } else {
        toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
      }
    } catch (e) {
      console.error("Failed to save settings", e)
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    }
  }

  const downloadAttendeesPdf = async () => {
    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default
    const doc = new jsPDF({ orientation: "landscape" })

    const title = existingEvent?.eventName || "Event"
    doc.setFontSize(18)
    try { doc.setFont("Algerian", "bold") } catch (_) { doc.setFont("helvetica", "bold") }
    const orgName = "Majlis Ansarullah Kenya"
    const pageWidth = doc.internal.pageSize.getWidth()
    const orgWidth = doc.getTextWidth(orgName)
    const orgX = (pageWidth - orgWidth) / 2
    doc.text(orgName, orgX, 20)
    doc.setFontSize(12)
    try { doc.setFont("helvetica", "normal") } catch (_) {}
    const sub = `${title} - Present Members`
    const subWidth = doc.getTextWidth(sub)
    const subX = (pageWidth - subWidth) / 2
    doc.text(sub, subX, 28)
    doc.setFontSize(10)
    const attendees = attendeesByEvent[selectedEventId ?? ""] || [];
    doc.text(`Total Present: ${attendees.length}`, 20, 35)

    const rows = attendees.map((row: AttendeeRow) => [
      row.participants?.registration_number || "",
      row.participants?.full_name || "",
      row.participants?.region || "",
      row.participants?.majlis || "",
    ])

    autoTable(doc, {
      head: [["Reg #", "Name", "Region", "Majlis"]],
      body: rows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    })

    doc.save(`${title.replace(/\s+/g, "_")}_attendees.pdf`)
  }

  const downloadAttendeesExcel = async () => {
    const title = existingEvent?.eventName || "Event"
    const orgName = "Majlis Ansarullah Kenya"
    const subtitle = `${title} - Present Members`
    
    const headers = ["Reg #", "Name", "Region", "Majlis"]
    const attendees = attendeesByEvent[selectedEventId ?? ""] || [];
    const data = attendees.map((row: AttendeeRow) => [
      row.participants?.registration_number || "",
      row.participants?.full_name || "",
      row.participants?.region || "",
      row.participants?.majlis || "",
    ])
    
    const workbook = createStyledExcel(data, headers, orgName, subtitle, "Attendees")
    downloadStyledExcel(`${title.replace(/\s+/g, "_")}_attendees.xlsx`, workbook)
  }

  const downloadEventAttendeesPdf = async (eventId: string, eventName: string) => {
    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default
    const doc = new jsPDF({ orientation: "landscape" })

    // Fetch attendees for the specific event
    let attendeesRows: AttendeeRow[] = []
    try {
      const attRes = await fetch(`/api/event-attendance?eventId=${eventId}`)
      if (attRes.ok) {
        const json = await attRes.json()
        attendeesRows = (json.attendees || []) as AttendeeRow[]
      }
    } catch (_) {}

    // Load and draw logo centered at top
    const logoImg = new Image()
    const logoLoaded: Promise<void> = new Promise((resolve) => {
      logoImg.onload = () => {
        const logoSize = 20
        const pageWidth = doc.internal.pageSize.getWidth()
        const logoX = (pageWidth - logoSize) / 2
        doc.addImage(logoImg, "JPEG", logoX, 10, logoSize, logoSize)
        resolve()
      }
      logoImg.onerror = () => resolve()
    })
    logoImg.crossOrigin = "anonymous"
    logoImg.src = "/ansar-logo.jpeg"
    await logoLoaded

    const title = eventName || "Event"
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(18)
    try { doc.setFont("Algerian", "bold") } catch (_) { doc.setFont("helvetica", "bold") }
    const orgName = "Majlis Ansarullah Kenya"
    const orgWidth = doc.getTextWidth(orgName)
    const orgX = (pageWidth - orgWidth) / 2
    doc.text(orgName, orgX, 40)
    doc.setFontSize(12)
    try { doc.setFont("helvetica", "normal") } catch (_) {}
    const sub = `${title} - Present Members`
    const subWidth = doc.getTextWidth(sub)
    const subX = (pageWidth - subWidth) / 2
    doc.text(sub, subX, 48)
    doc.setFontSize(10)
    doc.text(`Total Present: ${attendeesRows.length}`, 20, 58)

    // Build rows with specified columns: S/N, Full Name, Islamic Name, Category, Mobile, Region, Majlis
    const bodyRows = attendeesRows.map((row, idx) => [
      String(idx + 1),
      row.participants?.full_name || "",
      (row.participants as any)?.islamic_names || "",
      (row.participants as any)?.category || "",
      (row.participants as any)?.mobile_number || "",
      (row.participants as any)?.region || "",
      (row.participants as any)?.majlis || "",
    ])

    autoTable(doc, {
      head: [["S/N", "Full Name", "Islamic Name", "Category", "Mobile", "Region", "Majlis"]],
      body: bodyRows,
      startY: 65,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    })

    doc.save(`${title.replace(/\s+/g, "_")}_attendees.pdf`)
  }

  const downloadEventAttendeesExcel = async (eventId: string, eventName: string) => {
    // Fetch attendees for the specific event
    let attendeesRows: AttendeeRow[] = []
    try {
      const attRes = await fetch(`/api/event-attendance?eventId=${eventId}`)
      if (attRes.ok) {
        const json = await attRes.json()
        attendeesRows = (json.attendees || []) as AttendeeRow[]
      }
    } catch (_) {}

    const title = eventName || "Event"
    const orgName = "Majlis Ansarullah Kenya"
    const subtitle = `${title} - Present Members`
    
    const headers = ["S/N", "Full Name", "Islamic Name", "Category", "Mobile", "Region", "Majlis"]
    const data = attendeesRows.map((row, idx) => [
      String(idx + 1),
      row.participants?.full_name || "",
      (row.participants as any)?.islamic_names || "",
      (row.participants as any)?.category || "",
      (row.participants as any)?.mobile_number || "",
      (row.participants as any)?.region || "",
      (row.participants as any)?.majlis || "",
    ])
    
    const workbook = createStyledExcel(data, headers, orgName, subtitle, "Event Attendees")
    downloadStyledExcel(`${title.replace(/\s+/g, "_")}_attendees.xlsx`, workbook)
  }

  const handleDeleteEvent = () => {
    localStorage.removeItem("eventSettings")
    setExistingEvent(null)
    setIsEditing(false)

    // Reset form to defaults
    setEventStartDate("2024-03-15")
    setEventName("Ijtema 2024")
    setEventLocation("Nairobi, Kenya")
    setTotalDays("3")

    window.dispatchEvent(new CustomEvent("eventSettingsUpdated", { detail: null }))

    
  }

  const handleEditEvent = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (existingEvent) {
      setEventStartDate(existingEvent.eventStartDate)
      setEventName(existingEvent.eventName)
      setEventLocation(existingEvent.eventLocation)
      setTotalDays(existingEvent.totalDays.toString())
    }
    setIsEditing(false)
  }

  const getCurrentDay = () => {
    const startDate = new Date(eventStartDate)
    const currentDate = new Date()
    const diffTime = currentDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 1) return "Event not started"
    if (diffDays > Number.parseInt(totalDays)) return "Event completed"
    return `${getOrdinalSuffix(diffDays)} day of ${totalDays}`
  }

  return (
    <div>
      <MainNavigation />

      <main className="container mx-auto px-4 py-2">
        <div className="mb-8 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-foreground mb-2">Event Settings</h1>
          <p className="text-muted-foreground">Configure event details and ordinal dates</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Create Event
          </Button>
        </div>

        {/* Removed top Event Configuration and Event Status sections */}

        {/* All Events (stacked) */}
        <div className="space-y-6 mt-6">
          {events.map((ev) => (
            <Card key={ev.id} className="border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <SettingsIcon className="w-5 h-5" />
                    <span>{ev.event_name}</span>
                </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditEventData({
                          id: ev.id,
                          event_name: ev.event_name,
                          event_location: (ev as any).event_location || "",
                          event_start_date: ((ev as any).event_start_date || "").slice(0, 10),
                          total_days: (ev as any).total_days || 1,
                        })
                        setEditOpen(true)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Delete event "${ev.event_name}"?`)) return
                        const res = await fetch(`/api/events/${ev.id}`, { method: "DELETE" })
                        if (res.ok) {
                          const r = await fetch("/api/events")
                          if (r.ok) {
                            const j = await r.json()
                            setEvents(j.events || [])
                            if (selectedEventId === ev.id) setSelectedEventId(null)
                          }
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Event details (left) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Event Name:</span>
                      <span className="text-sm text-muted-foreground">{ev.event_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Location:</span>
                      <span className="text-sm text-muted-foreground">{(ev as any).event_location || ""}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Start Date:</span>
                      <span className="text-sm text-muted-foreground">{(ev as any).event_start_date ? new Date((ev as any).event_start_date).toLocaleDateString() : ""}</span>
                </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Days:</span>
                      <span className="text-sm text-muted-foreground">{(ev as any).total_days || ""}</span>
                </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active:</span>
                      <span className="text-sm text-muted-foreground">{(ev as any).is_active ? "Yes" : "No"}</span>
                </div>
                  </div>

                  {/* Event status (right) */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {(() => {
                          const sd = (ev as any).event_start_date
                          const td = (ev as any).total_days || 1
                          if (!sd) return ""
                          const startDate = new Date(sd)
                          const diffDays = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                          if (diffDays < 1) return "Event not started"
                          if (diffDays > td) return "Event completed"
                          const n = diffDays
                          const j = n % 10
                          const k = n % 100
                          const ord = j === 1 && k !== 11 ? n + "st" : j === 2 && k !== 12 ? n + "nd" : j === 3 && k !== 13 ? n + "rd" : n + "th"
                          return `${ord} day of ${td}`
                        })()}
                </div>
                      <p className="text-sm text-muted-foreground">Current Status</p>
              </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Event Progress</span>
                  <span>
                          {(() => {
                            const sd = (ev as any).event_start_date
                            const td = (ev as any).total_days || 1
                            if (!sd) return ""
                            const diffDays = Math.ceil((new Date().getTime() - new Date(sd).getTime()) / (1000 * 60 * 60 * 24))
                            if (diffDays < 1) return `0/${td}`
                            if (diffDays > td) return `${td}/${td}`
                            return `${diffDays}/${td}`
                          })()}
                  </span>
                </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: (() => {
                              const sd = (ev as any).event_start_date
                              const td = (ev as any).total_days || 1
                              if (!sd) return "0%"
                              const pct = (Math.ceil((new Date().getTime() - new Date(sd).getTime()) / (1000 * 60 * 60 * 24)) / td) * 100
                              return `${Math.min(100, Math.max(0, pct))}%`
                            })(),
                          }}
                        ></div>
              </div>
              </div>
              </div>
              </div>

                {/* Members Present in (Event) - centered below */}
                <div className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                      <span className="font-medium">{`Members Present in ${ev.event_name}`}</span>
                  </div>
                    <div className="flex gap-2">
                      <DownloadMenu
                        onDownloadPdf={() => downloadEventAttendeesPdf(ev.id, ev.event_name)}
                        onDownloadExcel={() => downloadEventAttendeesExcel(ev.id, ev.event_name)}
                      />
                      <Dialog open={selectedEventId === ev.id && addMemberDialogOpen} onOpenChange={(open) => {
                        setAddMemberDialogOpen(open);
                        if (open) setSelectedEventId(ev.id);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedEventId(ev.id);
                            setAddMemberDialogOpen(true);
                          }}>
                            <Users className="w-4 h-4 mr-2" /> Add Member
                          </Button>
                        </DialogTrigger>
                        <DialogContent style={{ width: "1200px", maxWidth: "95vw", minHeight: "600px" }} className="!w-[1200px] !max-w-[95vw] !min-h-[600px]">
                          <DialogHeader>
                            <DialogTitle>Add Member to {ev.event_name}</DialogTitle>
                            <DialogDescription>Select a member from Tajneed to add to this event.</DialogDescription>
                          </DialogHeader>
                          <div className="mb-4 flex gap-2 items-center">
                            <Input
                              placeholder="Search by name..."
                              value={addMemberSearchTerm}
                              onChange={e => setAddMemberSearchTerm(e.target.value)}
                              className="w-1/2"
                            />
                            <Select value={addMemberRegion} onValueChange={setAddMemberRegion}>
                              <SelectTrigger className="w-1/4">
                                <SelectValue placeholder="Filter by Region" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__all__">All Regions</SelectItem>
                                {Array.from(new Set(tajneedMembers
                                  .map(m => m.region)
                                  .filter(region => {
                                    return (
                                      typeof region === "string" &&
                                      region !== null &&
                                      region !== undefined &&
                                      region.trim() !== "" &&
                                      region !== ""
                                    );
                                  })
                                )).map(region => (
                                  <SelectItem key={region} value={region}>{region}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={addMemberMajlis} onValueChange={setAddMemberMajlis}>
                              <SelectTrigger className="w-1/4">
                                <SelectValue placeholder="Filter by Majlis" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__all__">All Majlis</SelectItem>
                                {Array.from(new Set(tajneedMembers
                                  .map(m => m.majlis)
                                  .filter(majlis => {
                                    return (
                                      typeof majlis === "string" &&
                                      majlis !== null &&
                                      majlis !== undefined &&
                                      majlis.trim() !== "" &&
                                      majlis !== ""
                                    );
                                  })
                                )).map(majlis => (
                                  <SelectItem key={majlis} value={majlis}>{majlis}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="max-h-64 overflow-y-auto mt-2">
                            {filteredTajneedMembers.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No members found.</p>
                            ) : (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-muted/50">
                                    <th className="text-left px-3 py-2">Names</th>
                                    <th className="text-left px-3 py-2">Phone Number</th>
                                    <th className="text-left px-3 py-2">Category</th>
                                    <th className="text-left px-3 py-2">Region</th>
                                    <th className="text-left px-3 py-2">Majlis</th>
                                    <th className="text-right px-3 py-2">Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredTajneedMembers.map((member: any) => (
                                    <tr key={member.id} className="border-t">
                                      <td className="px-3 py-2">{member.full_name}</td>
                                      <td className="px-3 py-2">{member.mobile_number || ""}</td>
                                      <td className="px-3 py-2">{member.category || ""}</td>
                                      <td className="px-3 py-2">{member.region || ""}</td>
                                      <td className="px-3 py-2">{member.majlis || ""}</td>
                                      <td className="px-3 py-2 text-right">
                                        {/* Add loading state to Add button */}
                                        <AddMemberButton eventId={ev.id} memberId={member.id} addMemberToEvent={addMemberToEvent} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                </div>
                  </div>
                  {Array.isArray(attendeesByEvent[ev.id]) && attendeesByEvent[ev.id].length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members have been marked present yet.</p>
                  ) : Array.isArray(attendeesByEvent[ev.id]) ? (
                    <div className="max-h-64 overflow-y-auto border rounded">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-3 py-2">S/N</th>
                            <th className="text-left px-3 py-2">Full Name</th>
                            <th className="text-left px-3 py-2">Islamic Name</th>
                            <th className="text-left px-3 py-2">Category</th>
                            <th className="text-left px-3 py-2">Mobile</th>
                            <th className="text-left px-3 py-2">Region</th>
                            <th className="text-left px-3 py-2">Majlis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendeesByEvent[ev.id].map((row, idx) => (
                            <tr key={row.participant_id} className="border-t">
                              <td className="px-3 py-2">{idx + 1}</td>
                              <td className="px-3 py-2">{row.participants?.full_name || ""}</td>
                              <td className="px-3 py-2">{row.participants?.islamic_names || ""}</td>
                              <td className="px-3 py-2">{row.participants?.category || ""}</td>
                              <td className="px-3 py-2">{row.participants?.mobile_number || ""}</td>
                              <td className="px-3 py-2">{row.participants?.region || ""}</td>
                              <td className="px-3 py-2">{row.participants?.majlis || ""}</td>
                              <td className="px-3 py-2 text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      Remove
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove <b>{row.participants?.full_name || "this member"}</b> from the present list?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={async () => {
                                          const removeRes = await fetch(`/api/event-attendance?eventId=${ev.id}&participantId=${row.participant_id}`, {
                                            method: "DELETE"
                                          });
                                          if (removeRes.ok) {
                                            // Refetch attendees from backend to ensure UI is in sync
                                            const attRes = await fetch(`/api/event-attendance?eventId=${ev.id}`);
                                            if (attRes.ok) {
                                              const json = await attRes.json();
                                              setAttendeesByEvent(prev => ({ ...prev, [ev.id]: json.attendees || [] }));
                                            }
                                            
                                          } else {
                                            toast({
                                              title: "Error",
                                              description: "Failed to remove member.",
                                              variant: "destructive"
                                            });
                                          }
                                        }}
                                      >
                                        Confirm
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Click Load Attendance to view members for this event.</p>
                  )}
              </div>
            </CardContent>
          </Card>
          ))}
              </div>
      </main>

      {/* Create Event Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>Add a new event.</DialogDescription>
          </DialogHeader>
              <div className="space-y-4">
            <div>
              <Label htmlFor="newEventName">Event Name</Label>
              <Input id="newEventName" value={newEventName} onChange={(e) => setNewEventName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="newEventLocation">Event Location</Label>
              <Input id="newEventLocation" value={newEventLocation} onChange={(e) => setNewEventLocation(e.target.value)} />
                </div>
            <div>
              <Label htmlFor="newEventStart">Event Start Date</Label>
              <Input id="newEventStart" type="date" value={newEventStartDate} onChange={(e) => setNewEventStartDate(e.target.value)} />
                </div>
            <div>
              <Label htmlFor="newTotalDays">Total Event Days</Label>
              <Input id="newTotalDays" type="number" min="1" max="30" value={newEventTotalDays} onChange={(e) => setNewEventTotalDays(e.target.value)} />
                </div>
                </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                const res = await fetch("/api/event-settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    eventStartDate: newEventStartDate,
                    eventName: newEventName,
                    eventLocation: newEventLocation,
                    totalDays: newEventTotalDays,
                  }),
                })
                if (res.ok) {
                  const r = await fetch("/api/events")
                  if (r.ok) {
                    const j = await r.json()
                    setEvents(j.events || [])
                  }
                  setCreateOpen(false)
                  setNewEventName("")
                  setNewEventLocation("")
                  setNewEventStartDate("")
                  setNewEventTotalDays("1")
                }
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event information and settings.</DialogDescription>
          </DialogHeader>
          {editEventData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editEventName">Event Name</Label>
                <Input id="editEventName" value={editEventData.event_name} onChange={(e) => setEditEventData({ ...editEventData, event_name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="editEventLocation">Event Location</Label>
                <Input id="editEventLocation" value={editEventData.event_location} onChange={(e) => setEditEventData({ ...editEventData, event_location: e.target.value })} />
                </div>
              <div>
                <Label htmlFor="editEventStart">Event Start Date</Label>
                <Input id="editEventStart" type="date" value={editEventData.event_start_date} onChange={(e) => setEditEventData({ ...editEventData, event_start_date: e.target.value })} />
                </div>
              <div>
                <Label htmlFor="editTotalDays">Total Event Days</Label>
                <Input id="editTotalDays" type="number" min="1" max="30" value={String(editEventData.total_days)} onChange={(e) => setEditEventData({ ...editEventData, total_days: Number(e.target.value) })} />
              </div>
        </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!editEventData) return
                const res = await fetch(`/api/events/${editEventData.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    eventName: editEventData.event_name,
                    eventLocation: editEventData.event_location,
                    eventStartDate: editEventData.event_start_date,
                    totalDays: String(editEventData.total_days),
                  }),
                })
                if (res.ok) {
                  const r = await fetch("/api/events")
                  if (r.ok) {
                    const j = await r.json()
                    setEvents(j.events || [])
                  }
                  setEditOpen(false)
                  setEditEventData(null)
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}