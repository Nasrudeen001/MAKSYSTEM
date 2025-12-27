import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const supabase = createClient()

    // Generate a unique majlis code similar to regions
    const baseCode: string = (data.code || data.name || "MAJ").toString().trim().toUpperCase().slice(0, 3)
    let candidate = baseCode
    let suffix = 0
    for (let i = 0; i < 1000; i++) {
      const { data: existing, error: existingError } = await supabase
        .from("majlis")
        .select("id")
        .eq("code", candidate)
        .limit(1)

      if (existingError) {
        console.error("Supabase error checking majlis code uniqueness:", existingError)
        break
      }

      if (!existing || existing.length === 0) {
        break
      }

      suffix += 1
      candidate = `${baseCode}${suffix}`.slice(0, 10)
    }

    const { data: result, error } = await supabase
      .from("majlis")
      .insert({
        name: data.name,
        region_id: data.regionId,
        code: candidate,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to create majlis" }, { status: 500 })
    }

    return NextResponse.json({ success: true, majlis: result })
  } catch (error) {
    console.error("Error creating majlis:", error)
    return NextResponse.json({ error: "Failed to create majlis" }, { status: 500 })
  }
}
