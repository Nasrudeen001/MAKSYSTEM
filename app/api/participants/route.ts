import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const supabase = createClient()

    const calculateAge = (dateOfBirth: string): number => {
      if (!dateOfBirth) return 0
      const today = new Date()
      const birthDate = new Date(dateOfBirth)
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age
    }

    // Convert empty string date fields to null
    const safeDateOfBirth = data.dateOfBirth === "" ? null : data.dateOfBirth
    const safeBaiatDate = data.baiatDate === "" ? null : data.baiatDate

    // Determine Nau-Mobaeen based on Baiat date (< 3 years)
    let nauMobaeen: boolean | null = null
    if (data.baiatType === "By Baiat" && safeBaiatDate) {
      const baiatDate = new Date(safeBaiatDate)
      const now = new Date()
      const threeYearsMs = 3 * 365 * 24 * 60 * 60 * 1000
      nauMobaeen = now.getTime() - baiatDate.getTime() < threeYearsMs
    }


    // Validate required fields early to avoid DB constraint failures
    if (!safeDateOfBirth) {
      return NextResponse.json({ error: "dateOfBirth is required" }, { status: 400 })
    }

    // Calculate age and ensure it's positive (DB has CHECK (age > 0))
    const age = calculateAge(safeDateOfBirth)
    if (!age || age <= 0) {
      return NextResponse.json({ error: "Invalid dateOfBirth resulting in non-positive age" }, { status: 400 })
    }

    // Compute next registration number from the current maximum numeric suffix
    // Scan registration_number values in batches to avoid server-side caps.
    let registrationNumber = ""
    try {
      const regRows: any[] = []
      const regBatchSize = 1000
      let regStart = 0
      while (true) {
        const regEnd = regStart + regBatchSize - 1
        const { data: batch, error: batchError } = await supabase
          .from("participants")
          .select("registration_number")

          .range(regStart, regEnd)

        if (batchError) throw batchError
        if (!batch || batch.length === 0) break
        regRows.push(...batch)
        if (batch.length < regBatchSize) break
        regStart += regBatchSize
      }

      let maxNum = 0
      if (regRows && Array.isArray(regRows)) {
        for (const r of regRows) {
          const rn = r.registration_number
          if (!rn || typeof rn !== "string") continue
          // Try to extract numeric suffix regardless of prefix length
          const numPart = rn.replace(/[^0-9]/g, "")
          const n = Number.parseInt(numPart, 10)
          if (!Number.isNaN(n) && n > maxNum) maxNum = n
        }
      }

      const nextNumber = maxNum + 1
      registrationNumber = `MA${String(nextNumber).padStart(3, "0")}`
    } catch (err) {
      console.warn("Failed to compute max registration_number, falling back to count method:", err)
      // Fallback to previous count-based approach if something goes wrong
      const { count, error: countError } = await supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
      if (countError) {
        console.error("Supabase error (count):", countError)
        return NextResponse.json({ error: "Failed to create participant" }, { status: 500 })
      }
      const nextNumber = (count || 0) + 1
      registrationNumber = `MA${String(nextNumber).padStart(3, "0")}`
    }

    const { data: result, error } = await supabase
      .from("participants")
      .insert({
        full_name: data.fullName,
        islamic_names: data.islamicNames,
        date_of_birth: safeDateOfBirth,
        years: Number.parseInt(data.years) || age, // Use calculated age as fallback
        age: age, // ensure age is provided and > 0
        category: data.category,
        mobile_number: data.mobileNumber,
        region: data.region,
        majlis: data.majlis,
        baiat_type: data.baiatType ?? null,
        baiat_date: safeBaiatDate,
        nau_mobaeen: nauMobaeen,
        knows_prayer_full: data.knowsPrayerFull === "Yes" ? true : data.knowsPrayerFull === "No" ? false : null,
        knows_prayer_meaning: data.knowsPrayerMeaning === "Yes" ? true : data.knowsPrayerMeaning === "No" ? false : null,
        can_read_quran: data.canReadQuran === "Yes" ? true : data.canReadQuran === "No" ? false : null,
        owns_bicycle: data.ownsBicycle === "Yes" ? true : data.ownsBicycle === "No" ? false : null,
        status: data.status || 'active',
        registration_number: registrationNumber,
      })
      .select("registration_number, id")
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to create participant" }, { status: 500 })
    }

    // Random questions are now stored on participants; no insert into academic_data here

    return NextResponse.json({
      success: true,
      registrationNumber: result.registration_number,
      participantId: result.id,
    })
  } catch (error) {
    console.error("Error creating participant:", error)
    return NextResponse.json({ error: "Failed to create participant" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()

    // PostgREST / Supabase may enforce a server-side maximum rows per request
    // (commonly 1000). Fetch in batches of 1000 and concatenate until no more
    // rows are returned.
    const allParticipants: any[] = []
    const batchSize = 1000
    let start = 0
    while (true) {
      const end = start + batchSize - 1
      const { data: batch, error } = await supabase
        .from("participants")
        .select("*")
        // Order by registration_number so older MA001.. appear first in the UI
        .order("registration_number", { ascending: true })
        .range(start, end)

      if (error) {
        console.error("Supabase error while fetching participants batch:", error)
        return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 })
      }

      if (!batch || batch.length === 0) break

      allParticipants.push(...batch)

      // If we received fewer than batchSize rows, we've reached the end
      if (batch.length < batchSize) break

      start += batchSize
    }

    // Perform natural sort on `registration_number` so numeric order is respected
    // (e.g., MA1000 should come after MA999). Sort by prefix then numeric suffix.
    const normalize = (rn: any) => {
      if (!rn || typeof rn !== "string") return { prefix: "~", num: Number.POSITIVE_INFINITY }
      const prefixMatch = rn.match(/^[^0-9]+/) // non-digit prefix
      const numMatch = rn.match(/(\d+)$/)
      const prefix = prefixMatch ? prefixMatch[0] : ""
      const num = numMatch ? Number.parseInt(numMatch[0], 10) : Number.POSITIVE_INFINITY
      return { prefix, num }
    }

    allParticipants.sort((a: any, b: any) => {
      const ra = normalize(a.registration_number)
      const rb = normalize(b.registration_number)
      if (ra.prefix < rb.prefix) return -1
      if (ra.prefix > rb.prefix) return 1
      // same prefix: compare numeric suffix
      return (ra.num || 0) - (rb.num || 0)
    })

    return NextResponse.json(allParticipants)
  } catch (error) {
    console.error("Error fetching participants:", error)
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 })
  }
}
