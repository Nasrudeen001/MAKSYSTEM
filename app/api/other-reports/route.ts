import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const supabase = createClient()
  const url = new URL(req.url)
  const part = url.searchParams.get("part")
  const uiKeyToDb: Record<string, string> = {
    // tabligh
  no_of_1_to_1_meeting: 'oneToOneMeeting',
  no_under_tabligh: 'underTabligh',
  no_of_book_stall: 'bookStall',
  no_of_literature_distributed: 'literatureDistributed',
  no_of_new_contacts: 'newContacts',
  no_of_exhibitions: 'exhibitions',
  no_of_dain_e_ilallah: 'dainEIlallah',
  no_of_baiats: 'baiats',
  no_of_tabligh_days_held: 'tablighDaysHeld',
  no_of_digital_content_created: 'digitalContentCreated',
  merch_reflector_jackets: 'merchReflectorJackets',
  merch_tshirts: 'merchTShirts',
  merch_caps: 'merchCaps',
  merch_stickers: 'merchStickers',
    // umumi
  monthly_report_yes_no: 'monthlyReport',
  no_of_amila_meeting: 'amilaMeeting',
  no_of_general_meeting: 'generalMeeting',
  visited_by_nazm_e_ala_yes_no: 'visitedNazmEAla',
    // talim_ul_quran
  no_of_talim_ul_quran_held: 'talimUlQuranHeld',
  no_of_ansar_attending: 'ansarAttending',
  avg_no_of_ansar_joining_weekly_quran_class: 'avgAnsarJoiningWeeklyQuran',
    // talim
  no_of_ansar_reading_book: 'ansarReadingBook',
  no_of_ansar_participated_in_exam: 'ansarParticipatedExam',
    // isaar
  no_of_ansar_visiting_sick: 'ansarVisitingSick',
  no_of_ansar_visiting_elderly: 'ansarVisitingElderly',
  no_of_feed_the_hungry_program_held: 'feedHungryProgramHeld',
  no_of_ansar_participated_in_feed_the_hungry: 'ansarParticipatedFeedHungry',
    // sihat
    no_of_ansar_regular_in_exercise: 'ansarRegularExercise',
    no_of_ansar_who_owns_bicycle: 'ansarOwnsBicycle',
  }

  // Try reading from `other_reports`. If the DB schema is missing the
  // expected camelCase columns, the select may fail (Supabase/PostgREST
  // will return an error). In that case fall back to reading
  // `report_data` which stores `details` JSONB and can be used as the
  // authoritative view for the UI.
  try {
    const q = supabase.from("other_reports").select("*")
    if (part) q.eq("part", part)
    const { data, error } = await q
    if (!error && Array.isArray(data)) {
      // Transform rows from other_reports but if all the section fields are
      // NULL for a row (common when the normalized camelCase columns haven't
      // been created yet), fall back to the corresponding report_data row's
      // details so the UI still shows the values the user entered.
      const transformed: any[] = []
      for (const r of (data || [])) {
        const details: Record<string, any> = {}
        Object.entries(uiKeyToDb).forEach(([uiKey, dbCol]) => {
          details[uiKey] = r[dbCol] ?? null
        })

        const rowObj = {
          id: r.id,
          part: r.part,
          region_id: r.region_id ?? r.region,
          majlis_id: r.majlis_id ?? r.majlis,
          report_month: r.month,
          report_year: r.year,
          details,
        }

        // If all details are null, try to get the authoritative details from report_data
        const allNull = Object.values(details).every((v) => v === null)
        if (allNull) {
          try {
            let q = supabase
              .from('report_data')
              .select('details')
              .eq('report_month', rowObj.report_month)
              .eq('report_year', rowObj.report_year)
              .eq('section_key', rowObj.part)

            // region_id / majlis_id may be NULL for tabligh_digital records.
            if (rowObj.region_id === null || rowObj.region_id === undefined) q = (q as any).is('region_id', null)
            else q = (q as any).eq('region_id', rowObj.region_id)

            if (rowObj.majlis_id === null || rowObj.majlis_id === undefined) q = (q as any).is('majlis_id', null)
            else q = (q as any).eq('majlis_id', rowObj.majlis_id)

            const { data: rdRows, error: rdErr } = await (q as any).limit(1).maybeSingle()

            if (!rdErr && rdRows && (rdRows as any).details) {
              rowObj.details = (rdRows as any).details
            }
          } catch (e) {
            // ignore and return the original details if the lookup fails
          }
        }

        transformed.push(rowObj)
      }

      return NextResponse.json(transformed, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (error) throw error
  } catch (err) {
    // likely missing columns in other_reports - fall back to report_data
    console.warn('Falling back to report_data read due to error reading other_reports:', (err as any)?.message || err)
    try {
      const q2 = supabase.from('report_data').select('*')
      if (part) q2.eq('section_key', part)
      const { data: rd, error: rdErr } = await q2
      if (rdErr) return NextResponse.json({ error: rdErr.message }, { status: 500 })

      const transformed = (rd || []).map((r: any) => ({
        id: r.id,
        part: r.section_key,
        region_id: r.region_id,
        majlis_id: r.majlis_id,
        report_month: r.report_month,
        report_year: r.report_year,
        details: r.details || {},
      }))

      return NextResponse.json(transformed, { headers: { 'Cache-Control': 'no-store' } })
    } catch (e2) {
      return NextResponse.json({ error: (e2 as any)?.message || String(e2) }, { status: 500 })
    }
  }
}

export async function POST(req: Request) {
  const supabase = createClient()
  const body = await req.json()

  // Basic validation
  if (!body.part || !body.month || !body.year) {
    return NextResponse.json({ error: "Missing required fields: part, month, year" }, { status: 400 })
  }

  // For most parts we require region & majlis. For 'tabligh_digital' they are optional.
  if (body.part !== 'tabligh_digital' && (!body.region || !body.majlis)) {
    return NextResponse.json({ error: "Missing required fields: region, majlis" }, { status: 400 })
  }

  // Lookup region/majlis names so we can populate legacy string columns that may be NOT NULL
  let regionName: string | null = null
  let majlisName: string | null = null
  try {
    const { data: rData, error: rErr } = await supabase.from('regions').select('name').eq('id', body.region).limit(1).maybeSingle()
    if (!rErr && rData) regionName = (rData as any).name
  } catch (e) {
    // ignore lookup failures, we'll still try to insert UUIDs
  }

  try {
    const { data: mData, error: mErr } = await supabase.from('majlis').select('name').eq('id', body.majlis).limit(1).maybeSingle()
    if (!mErr && mData) majlisName = (mData as any).name
  } catch (e) {
    // ignore
  }

  // Map UI keys to DB column names
  const uiToDb: Record<string, string> = {
    // tabligh
  no_of_1_to_1_meeting: 'oneToOneMeeting',
  no_under_tabligh: 'underTabligh',
  no_of_book_stall: 'bookStall',
  no_of_literature_distributed: 'literatureDistributed',
  no_of_new_contacts: 'newContacts',
  no_of_exhibitions: 'exhibitions',
  no_of_dain_e_ilallah: 'dainEIlallah',
  no_of_baiats: 'baiats',
  no_of_tabligh_days_held: 'tablighDaysHeld',
  no_of_digital_content_created: 'digitalContentCreated',
  merch_reflector_jackets: 'merchReflectorJackets',
  merch_tshirts: 'merchTShirts',
  merch_caps: 'merchCaps',
  merch_stickers: 'merchStickers',
    // umumi
  monthly_report_yes_no: 'monthlyReport',
  no_of_amila_meeting: 'amilaMeeting',
  no_of_general_meeting: 'generalMeeting',
  visited_by_nazm_e_ala_yes_no: 'visitedNazmEAla',
    // talim_ul_quran
  no_of_talim_ul_quran_held: 'talimUlQuranHeld',
  no_of_ansar_attending: 'ansarAttending',
  avg_no_of_ansar_joining_weekly_quran_class: 'avgAnsarJoiningWeeklyQuran',
    // talim
  no_of_ansar_reading_book: 'ansarReadingBook',
  no_of_ansar_participated_in_exam: 'ansarParticipatedExam',
    // isaar
  no_of_ansar_visiting_sick: 'ansarVisitingSick',
  no_of_ansar_visiting_elderly: 'ansarVisitingElderly',
  no_of_feed_the_hungry_program_held: 'feedHungryProgramHeld',
  no_of_ansar_participated_in_feed_the_hungry: 'ansarParticipatedFeedHungry',
    // sihat
    no_of_ansar_regular_in_exercise: 'ansarRegularExercise',
    no_of_ansar_who_owns_bicycle: 'ansarOwnsBicycle',
  }
  // Build a full insert object including camelCase columns mapped from UI
  // keys. We'll try inserting the full object first; if the DB reports
  // missing columns we will fall back to inserting the minimal base row.
  const rowFull: any = {
    part: body.part,
    region_id: body.region,
    majlis_id: body.majlis,
    region: regionName ?? null,
    majlis: majlisName ?? null,
    month: body.month,
    year: Number(body.year),
  }

  // Copy any known UI fields into their corresponding DB columns (full attempt)
  Object.keys(body).forEach((k) => {
    if (uiToDb[k]) {
      const dbCol = uiToDb[k]
      if (dbCol === 'monthlyReport' || dbCol === 'visitedNazmEAla') {
        // convert UI boolean-like values to actual booleans for the normalized columns
        const v = body[k]
        const truthy = (v === 1 || v === '1' || String(v).toLowerCase() === 'yes' || String(v).toLowerCase() === 'true')
        const falsy = (v === 0 || v === '0' || String(v).toLowerCase() === 'no' || String(v).toLowerCase() === 'false')
        if (truthy) rowFull[dbCol] = true
        else if (falsy) rowFull[dbCol] = false
        else rowFull[dbCol] = null
      } else {
        rowFull[dbCol] = body[k] === null || body[k] === undefined || body[k] === '' ? null : Number(body[k])
      }
    }
  })

  // Attempt full insert; if it fails due to missing columns, we'll retry
  // with the minimal base row.
  let data: any = null
  let error: any = null
  try {
    const res = await supabase.from("other_reports").insert(rowFull).select("*")
    data = res.data
    error = res.error
    if (error) throw error
  } catch (err) {
  const msg = (err as any)?.message || String(err)
  // Check for known messages that indicate schema mismatch / missing columns.
  // Supabase sometimes returns 'Could not find column ... in the schema cache'
  // so include that text in the detection.
  if (/column .* does not exist/i.test(msg) || /missing column/i.test(msg) || /could not find column/i.test(msg) || /schema cache/i.test(msg)) {
      // Fallback to base row insert
      const rowBase: any = {
        part: body.part,
        region_id: body.region,
        majlis_id: body.majlis,
        region: regionName ?? null,
        majlis: majlisName ?? null,
        month: body.month,
        year: Number(body.year),
      }
      const res2 = await supabase.from("other_reports").insert(rowBase).select("*")
      data = res2.data
      error = res2.error
      if (error) {
        console.error('Supabase insert error for other_reports (fallback):', error)
        return NextResponse.json({ error: error.message, details: error }, { status: 500 })
      }
    } else {
      console.error('Supabase insert error for other_reports (full):', err)
      return NextResponse.json({ error: msg, details: err }, { status: 500 })
    }
  }
  if (error) {
    // Log server-side for debugging and return full error object to the client
    console.error('Supabase insert error for other_reports:', error)
    return NextResponse.json({ error: error.message, details: error }, { status: 500 })
  }

  // Transform inserted rows to client shape (same as GET). Some Supabase
  // responses may not return the inserted rows; in that case construct a
  // best-effort inserted object from the rowFull/rowBase we used for insert.
  let inserted: any[] = []
  if (Array.isArray(data) && data.length > 0) {
    inserted = (data || []).map((r: any) => {
      const details: Record<string, any> = {}
      Object.entries(uiToDb).forEach(([uiKey, dbCol]) => {
        details[uiKey] = r[dbCol] ?? null
      })

      return {
        id: r.id,
        part: r.part,
        region_id: r.region_id ?? r.region,
        majlis_id: r.majlis_id ?? r.majlis,
        report_month: r.month,
        report_year: r.year,
        details,
      }
    })
  } else {
    // Build a fallback inserted object from the rowFull (or rowBase) used.
    // Prefer values from rowFull if present.
    const fallbackRow: any = {
      id: null,
      part: rowFull.part,
      region_id: rowFull.region_id,
      majlis_id: rowFull.majlis_id,
      report_month: rowFull.month,
      report_year: rowFull.year,
    }

    const details: Record<string, any> = {}
    Object.keys(uiToDb).forEach((uiKey) => {
      const dbCol = uiToDb[uiKey]
      if (rowFull[dbCol] !== undefined) {
        // For booleans convert to 'Yes'/'No' for the details view
        if (dbCol === 'monthlyReport' || dbCol === 'visitedNazmEAla') {
          if (rowFull[dbCol] === true) details[uiKey] = 'Yes'
          else if (rowFull[dbCol] === false) details[uiKey] = 'No'
          else details[uiKey] = null
        } else {
          details[uiKey] = rowFull[dbCol] === null || rowFull[dbCol] === undefined ? null : Number(rowFull[dbCol])
        }
      } else if ((body as any)[uiKey] !== undefined) {
        // Fallback to the original body value if the normalized column wasn't present
        const v = (body as any)[uiKey]
        if (dbCol === 'monthlyReport' || dbCol === 'visitedNazmEAla') {
          const truthy = (v === 1 || v === '1' || String(v).toLowerCase() === 'yes' || String(v).toLowerCase() === 'true')
          const falsy = (v === 0 || v === '0' || String(v).toLowerCase() === 'no' || String(v).toLowerCase() === 'false')
          if (truthy) details[uiKey] = 'Yes'
          else if (falsy) details[uiKey] = 'No'
          else details[uiKey] = null
        } else {
          details[uiKey] = v === null || v === undefined || v === '' ? null : Number(v)
        }
      } else {
        details[uiKey] = null
      }
    })

    inserted = [{ ...fallbackRow, details }]
  }

  // Build a details JSON from the incoming UI keys. Restrict keys for
  // tabligh vs tabligh_digital so the two logical sections remain separate.
  const incomingDetails: Record<string, any> = {}
  const allowedKeys = (() => {
    if (body.part === 'tabligh') return [
      'no_of_1_to_1_meeting','no_under_tabligh','no_of_book_stall','no_of_literature_distributed','no_of_new_contacts','no_of_exhibitions','no_of_dain_e_ilallah','no_of_baiats','no_of_tabligh_days_held'
    ]
    if (body.part === 'tabligh_digital') return [
      'no_of_digital_content_created','merch_reflector_jackets','merch_tshirts','merch_caps','merch_stickers'
    ]
    return Object.keys(uiToDb)
  })()

  Object.keys(uiToDb).forEach((uiKey) => {
    if (!allowedKeys.includes(uiKey)) return
    const v = (body as any)[uiKey]
    const dbCol = uiToDb[uiKey]
    if (v === undefined) {
      incomingDetails[uiKey] = null
    } else if (dbCol === 'monthlyReport' || dbCol === 'visitedNazmEAla') {
      // Accept '1'/'0', 'yes'/'no', true/false
      const truthy = (v === 1 || v === '1' || String(v).toLowerCase() === 'yes' || String(v).toLowerCase() === 'true')
      const falsy = (v === 0 || v === '0' || String(v).toLowerCase() === 'no' || String(v).toLowerCase() === 'false')
      if (truthy) incomingDetails[uiKey] = 'Yes'
      else if (falsy) incomingDetails[uiKey] = 'No'
      else incomingDetails[uiKey] = null
    } else {
      incomingDetails[uiKey] = v === null || v === undefined || v === '' ? null : Number(v)
    }
  })

  // If the DB returned rows but the normalized camelCase columns are all
  // null, replace the details with the incoming details so the client sees
  // the values they just submitted immediately.
  inserted.forEach((ins) => {
    try {
      const allNull = ins.details && Object.values(ins.details).every((x: any) => x === null)
      if (allNull) ins.details = incomingDetails
    } catch (e) {
      // ignore
    }
  })

  // Ensure inserted rows include submitted values for the allowed keys
  // even if the normalized other_reports columns are NULL. This merges
  // DB-derived details with incomingDetails preferring DB values when set.
  const allowedKeysForPart = (() => {
    if (body.part === 'tabligh') return [
      'no_of_1_to_1_meeting','no_under_tabligh','no_of_book_stall','no_of_literature_distributed','no_of_new_contacts','no_of_exhibitions','no_of_dain_e_ilallah','no_of_baiats','no_of_tabligh_days_held'
    ]
    if (body.part === 'tabligh_digital') return [
      'no_of_digital_content_created','merch_reflector_jackets','merch_tshirts','merch_caps','merch_stickers'
    ]
    return Object.keys(uiToDb)
  })()

  inserted = inserted.map((ins) => {
    const merged: Record<string, any> = {}
    for (const k of allowedKeysForPart) {
      const dbVal = ins.details ? ins.details[k] : undefined
      merged[k] = (dbVal !== undefined && dbVal !== null) ? dbVal : (incomingDetails[k] !== undefined ? incomingDetails[k] : null)
    }
    // Preserve any other keys the DB returned
    return { ...ins, details: { ...(ins.details || {}), ...merged } }
  })

  try {
    for (let ins of inserted) {
      // Best-effort: try to update camelCase columns on the inserted other_reports
      // row so values entered in the UI appear in the table. First, attempt to
      // read column names from information_schema.columns for 'other_reports'.
      let existingCols: string[] | null = null
      try {
        const { data: cols, error: colsErr } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'other_reports')
        if (!colsErr && Array.isArray(cols)) existingCols = cols.map((c: any) => String(c.column_name))
      } catch (e) {
        // ignore permission errors; we'll attempt an update and handle failures
        existingCols = null
      }

      // Build an update payload containing camelCase columns that exist.
      // Use the inserted row's details if available, otherwise fall back to incomingDetails.
      const srcDetails: Record<string, any> = (ins && ins.details) ? ins.details : incomingDetails
      const updatePayload: Record<string, any> = {}
      Object.keys(uiToDb).forEach((uiKey) => {
        const dbCol = uiToDb[uiKey]
        const val = srcDetails[uiKey]
        // For boolean-like fields, previously details contains 'Yes'/'No' strings;
        // convert them back to booleans for the normalized columns if present.
        if (dbCol === 'monthlyReport' || dbCol === 'visitedNazmEAla') {
          if (val === 'Yes') updatePayload[dbCol] = true
          else if (val === 'No') updatePayload[dbCol] = false
          else updatePayload[dbCol] = null
        } else {
          updatePayload[dbCol] = val === null ? null : Number(val)
        }
      })

      // If we have existingCols, remove any keys not present
      if (existingCols) {
        Object.keys(updatePayload).forEach((k) => {
          if (!existingCols!.includes(k)) delete updatePayload[k]
        })
      }

      // If we don't have an id for the inserted row, try to look it up using
      // the natural composite key (part, region_id, majlis_id, month, year).
      if (!ins.id) {
        try {
          const { data: found, error: foundErr } = await supabase
            .from('other_reports')
            .select('id')
            .eq('part', ins.part)
            .eq('region_id', ins.region_id)
            .eq('majlis_id', ins.majlis_id)
            .eq('month', ins.report_month)
            .eq('year', ins.report_year)
            .limit(1)
            .maybeSingle()

          if (!foundErr && found && (found as any).id) ins.id = (found as any).id
        } catch (e) {
          // ignore
        }
      }

      // If updatePayload has any keys, attempt the UPDATE
      if (Object.keys(updatePayload).length > 0) {
        try {
          const { error: updErr } = await supabase.from('other_reports').update(updatePayload).eq('id', ins.id)
          if (updErr) {
            // If update failed due to missing columns, ignore — the data will still be in report_data
            console.warn('Could not update other_reports with camelCase columns:', updErr.message || updErr)
          }
        } catch (e) {
          console.warn('Unexpected error updating other_reports camelCase columns:', e)
        }
      }

      // For other_reports normalized table, prefer boolean values for the
      // two yes/no fields. We'll build a payload that includes booleans when
      // available (rowFull will already have them if the full insert succeeded).
      const payload = {
        region_id: ins.region_id || null,
        majlis_id: ins.majlis_id || null,
        report_month: ins.report_month,
        report_year: ins.report_year,
        section_key: ins.part,
        section_title: ins.part,
        details: srcDetails,
      }

      const { error: upsertErr } = await supabase.from('report_data').upsert(payload, { onConflict: 'region_id,majlis_id,report_month,report_year,section_key' })
      if (upsertErr) {
        console.error('Failed to upsert report_data for other_reports insert', upsertErr, payload)
      }
    }
  } catch (e) {
    console.error('Unexpected error while syncing to report_data:', e)
  }

  return NextResponse.json(inserted)
}
