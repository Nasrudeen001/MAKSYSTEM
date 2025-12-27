import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("majlis").delete().eq("id", params.id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to delete majlis" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting majlis:", error)
    return NextResponse.json({ error: "Failed to delete majlis" }, { status: 500 })
  }
}
