import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const supabase = createClient()

    // Normalize inputs
    const yearsNumber = typeof data.years === "string" && data.years !== "" ? Number.parseInt(data.years) : null
    const baiatType: string | null = data.baiatType || null
    const baiatDate: string | null = data.baiatDate === "" ? null : data.baiatDate || null
    const byBaiat = baiatType === "By Baiat"
    const effectiveBaiatDate = byBaiat ? baiatDate : null

    const toBool = (v: unknown): boolean | null => {
      if (v === true || v === "true") return true
      if (v === false || v === "false") return false
      return null
    }

    const { data: result, error } = await supabase
      .from("participants")
      .update({
        full_name: data.fullName,
        islamic_names: data.islamicNames,
        date_of_birth: data.dateOfBirth,
        years: yearsNumber,
        category: data.category,
        mobile_number: data.mobileNumber,
        region: data.region,
        majlis: data.majlis,
        baiat_type: baiatType,
        baiat_date: effectiveBaiatDate,
        knows_prayer_full: toBool(data.knowsPrayerFull),
        knows_prayer_meaning: toBool(data.knowsPrayerMeaning),
        can_read_quran: toBool(data.canReadQuran),
        owns_bicycle: toBool(data.ownsBicycle),
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactPhone,
        dietary_requirements: data.dietaryRequirements,
        medical_conditions: data.medicalConditions,
        status: data.status,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to update participant" }, { status: 500 })
    }

    return NextResponse.json({ success: true, participant: result })
  } catch (error) {
    console.error("Error updating participant:", error)
    return NextResponse.json({ error: "Failed to update participant" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("participants").delete().eq("id", params.id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to delete participant" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting participant:", error)
    return NextResponse.json({ error: "Failed to delete participant" }, { status: 500 })
  }
}
