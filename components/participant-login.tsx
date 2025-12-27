"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"

export function ParticipantLogin() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    participantId: "",
    email: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate authentication
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simple validation for demo
      if (formData.participantId === "MAK2024001" && formData.email === "ahmed.hassan@email.com") {
        toast({
          title: "Login Successful!",
          description: "Welcome back to your participant dashboard.",
        })
        router.push("/participant")
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid participant ID or email address.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "There was an error logging in. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="participantId">Participant ID</Label>
        <Input
          id="participantId"
          placeholder="e.g., MAK2024001"
          value={formData.participantId}
          onChange={(e) => handleInputChange("participantId", e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use your unique participant ID provided during registration
        </p>
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing In...
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </>
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <p>Demo credentials:</p>
        <p>ID: MAK2024001 | Email: ahmed.hassan@email.com</p>
      </div>
    </form>
  )
}
