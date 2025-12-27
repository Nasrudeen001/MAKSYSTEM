import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const supabase = createClient()

    const update: any = {}
    if (body.eventName !== undefined) update.event_name = body.eventName
    if (body.eventLocation !== undefined) update.event_location = body.eventLocation
    if (body.eventStartDate !== undefined) update.event_start_date = body.eventStartDate
    if (body.totalDays !== undefined) update.total_days = Number.parseInt(body.totalDays)
    if (body.isActive !== undefined) update.is_active = !!body.isActive

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase.from("event_settings").update(update).eq("id", id).select("*").single()
    if (error) {
      console.error("Supabase error updating event:", error)
      return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
    }

    return NextResponse.json({ event: data })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const supabase = createClient()

    const { error } = await supabase.from("event_settings").delete().eq("id", id)
    if (error) {
      console.error("Supabase error deleting event:", error)
      return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}


