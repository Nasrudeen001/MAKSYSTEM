import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("event_settings")
      .select("id, event_name, event_location, event_start_date, total_days, is_active, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error fetching events:", error)
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
    }

    return NextResponse.json({ events: data || [] })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}


