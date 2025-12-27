import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const explicitEventId = searchParams.get("eventId")
    const supabase = createClient()
    let currentEvent: { id: string; event_name?: string } | null = null

    if (explicitEventId) {
      const { data, error } = await supabase
        .from("event_settings")
        .select("id, event_name")
        .eq("id", explicitEventId)
        .single()
      if (error && error.code !== "PGRST116") {
        console.error("Supabase error fetching event by id:", error)
        return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
      }
      currentEvent = data
    } else {
      const { data, error: eventErr } = await supabase
        .from("event_settings")
        .select("id, event_name")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (eventErr && eventErr.code !== "PGRST116") {
        console.error("Supabase error fetching active event", eventErr)
        return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
      }
      currentEvent = data
    }

    if (!currentEvent) return NextResponse.json({ attendees: [], event: null })

    const { data: attendees, error } = await supabase
      .from("event_attendance")
      .select("participant_id, created_at, participants ( full_name, islamic_names, category, mobile_number, region, majlis )")
      .eq("event_id", currentEvent.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error fetching attendance:", error)
      return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
    }

    return NextResponse.json({ attendees, event: currentEvent })
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createClient()

    // Use explicit eventId if provided; otherwise find active
    let currentEventId: string | null = body.eventId || null
    if (!currentEventId) {
      const { data: currentEvent } = await supabase
        .from("event_settings")
        .select("id")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      currentEventId = currentEvent?.id || null
    }

    if (!currentEventId) {
      // Auto-create a minimal active event if none exists
      const today = new Date().toISOString().slice(0, 10)
      const { data: created, error: createErr } = await supabase
        .from("event_settings")
        .insert({
          event_name: "Active Event",
          event_location: "N/A",
          event_start_date: today,
          total_days: 1,
          is_active: true,
        })
        .select("id")
        .single()

      if (createErr) {
        console.error("Supabase error creating default event:", createErr)
        return NextResponse.json({ error: "No active event configured" }, { status: 400 })
      }
      currentEventId = created.id
    }

    const { data, error } = await supabase
      .from("event_attendance")
      .upsert(
        {
          event_id: currentEventId!,
          participant_id: body.participantId,
          present: true,
        },
        { onConflict: "event_id,participant_id" },
      )
      .select("*")
      .single()

    if (error) {
      console.error("Supabase error marking attendance:", error)
      return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 })
    }

    return NextResponse.json({ attendance: data })
  } catch (error) {
    console.error("Error marking attendance:", error)
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get("participantId")
    const explicitEventId = searchParams.get("eventId")
    if (!participantId) return NextResponse.json({ error: "participantId required" }, { status: 400 })

    const supabase = createClient()

    let currentEventId: string | null = explicitEventId || null
    if (!currentEventId) {
      const { data: currentEvent } = await supabase
        .from("event_settings")
        .select("id")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      currentEventId = currentEvent?.id || null
    }

    if (!currentEventId) return NextResponse.json({ success: true })

    const { error } = await supabase
      .from("event_attendance")
      .delete()
      .eq("event_id", currentEventId)
      .eq("participant_id", participantId)

    if (error) {
      console.error("Supabase error removing attendance:", error)
      return NextResponse.json({ error: "Failed to remove attendance" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing attendance:", error)
    return NextResponse.json({ error: "Failed to remove attendance" }, { status: 500 })
  }
}

