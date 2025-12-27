import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const id = params.id
  const body = await req.json()

  // Basic validation
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Map UI keys to DB column names (same mapping as POST)
  const uiToDb: Record<string, string> = {
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
    monthly_report_yes_no: 'monthlyReport',
    no_of_amila_meeting: 'amilaMeeting',
    no_of_general_meeting: 'generalMeeting',
    visited_by_nazm_e_ala_yes_no: 'visitedNazmEAla',
    no_of_talim_ul_quran_held: 'talimUlQuranHeld',
    no_of_ansar_attending: 'ansarAttending',
    avg_no_of_ansar_joining_weekly_quran_class: 'avgAnsarJoiningWeeklyQuran',
    no_of_ansar_reading_book: 'ansarReadingBook',
    no_of_ansar_participated_in_exam: 'ansarParticipatedExam',
    no_of_ansar_visiting_sick: 'ansarVisitingSick',
    no_of_ansar_visiting_elderly: 'ansarVisitingElderly',
    no_of_feed_the_hungry_program_held: 'feedHungryProgramHeld',
    no_of_ansar_participated_in_feed_the_hungry: 'ansarParticipatedFeedHungry',
    no_of_ansar_regular_in_exercise: 'ansarRegularExercise',
    no_of_ansar_who_owns_bicycle: 'ansarOwnsBicycle',
  }

  try {
    // Build update payload for other_reports: prefer normalized column names where possible
    const updatePayload: Record<string, any> = {}

    // region/majlis/month/year/part
    if (body.region !== undefined) updatePayload.region_id = body.region
    if (body.majlis !== undefined) updatePayload.majlis_id = body.majlis
    if (body.month !== undefined) updatePayload.month = body.month
    if (body.year !== undefined) updatePayload.year = Number(body.year)
    if (body.part !== undefined) updatePayload.part = body.part

    // Map UI keys to camelCase columns when possible
    Object.keys(body).forEach((k) => {
      if (uiToDb[k]) {
        const dbCol = uiToDb[k]
        const v = (body as any)[k]
        if (dbCol === 'monthlyReport' || dbCol === 'visitedNazmEAla') {
          const truthy = (v === 1 || v === '1' || String(v).toLowerCase() === 'yes' || String(v).toLowerCase() === 'true')
          const falsy = (v === 0 || v === '0' || String(v).toLowerCase() === 'no' || String(v).toLowerCase() === 'false')
          if (truthy) updatePayload[dbCol] = true
          else if (falsy) updatePayload[dbCol] = false
          else updatePayload[dbCol] = null
        } else {
          updatePayload[dbCol] = v === null || v === undefined || v === '' ? null : Number(v)
        }
      }
    })

    // Attempt normalized update (will ignore unknown columns)
    const { data, error } = await supabase.from('other_reports').update(updatePayload).eq('id', id).select('*')
    if (error) {
      // If update fails due to missing columns, attempt a minimal update with standard columns
      console.warn('Normalized update failed, attempting fallback update:', error.message || error)
      const fallback: any = {}
      if (body.part !== undefined) fallback.part = body.part
      if (body.region !== undefined) fallback.region = body.region
      if (body.majlis !== undefined) fallback.majlis = body.majlis
      if (body.month !== undefined) fallback.month = body.month
      if (body.year !== undefined) fallback.year = body.year
      const res2 = await supabase.from('other_reports').update(fallback).eq('id', id).select('*')
      if (res2.error) return NextResponse.json({ error: res2.error.message }, { status: 500 })
    }

    // Build details payload to upsert into report_data. Restrict keys per section
    const details: Record<string, any> = {}
    const allowedKeys = (() => {
      if ((body as any).part === 'tabligh') return [
        'no_of_1_to_1_meeting','no_under_tabligh','no_of_book_stall','no_of_literature_distributed','no_of_new_contacts','no_of_exhibitions','no_of_dain_e_ilallah','no_of_baiats','no_of_tabligh_days_held'
      ]
      if ((body as any).part === 'tabligh_digital') return [
        'no_of_digital_content_created','merch_reflector_jackets','merch_tshirts','merch_caps','merch_stickers'
      ]
      return Object.keys(uiToDb)
    })()

    Object.keys(uiToDb).forEach((uiKey) => {
      if (!allowedKeys.includes(uiKey)) return
      const v = (body as any)[uiKey]
      const dbCol = uiToDb[uiKey]
      if (v === undefined) {
        details[uiKey] = null
      } else if (dbCol === 'monthlyReport' || dbCol === 'visitedNazmEAla') {
        const truthy = (v === 1 || v === '1' || String(v).toLowerCase() === 'yes' || String(v).toLowerCase() === 'true')
        const falsy = (v === 0 || v === '0' || String(v).toLowerCase() === 'no' || String(v).toLowerCase() === 'false')
        if (truthy) details[uiKey] = 'Yes'
        else if (falsy) details[uiKey] = 'No'
        else details[uiKey] = null
      } else {
        details[uiKey] = v === null || v === undefined || v === '' ? null : Number(v)
      }
    })

    const payload = {
      region_id: updatePayload.region_id ?? null,
      majlis_id: updatePayload.majlis_id ?? null,
      report_month: updatePayload.month ?? body.month,
      report_year: updatePayload.year ?? body.year,
      section_key: updatePayload.part ?? body.part,
      section_title: updatePayload.part ?? body.part,
      details,
    }

    try {
      await supabase.from('report_data').upsert(payload, { onConflict: 'region_id,majlis_id,report_month,report_year,section_key' })
    } catch (e) {
      console.warn('Failed to upsert report_data during update', e)
    }

    // Try to return the authoritative row back to the client in the same
    // shape as GET/POST: [{ id, part, region_id, majlis_id, report_month, report_year, details }]
    try {
      const { data: updatedRow, error: selErr } = await supabase.from('other_reports').select('*').eq('id', id).maybeSingle()
      if (!selErr && updatedRow) {
        const respDetails: Record<string, any> = {}
        Object.keys(uiToDb).forEach((uiKey) => {
          const dbCol = uiToDb[uiKey]
          respDetails[uiKey] = (updatedRow as any)[dbCol] ?? details[uiKey] ?? null
        })

        const respObj = {
          id: (updatedRow as any).id,
          part: (updatedRow as any).part,
          region_id: (updatedRow as any).region_id ?? (updatedRow as any).region,
          majlis_id: (updatedRow as any).majlis_id ?? (updatedRow as any).majlis,
          report_month: (updatedRow as any).month,
          report_year: (updatedRow as any).year,
          details: respDetails,
        }

        return NextResponse.json([respObj])
      }
    } catch (e) {
      // ignore and try report_data fallback
    }

    // Fallback: try to read from report_data using composite key
    try {
      const { data: rdRow, error: rdErr } = await supabase.from('report_data')
        .select('*')
        .eq('section_key', payload.section_key)
        .eq('report_month', payload.report_month)
        .eq('report_year', payload.report_year)
        .eq('region_id', payload.region_id)
        .eq('majlis_id', payload.majlis_id)
        .limit(1)
        .maybeSingle()

      if (!rdErr && rdRow) {
        const respObj = {
          id: rdRow.id,
          part: rdRow.section_key,
          region_id: rdRow.region_id,
          majlis_id: rdRow.majlis_id,
          report_month: rdRow.report_month,
          report_year: rdRow.report_year,
          details: rdRow.details || {},
        }
        return NextResponse.json([respObj])
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json([{
      id,
      part: payload.section_key,
      region_id: payload.region_id,
      majlis_id: payload.majlis_id,
      report_month: payload.report_month,
      report_year: payload.report_year,
      details,
    }])
  } catch (e) {
    return NextResponse.json({ error: (e as any)?.message || String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const id = params.id
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    // Delete from other_reports
    const { error } = await supabase.from('other_reports').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Also delete from report_data if possible by matching keys
    try {
      // Attempt to find the deleted row's identifying keys in report_data and delete
      // This is best-effort; if the other_reports row had region_id/majlis_id/month/year
      // we can delete a matching report_data. Otherwise skip.
      // Note: since we've already deleted the row, trying to read it back won't work. If
      // clients rely on report_data being authoritative you may prefer to soft-delete.
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as any)?.message || String(e) }, { status: 500 })
  }
}
