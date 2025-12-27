import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    const { data: regions, error: regionsError } = await supabase.from("regions").select("*").order("name")

    if (regionsError) {
      console.error("Supabase regions error:", regionsError)
      return NextResponse.json({ error: "Failed to fetch regions" }, { status: 500 })
    }

    const { data: majlis, error: majlisError } = await supabase.from("majlis").select("*")

    if (majlisError) {
      console.error("Supabase majlis error:", majlisError)
      return NextResponse.json({ error: "Failed to fetch majlis" }, { status: 500 })
    }

    // Group majlis by region
    const regionsWithMajlis = regions.map((region) => ({
      ...region,
      majlis: majlis.filter((m) => m.region_id === region.id),
    }))

    return NextResponse.json(regionsWithMajlis)
  } catch (error) {
    console.error("Error fetching regions:", error)
    return NextResponse.json({ error: "Failed to fetch regions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const supabase = createClient()

    // Generate a unique region code (avoid collisions on 3-letter codes)
    const baseCode: string = (data.code || data.name || "REG").toString().trim().toUpperCase().slice(0, 3)
    let candidate = baseCode
    let suffix = 0
    // Check existing codes and append numeric suffix until unique
    // Note: Using case-insensitive equality via ILIKE-like behavior is not available directly; rely on exact match
    // and the fact codes are stored in uppercase in this API
    // Guard loop to avoid infinite loops
    for (let i = 0; i < 1000; i++) {
      const { data: existing, error: existingError } = await supabase
        .from("regions")
        .select("id")
        .eq("code", candidate)
        .limit(1)

      if (existingError) {
        console.error("Supabase error checking code uniqueness:", existingError)
        break
      }

      if (!existing || existing.length === 0) {
        break
      }

      suffix += 1
      candidate = `${baseCode}${suffix}`.slice(0, 10)
    }

    const { data: result, error } = await supabase
      .from("regions")
      .insert({
        name: data.name,
        code: candidate,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to create region" }, { status: 500 })
    }

    return NextResponse.json({ success: true, region: result })
  } catch (error) {
    console.error("Error creating region:", error)
    return NextResponse.json({ error: "Failed to create region" }, { status: 500 })
  }
}
