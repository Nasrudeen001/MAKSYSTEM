import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("event_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116: No rows found
      console.error("Supabase error fetching event settings:", error)
      return NextResponse.json({ error: "Failed to fetch event settings" }, { status: 500 })
    }

    return NextResponse.json({ event: data || null })
  } catch (error) {
    console.error("Error fetching event settings:", error)
    return NextResponse.json({ error: "Failed to fetch event settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createClient()

    const { data, error } = await supabase
      .from("event_settings")
      .insert({
        event_name: body.eventName,
        event_location: body.eventLocation,
        event_start_date: body.eventStartDate,
        total_days: Number.parseInt(body.totalDays),
        is_active: true,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Supabase error saving event settings:", error)
      return NextResponse.json({ error: "Failed to save event settings" }, { status: 500 })
    }

    return NextResponse.json({ event: data })
  } catch (error) {
    console.error("Error saving event settings:", error)
    return NextResponse.json({ error: "Failed to save event settings" }, { status: 500 })
  }
}

