import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function GET() {
  try {
    const supabase = createClient()
    const { data: users, error } = await supabase
      .from("sub_users")
      .select("id, name, role, username, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching sub-users:", error)
      return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error in GET /api/users:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { name, role, username, password } = await request.json()

    if (!name || !role || !username || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    // Check if username already exists
    const { data: existing } = await supabase
      .from("sub_users")
      .select("id")
      .eq("username", username)
      .single()

    if (existing) {
      return NextResponse.json({ message: "Username already exists" }, { status: 400 })
    }

    // Hash password
    const salt = crypto.randomBytes(16).toString("hex")
    const hash = crypto.scryptSync(password, salt, 64).toString("hex")
    const password_hash = `${salt}:${hash}`

    // Insert user
    const { error } = await supabase
      .from("sub_users")
      .insert({
        name,
        role,
        username,
        password_hash
      })

    if (error) {
      console.error("Error creating sub-user:", error)
      return NextResponse.json({ message: "Failed to create user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User created successfully" })
  } catch (error) {
    console.error("Error in POST /api/users:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}