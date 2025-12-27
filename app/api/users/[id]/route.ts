import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { name, role, username, password } = await request.json()
    const userId = parseInt(params.id)

    if (!name || !role || !username) {
      return NextResponse.json({ message: "Name, role, and username are required" }, { status: 400 })
    }

    // Check if username already exists for another user
    const { data: existing } = await supabase
      .from("sub_users")
      .select("id")
      .eq("username", username)
      .neq("id", userId)
      .single()

    if (existing) {
      return NextResponse.json({ message: "Username already exists" }, { status: 400 })
    }

    const updateData: any = { name, role, username }

    // Only update password if provided
    if (password) {
      const salt = crypto.randomBytes(16).toString("hex")
      const hash = crypto.scryptSync(password, salt, 64).toString("hex")
      updateData.password_hash = `${salt}:${hash}`
    }

    const { error } = await supabase
      .from("sub_users")
      .update(updateData)
      .eq("id", userId)

    if (error) {
      console.error("Error updating sub-user:", error)
      return NextResponse.json({ message: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("Error in PUT /api/users/[id]:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const userId = parseInt(params.id)

    const { error } = await supabase
      .from("sub_users")
      .delete()
      .eq("id", userId)

    if (error) {
      console.error("Error deleting sub-user:", error)
      return NextResponse.json({ message: "Failed to delete user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/users/[id]:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}