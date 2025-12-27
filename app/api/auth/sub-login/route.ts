import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 })
    }

    const { data: subUser, error } = await supabase
      .from("sub_users")
      .select("*")
      .eq("username", username)
      .single()

    if (error || !subUser) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const [salt, hash] = subUser.password_hash.split(":")
    const derivedHash = crypto.scryptSync(password, salt, 64).toString("hex")

    if (derivedHash !== hash) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Return user info without password_hash
    const { password_hash, ...user } = subUser
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error in POST /api/auth/sub-login:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}