import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const supabase = createClient()

    const { data: result, error } = await supabase
      .from("regions")
      .update({
        name: data.name,
        code: data.code || data.name.substring(0, 3).toUpperCase(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to update region" }, { status: 500 })
    }

    return NextResponse.json({ success: true, region: result })
  } catch (error) {
    console.error("Error updating region:", error)
    return NextResponse.json({ error: "Failed to update region" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // Check if region has any majlis
    const { data: majlis, error: majlisError } = await supabase.from("majlis").select("id").eq("region_id", params.id)

    if (majlisError) {
      console.error("Supabase error:", majlisError)
      return NextResponse.json({ error: "Failed to check region dependencies" }, { status: 500 })
    }

    if (majlis && majlis.length > 0) {
      return NextResponse.json({ error: "Cannot delete region with existing majlis" }, { status: 400 })
    }

    const { error } = await supabase.from("regions").delete().eq("id", params.id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to delete region" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting region:", error)
    return NextResponse.json({ error: "Failed to delete region" }, { status: 500 })
  }
}
