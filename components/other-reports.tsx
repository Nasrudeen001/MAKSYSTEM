"use client"

import React, { useEffect, useState } from "react"
import { createClient as createSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { exportBrandedExcel } from "@/lib/excel"
import { usePagination } from "@/lib/hooks/usePagination"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination"

type SectionKey = "tabligh" | "tabligh_digital" | "umumi" | "talim_ul_quran" | "talim" | "isaar" | "sihat"

const sections: { key: SectionKey; title: string; fields: { key: string; label: string; type?: "number" | "boolean" }[] }[] = [
  {
    key: "tabligh",
    title: "Tabligh",
    fields: [
      // core tabligh fields (UI-level section for the main Tabligh tab)
      { key: "no_of_1_to_1_meeting", label: "No. of 1 to 1 meeting", type: "number" },
      { key: "no_under_tabligh", label: "No. under tabligh", type: "number" },
      { key: "no_of_book_stall", label: "No. of book stall", type: "number" },
      { key: "no_of_literature_distributed", label: "No. of literature distributed", type: "number" },
      { key: "no_of_new_contacts", label: "No. of new contacts", type: "number" },
      { key: "no_of_exhibitions", label: "No. of Exhibitions", type: "number" },
      { key: "no_of_dain_e_ilallah", label: "No. of Dain-e-ilallah", type: "number" },
      { key: "no_of_baiats", label: "No. of Baiats", type: "number" },
      { key: "no_of_tabligh_days_held", label: "No. of Tabligh days held", type: "number" },
    ],
  },
  {
    key: "umumi",
    title: "Umumi",
    fields: [
      { key: "monthly_report_yes_no", label: "Monthly report", type: "boolean" },
      { key: "no_of_amila_meeting", label: "No. of Amila Meeting", type: "number" },
      { key: "no_of_general_meeting", label: "No. of General Meeting", type: "number" },
      { key: "visited_by_nazm_e_ala_yes_no", label: "Visited by Nazm-e-Ala", type: "boolean" },
    ],
  },
  {
    key: "talim_ul_quran",
    title: "Talim-ul-Quran",
    fields: [
      { key: "no_of_talim_ul_quran_held", label: "No. of Talim-ul-Quran held", type: "number" },
      { key: "no_of_ansar_attending", label: "No. of Ansar attending", type: "number" },
      { key: "avg_no_of_ansar_joining_weekly_quran_class", label: "Average No. of Ansar joining weekly Quran class", type: "number" },
    ],
  },
  {
    key: "talim",
    title: "Talim",
    fields: [
      { key: "no_of_ansar_reading_book", label: "No. of Ansar reading book", type: "number" },
      { key: "no_of_ansar_participated_in_exam", label: "No. of Ansar participated in exam", type: "number" },
    ],
  },
  {
    key: "isaar",
    title: "Isaar",
    fields: [
      { key: "no_of_ansar_visiting_sick", label: "No. of Ansar visiting sick", type: "number" },
      { key: "no_of_ansar_visiting_elderly", label: "No. of Ansar visiting elderly", type: "number" },
      { key: "no_of_feed_the_hungry_program_held", label: "No. of Feed the Hungry program held", type: "number" },
      { key: "no_of_ansar_participated_in_feed_the_hungry", label: "No. of Ansar participated", type: "number" },
    ],
  },
  {
    key: "sihat",
    title: "Dhahanat & Sihat-e-Jismani",
    fields: [
      { key: "no_of_ansar_regular_in_exercise", label: "No. of Ansar regular in exercise", type: "number" },
      { key: "no_of_ansar_who_owns_bicycle", label: "No. of Ansar who owns bicycle", type: "number" },
    ],
  },
]

// Separate digital/merch fields for Tabligh so they can be stored/queried
// independently under a different section key ("tabligh_digital").
const tablighDigitalFields = [
  { key: 'no_of_digital_content_created', label: 'No. of Digital content created', type: 'number' },
  { key: 'merch_reflector_jackets', label: 'Reflector Jackets', type: 'number' },
  { key: 'merch_tshirts', label: 'T-Shirts', type: 'number' },
  { key: 'merch_caps', label: 'Caps', type: 'number' },
  { key: 'merch_stickers', label: 'Stickers', type: 'number' },
]

// For convenience the core fields lookup
const tablighCoreFields = sections.find(s => s.key === 'tabligh')!.fields

function getSectionKeyFromRole(role: string): SectionKey | null {
  const roleToSection: Record<string, SectionKey> = {
    "Tabligh": "tabligh",
    "Umumi": "umumi",
    "Talim-ul-Quran": "talim_ul_quran",
    "Talim": "talim",
    "Isaar": "isaar",
    "Dhahanat & Sihat-e-Jismani": "sihat"
  }
  return roleToSection[role] || null
}

export function OtherReports() {
  const supabase = createSupabaseClient()
  const [activeTab, setActiveTab] = useState<SectionKey>(sections[0].key)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [regions, setRegions] = useState<any[]>([])
  const [majlis, setMajlis] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogRegion, setDialogRegion] = useState<string | null>(null)
  const [sectionFilters, setSectionFilters] = useState<Record<string, { region?: string; majlis?: string; month?: string; year?: string }>>({})

  const [userRole, setUserRole] = useState<string | null>(null)
  const [allowedSections, setAllowedSections] = useState<SectionKey[]>(sections.map(s => s.key))
  const [dashboardUrl, setDashboardUrl] = useState<string>("/dashboard")

  function getSectionFilter(key: string) {
    return sectionFilters[key] || {}
  }

  function updateSectionFilter(key: string, patch: Partial<{ region?: string; majlis?: string; month?: string; year?: string }>) {
    setSectionFilters((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }))
  }
  
  const [editRow, setEditRow] = useState<any | null>(null)
  const [addDefaults, setAddDefaults] = useState<Record<string, any> | null>(null)
  // Tabligh filters for card 1 (full) and card 2 (digital/merch)
  const [tablighFilter1, setTablighFilter1] = useState<{ region?: string; majlis?: string; month?: string; year?: string }>({})
  const [tablighFilter2, setTablighFilter2] = useState<{ month?: string; year?: string }>({})
  const [dialogSection, setDialogSection] = useState<SectionKey | null>(null)
  const [tableData, setTableData] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)

  // Helper: build columns and rows for a given sectionKey and filteredRows
  function buildTableForPdf(sectionKey: string, rows: any[]) {
    if (!rows || rows.length === 0) {
      // For tabligh_digital we don't include Region/Majlis
      if (sectionKey === 'tabligh_digital') return { columns: ['Month', 'Year', ...tablighDigitalFields.map((f) => f.label)], rows: [] }
      return { columns: ['Region', 'Majlis', 'Month', 'Year'], rows: [] }
    }
    const section = sectionKey === 'tabligh_digital' ? { key: 'tabligh_digital', title: 'Tabligh — Digital/Merch', fields: tablighDigitalFields } : (sections.find(s => s.key === sectionKey) as any)
    let cols: string[] = []
    let dataRows: any[] = []

    if (sectionKey === 'tabligh_digital') {
      cols = ['Month', 'Year', ...((section && section.fields) ? section.fields.map((f: any) => f.label) : [])]
      dataRows = rows.map((r: any) => {
        const base = [r.report_month || '-', r.report_year || '-']
        const details = (section && section.fields) ? section.fields.map((f: any) => r.details?.[f.key] ?? '-') : []
        return base.concat(details)
      })
    } else {
      cols = ['Region', 'Majlis', 'Month', 'Year', ...((section && section.fields) ? section.fields.map((f: any) => f.label) : [])]
      dataRows = rows.map((r: any) => {
        // Prefer name lookup via regionMap/majlisMap when available, fall back to provided string or id
        const regionName = (typeof regionMap !== 'undefined' && (regionMap[r.region_id] || regionMap[r.region])) || r.region || r.region_id || '-'
        const majlisName = (typeof majlisMap !== 'undefined' && (majlisMap[r.majlis_id] || majlisMap[r.majlis])) || r.majlis || r.majlis_id || '-'
        const base = [regionName, majlisName, r.report_month || '-', r.report_year || '-']
        const details = (section && section.fields) ? section.fields.map((f: any) => {
          if (f.type === 'boolean') {
            const v = r.details?.[f.key]
            return (v === 1 || v === '1' || v === 'Yes') ? 'Yes' : ((v === 0 || v === '0' || v === 'No') ? 'No' : '-')
          }
          return r.details?.[f.key] ?? '-'
        }) : []
        return base.concat(details)
      })
    }
    return { columns: cols, rows: dataRows }
  }

  async function downloadPdfForSection(sectionKey: string, title: string, rows: any[]) {
    // Create doc
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
    const pageWidth = (doc as any).internal.pageSize.getWidth()

    // Add logo from public folder - use <img> by loading via fetch and convert to dataURL
    try {
      const logoResp = await fetch('/ansar-logo.jpeg')
      if (logoResp.ok) {
        const blob = await logoResp.blob()
        const reader = new FileReader()
        const imgData: string = await new Promise((res, rej) => {
          reader.onloadend = () => res(String(reader.result))
          reader.onerror = rej
          reader.readAsDataURL(blob)
        })
        const imgProps = (doc as any).getImageProperties(imgData)
        const imgWidth = 80
        const imgHeight = (imgProps.height / imgProps.width) * imgWidth
        const x = (pageWidth - imgWidth) / 2
        doc.addImage(imgData, 'JPEG', x, 30, imgWidth, imgHeight)
      }
    } catch (e) {
      // ignore image failures
      console.warn('Logo load failed', e)
    }

    // Title lines
    const startY = 30 + 90
  doc.setFontSize(16)
  ;(doc as any).setFont(undefined, 'bold')
    doc.text('Majlis Ansarullah Kenya', pageWidth / 2, startY, { align: 'center' })
  doc.setFontSize(12)
  ;(doc as any).setFont(undefined, 'normal')
    doc.text(title, pageWidth / 2, startY + 18, { align: 'center' })

    const { columns, rows: pdfRows } = buildTableForPdf(sectionKey, rows)

    // If no rows, still output header-only PDF
    if (!pdfRows || pdfRows.length === 0) {
      doc.save(`${title || sectionKey}.pdf`)
      return
    }

    // Prepare autotable columns
    const head = [columns]
    const body = pdfRows

    autoTable(doc as any, {
      startY: startY + 30,
      head,
      body,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 78, 99] },
      theme: 'striped',
      margin: { left: 40, right: 40 }
    })

    doc.save(`${title || sectionKey}.pdf`)
  }

  async function downloadExcelForSection(sectionKey: string, title: string, rows: any[]) {
    const orgName = 'Majlis Ansarullah Kenya'
    const sheetTitle = title || (sections.find(s => s.key === sectionKey)?.title ?? sectionKey)

    const { columns, rows: excelRows } = buildTableForPdf(sectionKey, rows)
    const headers = columns
    const data = excelRows

    await exportBrandedExcel(
      `${sheetTitle.replace(/\s+/g, '_').toLowerCase()}.xlsx`,
      data,
      headers,
      orgName,
      sheetTitle,
      undefined,
      sheetTitle
    )
  }

  useEffect(() => {
    // Check for sub-user role
    const subUser = localStorage.getItem("subUser")
    if (subUser) {
      try {
        const user = JSON.parse(subUser)
        const role = user.role
        setUserRole(role)
        const sectionKey = getSectionKeyFromRole(role)
        if (sectionKey) {
          setActiveTab(sectionKey)
          setAllowedSections([sectionKey])
        } else {
          setAllowedSections(sections.map(s => s.key))
        }

        // Set dashboard URL based on role
        const roleToDashboard: Record<string, string> = {
          "Tajneed": "/participants",
          "Maal": "/contribution",
          "Tarbiyyat": "/academics",
          "Ijtemas": "/settings",
          "Tabligh": "/tabligh-dashboard",
          "Umumi": "/umumi-dashboard",
          "Talim-ul-Quran": "/talim-ul-quran-dashboard",
          "Talim": "/talim-dashboard",
          "Isaar": "/isaar-dashboard",
          "Dhahanat & Sihat-e-Jismani": "/sihat-dashboard"
        }
        setDashboardUrl(roleToDashboard[role] || "/dashboard")
      } catch (e) {
        setAllowedSections(sections.map(s => s.key))
        setDashboardUrl("/dashboard")
      }
    } else {
      setAllowedSections(sections.map(s => s.key))
      setDashboardUrl("/dashboard")
    }
  }, [])

  useEffect(() => {
    async function loadLookups() {
      try {
        const { data: regionsData } = await supabase.from("regions").select("id,name")
        setRegions(regionsData || [])
      } catch (e) {
        console.error('Failed to load regions', e)
        setRegions([])
      }
      try {
        // load majlis including region_id so we can filter by region in the dialog
        const { data: majlisData } = await supabase.from("majlis").select("id,name,region_id")
        setMajlis(majlisData || [])
      } catch (e) {
        console.error('Failed to load majlis', e)
        setMajlis([])
      }
    }
    loadLookups()
    fetchAllTables()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Realtime subscription: refresh table when other_reports changes
  useEffect(() => {
    let unsub: (() => void) | null = null
    try {
      const channelFactory = (supabase as any).channel
      if (typeof channelFactory === 'function') {
        const channel = channelFactory('public:other_reports')
        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'other_reports' }, () => fetchAllTables())
        if (typeof channel.subscribe === 'function') channel.subscribe()
        unsub = () => { try { if (typeof channel.unsubscribe === 'function') channel.unsubscribe() } catch {} }
      } else if ((supabase as any).from && typeof (supabase as any).from === 'function') {
        const listener = (supabase as any).from('other_reports').on('*', () => fetchAllTables())
        if (listener && typeof listener.subscribe === 'function') listener.subscribe()
        unsub = () => { try { if (listener && typeof listener.unsubscribe === 'function') listener.unsubscribe() } catch {} }
      }
    } catch (err) {
      console.warn('Realtime subscription failed', err)
    }

    return () => { if (unsub) unsub() }
  }, [supabase])

  async function fetchAllTables() {
    try {
      const resp = await fetch('/api/other-reports', { cache: 'no-store' })
      const body = await resp.json()
      const data = Array.isArray(body) ? body : (body && Array.isArray((body as any).data) ? (body as any).data : [])
      const result: Record<string, any[]> = {}
      data.forEach((row: any) => {
        const p = row.part || 'other'
        if (!result[p]) result[p] = []
        result[p].push(row)
      })
      setTableData(result)
      return result
    } catch (e) {
      console.error('Failed to fetch other reports', e)
      setTableData({})
      return {}
    }
  }

  function openAddDialog(section: SectionKey, defaults?: Record<string, any>) {
    setEditRow(null)
    setAddDefaults(defaults ?? null)
    setDialogSection(section)
    // initialize dialog-local region selection when opening
    setDialogRegion(defaults?.region ?? null)
    setDialogOpen(true)
  }

  function openEditDialog(row: any) {
    setEditRow(row)
    setDialogSection(row.part)
    // preselect the region from the row when editing
    setDialogRegion(row.region_id ?? null)
    setDialogOpen(true)
  }

  

  async function saveReport(sectionKey: SectionKey, form: FormData, id?: any) {
    setLoading(true)
    try {
      const regionVal = form.get("region") ? String(form.get("region")).trim() : ""
      const majlisVal = form.get("majlis") ? String(form.get("majlis")).trim() : ""
      const monthVal = form.get("month") ? String(form.get("month")).trim() : ""
      const yearVal = form.get("year") ? String(form.get("year")).trim() : ""

      // For digital/merch tabligh entries we only require month & year.
      if (sectionKey === 'tabligh_digital') {
        if (!monthVal || !yearVal) {
          alert('Please select Month and Year before saving')
          return
        }
      } else {
        if (!regionVal || !majlisVal || !monthVal || !yearVal) {
          alert('Please select Region, Majlis, Month and Year before saving')
          return
        }
      }

      const payload: any = {
        part: sectionKey,
        region: regionVal || null,
        majlis: majlisVal || null,
        month: monthVal,
        year: Number(yearVal),
      }

      // flatten details directly into payload with schema keys
  // Pick field list depending on sectionKey
  const fields = sectionKey === 'tabligh_digital' ? tablighDigitalFields : (sections.find((s) => s.key === sectionKey)?.fields || [])
      fields.forEach((f) => {
        const v = form.get(f.key)
        if (f.type === 'boolean') {
          payload[f.key] = v === null || v === undefined || v === "" ? null : String(v) === '1' ? '1' : '0'
        } else {
          payload[f.key] = v === null || v === undefined || v === "" ? null : Number(v)
        }
      })

      const url = id ? `/api/other-reports/${id}` : '/api/other-reports'
      const method = id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      let respBody: any = null
      try { respBody = await res.json() } catch { respBody = null }

      if (!res.ok) {
        const msg = respBody && (respBody.error || JSON.stringify(respBody)) ? (respBody.error || JSON.stringify(respBody)) : `Status ${res.status}`
        alert('Failed to save: ' + msg)
        console.error('Save failed', res.status, respBody)
        return
      }

      const inserted = Array.isArray(respBody) ? respBody : (respBody && Array.isArray(respBody.data) ? respBody.data : [])

      // Update UI
      setTableData((prev) => {
        const next = { ...prev }
        if (id) {
          // Edit: replace the existing row
          next[sectionKey] = (next[sectionKey] || []).map((r) => {
            if (r.id === id) return inserted[0] || r
            return r
          })
        } else {
          next[sectionKey] = (next[sectionKey] || []).concat(inserted)
        }
        return next
      })
      // Refresh server-authoritative data immediately so details show up
      try {
        await fetchAllTables()
      } catch (e) {
        // ignore
      }

  setDialogOpen(false)
  setEditRow(null)
  setDialogRegion(null)
      // Keep the user on the main Tabligh tab so both cards remain visible
      if (sectionKey === 'tabligh_digital') setActiveTab('tabligh')
      else setActiveTab(sectionKey)
    } catch (e) {
      console.error('Unexpected error saving report', e)
      alert('Unexpected error saving report: ' + (e as any)?.message)
    } finally {
      setLoading(false)
    }
  }

  const activeSection = sections.find((s) => s.key === activeTab) ?? (activeTab === 'tabligh_digital' ? { key: 'tabligh_digital', title: 'Tabligh — Digital/Merch', fields: tablighDigitalFields } as any : sections[0])
  const regionMap = Object.fromEntries(regions.map((r: any) => [r.id, r.name]))
  const majlisMap = Object.fromEntries(majlis.map((m: any) => [m.id, m.name]))
  const sectionFilter = getSectionFilter(activeSection.key)

  // Precompute filtered arrays and pagination to avoid calling hooks conditionally inside JSX
  const tablighFiltered = (tableData['tabligh'] || []).filter((row: any) => {
    if (tablighFilter1.region && String(row.region_id) !== String(tablighFilter1.region) && String(row.region) !== String(tablighFilter1.region)) return false
    if (tablighFilter1.majlis && String(row.majlis_id) !== String(tablighFilter1.majlis) && String(row.majlis) !== String(tablighFilter1.majlis)) return false
    if (tablighFilter1.month && String(row.report_month) !== String(tablighFilter1.month)) return false
    if (tablighFilter1.year && String(row.report_year) !== String(tablighFilter1.year)) return false
    return true
  })
  const { paginated: tablighPaginated, page: tablighPage, setPage: setTablighPage, totalPages: tablighTotalPages } = usePagination(tablighFiltered, 50)

  const digitalFiltered = (tableData['tabligh_digital'] || []).filter((row: any) => {
    if (tablighFilter2.month && String(row.report_month) !== String(tablighFilter2.month)) return false
    if (tablighFilter2.year && String(row.report_year) !== String(tablighFilter2.year)) return false
    return true
  })
  const { paginated: digitalPaginated, page: digitalPage, setPage: setDigitalPage, totalPages: digitalTotalPages } = usePagination(digitalFiltered, 50)

  const defaultFiltered = (tableData[activeSection.key] || []).filter((row: any) => {
    if (sectionFilter.region && String(row.region_id) !== String(sectionFilter.region) && String(row.region) !== String(sectionFilter.region)) return false
    if (sectionFilter.majlis && String(row.majlis_id) !== String(sectionFilter.majlis) && String(row.majlis) !== String(sectionFilter.majlis)) return false
    if (sectionFilter.month && String(row.report_month) !== String(sectionFilter.month)) return false
    if (sectionFilter.year && String(row.report_year) !== String(sectionFilter.year)) return false
    return true
  })
  const { paginated: defaultPaginated, page: defaultPage, setPage: setDefaultPage, totalPages: defaultTotalPages } = usePagination(defaultFiltered, 50)

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-center">
          <div className="flex flex-col items-center w-full">
            {/* Section navigation - only show for admin users */}
            {!userRole && (
              <>
                {/* Mobile menu toggle */}
                <div className="flex justify-center w-full mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </Button>
                </div>
                {/* Desktop navigation */}
                <div className="hidden md:flex flex-wrap gap-2 justify-center">
                  {sections.filter(s => allowedSections.includes(s.key)).map((s) => (
                    <Button key={s.key} variant={s.key === activeTab ? "default" : "ghost"} onClick={() => setActiveTab(s.key)}>
                      {s.title}
                    </Button>
                  ))}
                  {/* Back to Dashboard as a navbar option - only show for admin users */}
                  <Button asChild variant="outline" size="sm" className="ml-2">
                    <a href={dashboardUrl}>Back to Dashboard</a>
                  </Button>
                </div>
                {/* Mobile navigation */}
                <div className={cn("md:hidden w-full", isMobileMenuOpen ? "block" : "hidden")}>
                  <div className="flex flex-col space-y-1 py-2">
                    {sections.filter(s => allowedSections.includes(s.key)).map((s) => (
                      <Button
                        key={s.key}
                        variant={s.key === activeTab ? "default" : "ghost"}
                        onClick={() => {
                          setActiveTab(s.key)
                          setIsMobileMenuOpen(false)
                        }}
                        className={cn(
                          "w-full justify-center",
                          s.key === activeTab && "bg-primary text-primary-foreground"
                        )}
                      >
                        {s.title}
                      </Button>
                    ))}
                    {/* Back to Dashboard as a navbar option (mobile) - only show for admin users */}
                    <Button asChild variant="outline" size="sm" className="w-full justify-center mt-2">
                      <a href={dashboardUrl}>Back to Dashboard</a>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border rounded space-y-4">
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <h2 className="text-xl font-semibold">{activeSection.title}</h2>
        </div>

            <div className="text-sm text-muted-foreground">Summary data (view only)</div>

        <div className="pt-2">
          {activeTab === 'tabligh' ? (
            <div className="space-y-6">
              {/* Card 1: core tabligh fields with Region/Majlis/Month/Year filters */}
              <div className="p-4 border rounded">
                <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                  <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
                    <select value={tablighFilter1.region ?? ''} onChange={(e) => setTablighFilter1((s) => ({ ...s, region: e.target.value || undefined }))} className="p-2 border rounded">
                      <option value="">All Regions</option>
                      {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <select value={tablighFilter1.majlis ?? ''} onChange={(e) => setTablighFilter1((s) => ({ ...s, majlis: e.target.value || undefined }))} className="p-2 border rounded">
                      <option value="">All Majlis</option>
                      {majlis.filter((m) => !tablighFilter1.region || String(m.region_id) === String(tablighFilter1.region)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <select value={tablighFilter1.month ?? ''} onChange={(e) => setTablighFilter1((s) => ({ ...s, month: e.target.value || undefined }))} className="p-2 border rounded">
                      <option value="">All Months</option>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input value={tablighFilter1.year ?? ''} onChange={(e) => setTablighFilter1((s) => ({ ...s, year: e.target.value || undefined }))} placeholder="Year" className="p-2 border rounded w-28" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                    <Button size="sm" onClick={() => openAddDialog('tabligh', { region: tablighFilter1.region, majlis: tablighFilter1.majlis, month: tablighFilter1.month, year: tablighFilter1.year })} className="w-full sm:w-auto">Add Tabligh Report</Button>
                    <Button size="sm" onClick={async () => {
                      const rows = (tableData['tabligh'] || []).filter((row: any) => {
                        if (tablighFilter1.region && String(row.region_id) !== String(tablighFilter1.region) && String(row.region) !== String(tablighFilter1.region)) return false
                        if (tablighFilter1.majlis && String(row.majlis_id) !== String(tablighFilter1.majlis) && String(row.majlis) !== String(tablighFilter1.majlis)) return false
                        if (tablighFilter1.month && String(row.report_month) !== String(tablighFilter1.month)) return false
                        if (tablighFilter1.year && String(row.report_year) !== String(tablighFilter1.year)) return false
                        return true
                      })
                      await downloadPdfForSection('tabligh', 'Tabligh Report', rows)
                    }} className="w-full sm:w-auto">Download PDF</Button>
                    <Button size="sm" onClick={async () => {
                      const rows = (tableData['tabligh'] || []).filter((row: any) => {
                        if (tablighFilter1.region && String(row.region_id) !== String(tablighFilter1.region) && String(row.region) !== String(tablighFilter1.region)) return false
                        if (tablighFilter1.majlis && String(row.majlis_id) !== String(tablighFilter1.majlis) && String(row.majlis) !== String(tablighFilter1.majlis)) return false
                        if (tablighFilter1.month && String(row.report_month) !== String(tablighFilter1.month)) return false
                        if (tablighFilter1.year && String(row.report_year) !== String(tablighFilter1.year)) return false
                        return true
                      })
                      await downloadExcelForSection('tabligh', 'Tabligh Report', rows)
                    }} className="w-full sm:w-auto">Download Excel</Button>
                  </div>
                </div>

                <Table className="stacked-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead>Majlis</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Year</TableHead>
                      {[
                        'no_of_1_to_1_meeting','no_under_tabligh','no_of_book_stall','no_of_literature_distributed','no_of_new_contacts','no_of_exhibitions','no_of_dain_e_ilallah','no_of_baiats','no_of_tabligh_days_held'
                      ].map((k) => <TableHead key={k}>{(sections.find(s => s.key === 'tabligh')!.fields.find(f => f.key === k) || { label: k }).label}</TableHead>)}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tablighPaginated.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell data-label="Region">{regionMap[row.region_id] || row.region || row.region_id || "-"}</TableCell>
                        <TableCell data-label="Majlis">{majlisMap[row.majlis_id] || row.majlis || row.majlis_id || "-"}</TableCell>
                        <TableCell data-label="Month">{row.report_month}</TableCell>
                        <TableCell data-label="Year">{row.report_year}</TableCell>
                        {[
                          'no_of_1_to_1_meeting','no_under_tabligh','no_of_book_stall','no_of_literature_distributed','no_of_new_contacts','no_of_exhibitions','no_of_dain_e_ilallah','no_of_baiats','no_of_tabligh_days_held'
                        ].map((k) => (
                          <TableCell key={k} data-label={(sections.find(s => s.key === 'tabligh')!.fields.find(f => f.key === k) || { label: k }).label}>{row.details?.[k] ?? '-'}</TableCell>
                        ))}
                        <TableCell data-label="Actions">
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => openEditDialog(row)}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={async () => {
                              if (!row.id) return
                              if (!confirm('Delete this report? This action cannot be undone.')) return
                              try {
                                const resp = await fetch(`/api/other-reports/${row.id}`, { method: 'DELETE' })
                                if (!resp.ok) throw new Error('Delete failed')
                                setTableData((prev) => ({ ...prev, tabligh: (prev.tabligh || []).filter((r) => r.id !== row.id) }))
                              } catch (e) {
                                console.error(e)
                                fetchAllTables()
                              }
                            }}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tablighTotalPages > 1 && (
                      <TableRow>
                        <TableCell colSpan={20} className="px-4 py-3">
                          <nav className="flex justify-center">
                            <Pagination aria-label="Tabligh pagination">
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious onClick={() => setTablighPage(Math.max(1, tablighPage - 1))} href="#" />
                                </PaginationItem>
                                {Array.from({ length: tablighTotalPages }, (_, i) => (
                                  <PaginationItem key={i}>
                                    <PaginationLink isActive={i + 1 === tablighPage} href="#" onClick={() => setTablighPage(i + 1)}>
                                      {i + 1}
                                    </PaginationLink>
                                  </PaginationItem>
                                ))}
                                <PaginationItem>
                                  <PaginationNext onClick={() => setTablighPage(Math.min(tablighTotalPages, tablighPage + 1))} href="#" />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </nav>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Card 2: digital content & merchandise with Month/Year filters */}
              <div className="p-4 border rounded">
                <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                  <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
                    <select value={tablighFilter2.month ?? ''} onChange={(e) => setTablighFilter2((s) => ({ ...s, month: e.target.value || undefined }))} className="p-2 border rounded">
                      <option value="">All Months</option>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input value={tablighFilter2.year ?? ''} onChange={(e) => setTablighFilter2((s) => ({ ...s, year: e.target.value || undefined }))} placeholder="Year" className="p-2 border rounded w-28" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                    <Button size="sm" onClick={() => openAddDialog('tabligh_digital', { month: tablighFilter2.month, year: tablighFilter2.year })} className="w-full sm:w-auto">Add Digital/Merch Report</Button>
                    <Button size="sm" onClick={async () => {
                      const rows = (tableData['tabligh_digital'] || []).filter((row: any) => {
                        if (tablighFilter2.month && String(row.report_month) !== String(tablighFilter2.month)) return false
                        if (tablighFilter2.year && String(row.report_year) !== String(tablighFilter2.year)) return false
                        return true
                      })
                      await downloadPdfForSection('tabligh_digital', 'Tabligh — Digital/Merch Report', rows)
                    }} className="w-full sm:w-auto">Download PDF</Button>
                    <Button size="sm" onClick={async () => {
                      const rows = (tableData['tabligh_digital'] || []).filter((row: any) => {
                        if (tablighFilter2.month && String(row.report_month) !== String(tablighFilter2.month)) return false
                        if (tablighFilter2.year && String(row.report_year) !== String(tablighFilter2.year)) return false
                        return true
                      })
                      await downloadExcelForSection('tabligh_digital', 'Tabligh — Digital/Merch Report', rows)
                    }} className="w-full sm:w-auto">Download Excel</Button>
                  </div>
                </div>

                <Table className="stacked-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Year</TableHead>
                      {tablighDigitalFields.map((f) => <TableHead key={f.key}>{f.label}</TableHead>)}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {digitalPaginated.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell data-label="Month">{row.report_month}</TableCell>
                        <TableCell data-label="Year">{row.report_year}</TableCell>
                        {tablighDigitalFields.map((f) => (
                          <TableCell key={f.key} data-label={f.label}>{row.details?.[f.key] ?? '-'}</TableCell>
                        ))}
                        <TableCell data-label="Actions">
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => openEditDialog(row)}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={async () => {
                              if (!row.id) return
                              if (!confirm('Delete this report? This action cannot be undone.')) return
                              try {
                                const resp = await fetch(`/api/other-reports/${row.id}`, { method: 'DELETE' })
                                if (!resp.ok) throw new Error('Delete failed')
                                setTableData((prev) => ({ ...prev, tabligh_digital: (prev.tabligh_digital || []).filter((r) => r.id !== row.id) }))
                              } catch (e) {
                                console.error(e)
                                fetchAllTables()
                              }
                            }}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {digitalTotalPages > 1 && (
                      <TableRow>
                        <TableCell colSpan={20} className="px-4 py-3">
                          <nav className="flex justify-center">
                            <Pagination aria-label="Tabligh digital pagination">
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious onClick={() => setDigitalPage(Math.max(1, digitalPage - 1))} href="#" />
                                </PaginationItem>
                                {Array.from({ length: digitalTotalPages }, (_, i) => (
                                  <PaginationItem key={i}>
                                    <PaginationLink isActive={i + 1 === digitalPage} href="#" onClick={() => setDigitalPage(i + 1)}>
                                      {i + 1}
                                    </PaginationLink>
                                  </PaginationItem>
                                ))}
                                <PaginationItem>
                                  <PaginationNext onClick={() => setDigitalPage(Math.min(digitalTotalPages, digitalPage + 1))} href="#" />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </nav>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            // default rendering for non-tabligh sections
            <div>
              <div className="p-4 border rounded mb-4">
                <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                  <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
                    <select value={getSectionFilter(activeSection.key).region ?? ''} onChange={(e) => updateSectionFilter(activeSection.key, { region: e.target.value || undefined, majlis: undefined })} className="p-2 border rounded">
                      <option value="">All Regions</option>
                      {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <select value={getSectionFilter(activeSection.key).majlis ?? ''} onChange={(e) => updateSectionFilter(activeSection.key, { majlis: e.target.value || undefined })} className="p-2 border rounded">
                      <option value="">All Majlis</option>
                      {majlis.filter((m) => !getSectionFilter(activeSection.key).region || String(m.region_id) === String(getSectionFilter(activeSection.key).region)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <select value={getSectionFilter(activeSection.key).month ?? ''} onChange={(e) => updateSectionFilter(activeSection.key, { month: e.target.value || undefined })} className="p-2 border rounded">
                      <option value="">All Months</option>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input value={getSectionFilter(activeSection.key).year ?? ''} onChange={(e) => updateSectionFilter(activeSection.key, { year: e.target.value || undefined })} placeholder="Year" className="p-2 border rounded w-28" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                      <Button size="sm" onClick={() => openAddDialog(activeSection.key, { region: getSectionFilter(activeSection.key).region, majlis: getSectionFilter(activeSection.key).majlis, month: getSectionFilter(activeSection.key).month, year: getSectionFilter(activeSection.key).year })} className="w-full sm:w-auto">Add {activeSection.title} Report</Button>
                      <Button size="sm" onClick={async () => {
                        const rows = (tableData[activeSection.key] || []).filter((row: any) => {
                          const sf = getSectionFilter(activeSection.key)
                          if (sf.region && String(row.region_id) !== String(sf.region) && String(row.region) !== String(sf.region)) return false
                          if (sf.majlis && String(row.majlis_id) !== String(sf.majlis) && String(row.majlis) !== String(sf.majlis)) return false
                          if (sf.month && String(row.report_month) !== String(sf.month)) return false
                          if (sf.year && String(row.report_year) !== String(sf.year)) return false
                          return true
                        })
                        await downloadPdfForSection(activeSection.key, `${activeSection.title} Report`, rows)
                      }} className="w-full sm:w-auto">Download PDF</Button>
                      <Button size="sm" onClick={async () => {
                        const rows = (tableData[activeSection.key] || []).filter((row: any) => {
                          const sf = getSectionFilter(activeSection.key)
                          if (sf.region && String(row.region_id) !== String(sf.region) && String(row.region) !== String(sf.region)) return false
                          if (sf.majlis && String(row.majlis_id) !== String(sf.majlis) && String(row.majlis) !== String(sf.majlis)) return false
                          if (sf.month && String(row.report_month) !== String(sf.month)) return false
                          if (sf.year && String(row.report_year) !== String(sf.year)) return false
                          return true
                        })
                        await downloadExcelForSection(activeSection.key, `${activeSection.title} Report`, rows)
                      }} className="w-full sm:w-auto">Download Excel</Button>
                  </div>
                </div>
              </div>
              <Table className="stacked-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Majlis</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Year</TableHead>
                    {activeSection.fields.map((f: { key: string; label: string; type?: string }) => (
                      <TableHead key={f.key}>{f.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {defaultPaginated.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell data-label="Region">{regionMap[row.region_id] || row.region || row.region_id || "-"}</TableCell>
                        <TableCell data-label="Majlis">{majlisMap[row.majlis_id] || row.majlis || row.majlis_id || "-"}</TableCell>
                        <TableCell data-label="Month">{row.report_month}</TableCell>
                        <TableCell data-label="Year">{row.report_year}</TableCell>
                        {activeSection.fields.map((f: { key: string; label: string; type?: string }) => (
                          <TableCell key={f.key} data-label={f.label}>{
                            f.type === "boolean"
                              ? (row.details && (row.details[f.key] === 1 || row.details[f.key] === '1' || row.details[f.key] === 'Yes') ? "Yes" : (row.details && (row.details[f.key] === 0 || row.details[f.key] === '0' || row.details[f.key] === 'No') ? "No" : "-"))
                              : (row.details?.[f.key] ?? "-")
                          }</TableCell>
                        ))}
                        <TableCell data-label="Actions">
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => openEditDialog(row)}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={async () => {
                              if (!row.id) return
                              if (!confirm('Delete this report? This action cannot be undone.')) return
                              try {
                                const resp = await fetch(`/api/other-reports/${row.id}`, { method: 'DELETE' })
                                if (!resp.ok) throw new Error('Delete failed')
                                setTableData((prev) => ({ ...prev, [activeSection.key]: (prev[activeSection.key] || []).filter((r) => r.id !== row.id) }))
                              } catch (e) {
                                console.error(e)
                                fetchAllTables()
                              }
                            }}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {defaultTotalPages > 1 && (
                      <TableRow>
                        <TableCell colSpan={20} className="px-4 py-3">
                          <nav className="flex justify-center">
                            <Pagination aria-label="Reports pagination">
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious onClick={() => setDefaultPage(Math.max(1, defaultPage - 1))} href="#" />
                                </PaginationItem>
                                {Array.from({ length: defaultTotalPages }, (_, i) => (
                                  <PaginationItem key={i}>
                                    <PaginationLink isActive={i + 1 === defaultPage} href="#" onClick={() => setDefaultPage(i + 1)}>
                                      {i + 1}
                                    </PaginationLink>
                                  </PaginationItem>
                                ))}
                                <PaginationItem>
                                  <PaginationNext onClick={() => setDefaultPage(Math.min(defaultTotalPages, defaultPage + 1))} href="#" />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </nav>
                        </TableCell>
                      </TableRow>
                    )}
                  
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>{editRow ? `Edit ${dialogSection ? (dialogSection === 'tabligh_digital' ? 'Tabligh — Digital/Merch' : (sections.find((s) => s.key === dialogSection)?.title ?? 'Report')) : "Report"}` : `Add ${dialogSection ? (dialogSection === 'tabligh_digital' ? 'Tabligh — Digital/Merch' : (sections.find((s) => s.key === dialogSection)?.title ?? 'Report')) : "Report"}`}</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!dialogSection) return
              const form = new FormData(e.currentTarget as HTMLFormElement)
              await saveReport(dialogSection, form, editRow?.id)
            }}
            className="space-y-3"
          >
            {dialogSection === 'tabligh_digital' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Month</label>
                  <select name="month" className="w-full p-2 border rounded" defaultValue={editRow?.report_month ?? addDefaults?.month ?? ""}>
                    <option value="">-- Select Month --</option>
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((name, i) => <option key={i} value={name}>{name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <input name="year" defaultValue={editRow?.report_year ?? addDefaults?.year ?? new Date().getFullYear().toString()} placeholder="e.g. 2025" className="w-full p-2 border rounded" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Region</label>
                  <select name="region" className="w-full p-2 border rounded" defaultValue={editRow?.region_id ?? addDefaults?.region ?? dialogRegion ?? ""} onChange={(e) => setDialogRegion(e.target.value || null)}>
                    <option value="">-- Select Region --</option>
                    {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Majlis</label>
                  <select name="majlis" className="w-full p-2 border rounded" defaultValue={editRow?.majlis_id ?? addDefaults?.majlis ?? ""}>
                    <option value="">-- Select Majlis --</option>
                    {majlis.filter((m) => !dialogRegion || String(m.region_id) === String(dialogRegion)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Month</label>
                  <select name="month" className="w-full p-2 border rounded" defaultValue={editRow?.report_month ?? addDefaults?.month ?? ""}>
                    <option value="">-- Select Month --</option>
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((name, i) => <option key={i} value={name}>{name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <input name="year" defaultValue={editRow?.report_year ?? addDefaults?.year ?? new Date().getFullYear().toString()} placeholder="e.g. 2025" className="w-full p-2 border rounded" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              { (dialogSection ? (dialogSection === 'tabligh_digital' ? tablighDigitalFields : (sections.find((s) => s.key === dialogSection)?.fields ?? [])) : []).map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1">{f.label}</label>
                  {f.type === "boolean" ? (
                    <select name={f.key} className="w-full p-2 border rounded" defaultValue={
                      (editRow?.details?.[f.key] ?? addDefaults?.[f.key]) === 'Yes' ? '1' : ((editRow?.details?.[f.key] ?? addDefaults?.[f.key]) === 'No' ? '0' : '')
                    }>
                      <option value="">-- Select --</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                  ) : (
                    <input name={f.key} defaultValue={editRow?.details?.[f.key] ?? addDefaults?.[f.key] ?? ''} inputMode="numeric" pattern="[0-9]*" className="w-full p-2 border rounded" />
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => { setDialogOpen(false); setEditRow(null); setAddDefaults(null); setDialogRegion(null); }}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OtherReports
