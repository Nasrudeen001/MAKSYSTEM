import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'

// We'll use pdf-lib which is pure JS and doesn't pull in fontkit/restructure
// dependencies that require `iconv-lite` or AFM font files.
export async function GET(req: Request) {
  try {
    const supabase = createClient()
    const url = new URL(req.url)
    const section = url.searchParams.get("section")

    // Read rows from other_reports (falling back to report_data details when necessary)
    const q = supabase.from("other_reports").select("*")
    if (section) q.eq("part", section)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Resolve region and majlis names
    const regionsRes = await supabase.from("regions").select("id,name")
    const majlisRes = await supabase.from("majlis").select("id,name")
    const regionMap: any = {}
    const majlisMap: any = {}
    ;(regionsRes.data || []).forEach((r: any) => { regionMap[r.id] = r.name })
    ;(majlisRes.data || []).forEach((m: any) => { majlisMap[m.id] = m.name })

    // Group rows by part, fallback to report_data.details if section columns absent
    const grouped: Record<string, any[]> = {}
    for (const r of (data || [])) {
      const k = r.part || 'other'
      if (!grouped[k]) grouped[k] = []

      const metaCols = ['id','part','region_id','majlis_id','region','majlis','month','year','created_at']
      const otherCols = Object.keys(r).filter(c => !metaCols.includes(c))
      const hasAny = otherCols.some(c => r[c] !== null && r[c] !== undefined)
      if (hasAny) {
        grouped[k].push(r)
        continue
      }

      try {
        const { data: rd, error: rdErr } = await supabase.from('report_data').select('details,report_month,report_year').eq('region_id', r.region_id).eq('majlis_id', r.majlis_id).eq('section_key', r.part).limit(1).maybeSingle()
        if (!rdErr && rd && (rd as any).details) {
          const rowLike = { ...r, month: (rd as any).report_month, year: (rd as any).report_year, ...((rd as any).details || {}) }
          grouped[k].push(rowLike)
          continue
        }
      } catch (e) {
        // ignore
      }

      grouped[k].push(r)
    }

    // Known UI sections and fields (kept in sync with components)
    const sectionsMap: Record<string, { title: string; fields: { key: string; label: string; type?: 'number' | 'boolean' }[] }> = {
      tabligh: { title: 'Tabligh', fields: [ { key: 'no_of_1_to_1_meeting', label: 'No. of 1 to 1 meeting' }, { key: 'no_under_tabligh', label: 'No. under tabligh' }, { key: 'no_of_book_stall', label: 'No. of book stall' }, { key: 'no_of_literature_distributed', label: 'No. of literature distributed' }, { key: 'no_of_new_contacts', label: 'No. of new contacts' }, { key: 'no_of_exhibitions', label: 'No. of Exhibitions' }, { key: 'no_of_dain_e_ilallah', label: 'No. of Dain-e-ilallah' }, { key: 'no_of_baiats', label: 'No. of Baiats' }, { key: 'no_of_tabligh_days_held', label: 'No. of Tabligh days held' }, { key: 'no_of_digital_content_created', label: 'No. of Digital content created' }, { key: 'merch_reflector_jackets', label: 'Reflector Jackets' }, { key: 'merch_tshirts', label: 'T-Shirts' }, { key: 'merch_caps', label: 'Caps' }, { key: 'merch_stickers', label: 'Stickers' } ] },
      umumi: { title: 'Umumi', fields: [ { key: 'monthly_report_yes_no', label: 'Monthly report', type: 'boolean' }, { key: 'no_of_amila_meeting', label: 'No. of Amila Meeting' }, { key: 'no_of_general_meeting', label: 'No. of General Meeting' }, { key: 'visited_by_nazm_e_ala_yes_no', label: 'Visited by Nazm-e-Ala', type: 'boolean' } ] },
      talim_ul_quran: { title: 'Talim-ul-Quran', fields: [ { key: 'no_of_talim_ul_quran_held', label: 'No. of Talim-ul-Quran held' }, { key: 'no_of_ansar_attending', label: 'No. of Ansar attending' }, { key: 'avg_no_of_ansar_joining_weekly_quran_class', label: 'Average No. of Ansar joining weekly Quran class' } ] },
      talim: { title: 'Talim', fields: [ { key: 'no_of_ansar_reading_book', label: 'No. of Ansar reading book' }, { key: 'no_of_ansar_participated_in_exam', label: 'No. of Ansar participated in exam' } ] },
      isaar: { title: 'Isaar', fields: [ { key: 'no_of_ansar_visiting_sick', label: 'No. of Ansar visiting sick' }, { key: 'no_of_ansar_visiting_elderly', label: 'No. of Ansar visiting elderly' }, { key: 'no_of_feed_the_hungry_program_held', label: 'No. of Feed the Hungry program held' }, { key: 'no_of_ansar_participated_in_feed_the_hungry', label: 'No. of Ansar participated' } ] },
      sihat: { title: 'Dhahanat & Sihat-e-Jismani', fields: [ { key: 'no_of_ansar_regular_in_exercise', label: 'No. of Ansar regular in exercise' }, { key: 'no_of_ansar_who_owns_bicycle', label: 'No. of Ansar who owns bicycle' } ] },
    }

    // Ensure requested section is present in grouped (empty array if none)
    if (section) {
      if (!grouped[section] || (Array.isArray(grouped[section]) && grouped[section].length === 0)) grouped[section] = []
    }

    // Load pdf-lib at runtime using require via eval to avoid Next's static
    // module resolution during build. If it's not installed, return a helpful
    // JSON error so the page doesn't fail to compile.
    let PDFDocument: any, StandardFonts: any, rgb: any
    try {
      // Use eval('require') to prevent bundlers from statically analyzing the
      // dependency. This will throw if the module isn't present at runtime.
      // eslint-disable-next-line no-eval
      const runtimeRequire: any = eval("typeof require !== 'undefined' ? require : undefined")
      if (!runtimeRequire) throw new Error('require is not available')
      const pdfLib = runtimeRequire('pdf-lib')
      PDFDocument = pdfLib.PDFDocument
      StandardFonts = pdfLib.StandardFonts
      rgb = pdfLib.rgb
    } catch (e) {
      console.error('[export-pdf] pdf-lib load failed', (e as any)?.message || e)
      return NextResponse.json({ error: 'pdf-lib is not installed or could not be loaded at runtime. Run `npm install pdf-lib` and restart the dev server.', detail: (e as any)?.message || String(e) }, { status: 500 })
    }

    const A4_WIDTH = 841.89
    const A4_HEIGHT = 595.28

    const pdfDoc = await PDFDocument.create()
    const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

    // Load logo if present
    let logoBytes: Uint8Array | null = null
    try {
      const logoPath = path.join(process.cwd(), 'public', 'ansar-logo.jpeg')
      if (fs.existsSync(logoPath)) {
        const b = fs.readFileSync(logoPath)
        logoBytes = Uint8Array.from(b)
      }
    } catch (e) {
      logoBytes = null
    }

    // Helper to draw header on a page
    const drawHeader = (page: any, sectionTitle: string) => {
      const { width, height } = page.getSize()
      let topY = height - 36
      if (logoBytes) {
        try {
          const img = pdfDoc.embedJpg ? null : null // placeholder to avoid TS errors
        } catch (_) {}
      }
      // Draw logo if available
    }

    // Iterate grouped sections and render pages
    for (const [part, rows] of Object.entries(grouped)) {
      const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])
      const { width, height } = page.getSize()

      // Render logo centered at top
      let currentY = height - 36
      if (logoBytes) {
        try {
          const image = await pdfDoc.embedJpg(logoBytes)
          const imgWidth = 60
          const imgHeight = (image.height / image.width) * imgWidth
          const imgX = (width - imgWidth) / 2
          page.drawImage(image, { x: imgX, y: currentY - imgHeight, width: imgWidth, height: imgHeight })
          currentY -= imgHeight + 6
        } catch (e) {
          // ignore
        }
      }

      // Organization title
      const org = 'Majlis Ansarullah Kenya'
      const orgSize = 18
      const orgW = timesBold.widthOfTextAtSize(org, orgSize)
      page.drawText(org, { x: (width - orgW) / 2, y: currentY - orgSize, size: orgSize, font: timesBold, color: rgb(0,0,0) })
      currentY -= orgSize + 6

      const sectionTitle = (sectionsMap[part] && sectionsMap[part].title) ? sectionsMap[part].title : (part || 'Other')
      const typeSize = 14
      const typeText = `${sectionTitle} Report`
      const typeW = timesFont.widthOfTextAtSize(typeText, typeSize)
      page.drawText(typeText, { x: (width - typeW) / 2, y: currentY - typeSize, size: typeSize, font: timesFont, color: rgb(0,0,0) })
      currentY -= typeSize + 12

      // If no rows, write 'No data available'
      if (!Array.isArray(rows) || rows.length === 0) {
        const msg = 'No data available for this section.'
        const mW = timesFont.widthOfTextAtSize(msg, 12)
        page.drawText(msg, { x: (width - mW) / 2, y: currentY - 12, size: 12, font: timesFont })
        continue
      }

      // Table columns
      const secDef = sectionsMap[part]
      const fieldDefs = secDef ? secDef.fields : []
      const headers = ['Region', 'Majlis', 'Month', 'Year', ...fieldDefs.map(f => f.label)]
      const colWidths = headers.map(() => Math.floor((width - 80) / headers.length))
      let x = 40
      let y = currentY - 6

      // Draw header row
      headers.forEach((h, i) => {
        page.drawText(h, { x: x + colWidths.slice(0, i).reduce((a,b)=>a+b,0), y: y - 10, size: 10, font: timesBold })
      })
      y -= 18

      // Draw rows
      for (const r of (rows as any[])) {
        const regionName = regionMap[r.region_id] || r.region || ''
        const majlisName = majlisMap[r.majlis_id] || r.majlis || ''
        const base = [regionName, majlisName, String(r.month || r.report_month || ''), String(r.year || r.report_year || '')]
        const otherCols = fieldDefs.map((f) => {
          const uiKey = f.key
          let v: any = undefined
          if (r[uiKey] !== undefined) v = r[uiKey]
          const camel = uiKey.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase())
          if (v === undefined && r[camel] !== undefined) v = r[camel]
          if (v === undefined && r.details && r.details[uiKey] !== undefined) v = r.details[uiKey]
          if (v === undefined) v = ''
          const lowerK = uiKey.toLowerCase()
          const isYesNoField = uiKey.endsWith('_yes_no') || ['monthly_report_yes_no', 'visited_by_nazm_e_ala_yes_no'].includes(uiKey) || ['monthlyreport', 'visitednazmeala'].includes(lowerK)
          if (isYesNoField) {
            if (v === 1 || v === '1' || v === true || String(v).toLowerCase() === 'yes' ) v = 'Yes'
            else if (v === 0 || v === '0' || v === false || String(v).toLowerCase() === 'no') v = 'No'
            else v = String(v ?? '')
          } else if (v !== null && typeof v === 'object') {
            v = JSON.stringify(v)
          }
          return String(v ?? '')
        })

        const rowVals = base.concat(otherCols)
        rowVals.forEach((val, i) => {
          const tx = String(val)
          page.drawText(tx, { x: x + colWidths.slice(0, i).reduce((a,b)=>a+b,0) + 2, y: y - 10, size: 10, font: timesFont })
        })
        y -= 14
        if (y < 40) {
          // new page
          const p2 = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])
          x = 40
          y = A4_HEIGHT - 60
        }
      }
    }

    const pdfBytes = await pdfDoc.save()
    const uint8 = new Uint8Array(pdfBytes)
    const filename = section ? `reports-${section}.pdf` : `reports-all-parts.pdf`
    const encoded = encodeURIComponent(filename)

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`,
        'Content-Length': String(uint8.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[export-pdf] Unexpected error:', (err as any)?.message || err, (err as any)?.stack)
    const body: any = { error: (err as any)?.message || String(err) }
    if ((err as any)?.stack) body.stack = (err as any).stack
    return NextResponse.json(body, { status: 500 })
  }
}
