"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Try Supabase auth first
      let emailToUse = identifier
      const isEmail = /@/.test(identifier)
      if (!isEmail) {
        const { data: rpcRows, error: rpcError } = await supabase
          .rpc("resolve_username_email", { p_username: identifier })
        if (rpcError) {
          throw new Error(rpcError.message)
        }
        const rpcEmail = Array.isArray(rpcRows) && rpcRows[0]?.email
        if (!rpcEmail) {
          throw new Error("Username not found")
        }
        emailToUse = rpcEmail as string
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: emailToUse, password })
      if (error || !data.session) {
        throw new Error(error?.message || "Invalid credentials")
      }

      toast({ title: "Login successful", duration: 1000 })
      const target = searchParams.get("redirect") || "/dashboard"
      try {
        router.replace(target)
      } catch (_) {
        window.location.href = target
      }
    } catch (err: any) {
      // Try sub-user login
      try {
        const response = await fetch("/api/auth/sub-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: identifier, password })
        })

        if (response.ok) {
          const { user } = await response.json()
          localStorage.setItem("subUser", JSON.stringify(user))
          toast({ title: "Login successful", duration: 1000 })

          const roleToPage = {
            "Tajneed": "/tajneed-dashboard",
            "Maal": "/maal-dashboard",
            "Tarbiyyat": "/tarbiyyat-dashboard",
            "Ijtemas": "/ijtemas-dashboard",
            "Tabligh": "/tabligh-dashboard",
            "Umumi": "/umumi-dashboard",
            "Talim-ul-Quran": "/talim-ul-quran-dashboard",
            "Talim": "/talim-dashboard",
            "Isaar": "/isaar-dashboard",
            "Dhahanat & Sihat-e-Jismani": "/sihat-dashboard"
          }

          const target = roleToPage[user.role as keyof typeof roleToPage] || "/dashboard"
          try {
            router.replace(target)
          } catch (_) {
            window.location.href = target
          }
          return
        } else {
          const errorData = await response.json()
          throw new Error(errorData.message || "Invalid credentials")
        }
      } catch (subErr: any) {
        toast({ title: "Login failed", description: subErr?.message ?? "Check your credentials", variant: "destructive" })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Image src="/ansar-logo.jpeg" alt="Logo" width={56} height={56} className="rounded" />
          </div>
          <h1 className="text-2xl font-bold">Majlis Ansarullah Kenya</h1>
          <p className="text-sm text-muted-foreground">Admin Sign In</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign in to continue</CardTitle>
            <CardDescription>Use your email and password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="identifier">Email or Username</Label>
                <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {password ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  ) : null}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


