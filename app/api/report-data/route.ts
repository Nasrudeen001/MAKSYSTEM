import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const supabase = createClient()
  const url = new URL(req.url)
  const section = url.searchParams.get("section")

  const q = supabase.from("report_data").select("*")
  if (section) q.eq("section_key", section)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createClient()
  const body = await req.json()

  // Validate minimal fields
  if (!body.section_key || !body.report_month || !body.report_year) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const payload = {
    region_id: body.region_id || null,
    majlis_id: body.majlis_id || null,
    report_month: body.report_month?.toString(),
    report_year: Number(body.report_year),
    section_key: body.section_key,
    section_title: body.section_title || null,
    details: body.details || {},
  }

  const { data, error } = await (supabase.from("report_data") as any).upsert(payload, { onConflict: "region_id,majlis_id,report_month,report_year,section_key" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
