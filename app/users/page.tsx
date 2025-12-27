"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus, Edit, Trash2 } from "lucide-react"
import { MainNavigation } from "@/components/main-navigation"

const roles = [
  "Tajneed",
  "Maal",
  "Tarbiyyat",
  "Ijtemas",
  "Tabligh",
  "Umumi",
  "Talim-ul-Quran",
  "Talim",
  "Isaar",
  "Dhahanat & Sihat-e-Jismani"
]

interface SubUser {
  id: number
  name: string
  role: string
  username: string
  created_at: string
}

export default function UsersPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<SubUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<SubUser | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    username: "",
    password: ""
  })

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleEdit = (user: SubUser) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      role: user.role,
      username: user.username,
      password: "" // Don't pre-fill password
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete user")
      }

      toast({
        title: "User Deleted",
        description: "Sub-user has been deleted successfully."
      })

      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
      const method = editingUser ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `Failed to ${editingUser ? 'update' : 'create'} user`)
      }

      toast({
        title: editingUser ? "User Updated" : "User Created",
        description: `Sub-user has been ${editingUser ? 'updated' : 'created'} successfully.`
      })

      // Reset form
      setFormData({
        name: "",
        role: "",
        username: "",
        password: ""
      })

      // Hide form and reset editing state
      setShowCreateForm(false)
      setEditingUser(null)

      // Refresh users list
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <MainNavigation />
      <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">Manage sub-users and their access roles</p>
        {!showCreateForm && (
          <div className="mt-4">
            <Button onClick={() => setShowCreateForm(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
        )}
      </div>

      {showCreateForm && (
        <Card className="mb-8 max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{editingUser ? "Edit User" : "User Details"}</CardTitle>
            <CardDescription>{editingUser ? "Update the sub-user details" : "Enter the details for the new sub-user"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password {editingUser && "(leave blank to keep current)"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required={!editingUser}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingUser ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      {editingUser ? "Update User" : "Create User"}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateForm(false)
                  setEditingUser(null)
                  setFormData({ name: "", role: "", username: "", password: "" })
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Existing Users</CardTitle>
          <CardDescription>List of all created sub-users</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No users created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  )
}