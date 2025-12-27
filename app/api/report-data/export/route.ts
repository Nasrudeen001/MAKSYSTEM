import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const supabase = createClient()
  const url = new URL(req.url)
  const section = url.searchParams.get("section")

  // Try to read from the normalized other_reports table first. If rows exist
  // but the section-specific fields are all NULL (migration not applied),
  // fall back to reading report_data.details so the exported Excel contains
  // the values users submitted.
  const q = supabase.from("other_reports").select("*")
  if (section) q.eq("part", section)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Resolve region and majlis names for readability
  const regionsRes = await supabase.from("regions").select("id,name")
  const majlisRes = await supabase.from("majlis").select("id,name")
  const regionMap: any = {}
  const majlisMap: any = {}
  ;(regionsRes.data || []).forEach((r: any) => { regionMap[r.id] = r.name })
  ;(majlisRes.data || []).forEach((m: any) => { majlisMap[m.id] = m.name })

  // Build rows: prefer other_reports normalized columns; when a row's
  // section fields are all NULL, fall back to report_data.details JSON.
  const grouped: Record<string, any[]> = {}
  for (const r of (data || [])) {
    const k = r.part || 'other'
    if (!grouped[k]) grouped[k] = []

    // Check whether this row has any non-meta fields populated
    const metaCols = ['id','part','region_id','majlis_id','region','majlis','month','year','created_at']
    const otherCols = Object.keys(r).filter(c => !metaCols.includes(c))
    const hasAny = otherCols.some(c => r[c] !== null && r[c] !== undefined)

    if (hasAny) {
      grouped[k].push(r)
      continue
    }

    // fallback: read report_data.details for this row
    try {
      const { data: rd, error: rdErr } = await supabase.from('report_data').select('details').eq('region_id', r.region_id).eq('majlis_id', r.majlis_id).eq('report_month', r.month).eq('report_year', r.year).eq('section_key', r.part).limit(1).maybeSingle()
      if (!rdErr && rd && (rd as any).details) {
        // Flatten details into a row-like object for export
        const rowLike: any = { ...r, ...((rd as any).details || {}) }
        grouped[k].push(rowLike)
        continue
      }
    } catch (e) {
      // ignore and push the original row
    }

    grouped[k].push(r)
  }

  const wb = XLSX.utils.book_new()

  Object.entries(grouped).forEach(([k, rows]) => {
    const sheetData = rows.map((r: any) => {
      // prefer resolved names from lookups, fallback to legacy string columns or ids
      const regionName = regionMap[r.region_id] || r.region || ''
      const majlisName = majlisMap[r.majlis_id] || r.majlis || ''

      // build a readable object for the sheet
      const base: Record<string, any> = {
        region: regionName,
        majlis: majlisName,
        month: r.month,
        year: r.year,
      }

      // include any top-level columns (flatten details if stored as json)
      Object.keys(r).forEach((col) => {
        if (['region', 'majlis', 'region_id', 'majlis_id', 'month', 'year'].includes(col)) return
        let val = r[col]
        // Convert boolean-like fields to 'Yes'/'No' strings for readability
  const lowerCol = col.toLowerCase()
  const isYesNoField = col.endsWith('_yes_no') || ['monthly_report_yes_no', 'visited_by_nazm_e_ala_yes_no'].includes(col) || ['monthlyreport', 'visitednazmeala'].includes(lowerCol)
        if (isYesNoField) {
          if (val === 1 || val === '1' || val === true) val = 'Yes'
          else if (val === 0 || val === '0' || val === false) val = 'No'
          else val = String(val ?? '')
        } else if (val !== null && typeof val === 'object') {
          val = JSON.stringify(val)
        }

        base[col] = val
      })

      return base
    })

    const ws = XLSX.utils.json_to_sheet(sheetData)
    XLSX.utils.book_append_sheet(wb, ws, k.substring(0, 31))
  })

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  const filename = section ? `reports-${section}.xlsx` : `reports-all-parts.xlsx`

  return new NextResponse(Buffer.from(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
