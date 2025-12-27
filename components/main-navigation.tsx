"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, UserPlus, Users, GraduationCap, Settings, BookOpen, MapPin, Menu, X, LogOut, User } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import React from "react"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tajneed",
    href: "/participants",
    icon: Users,
  },
  {
    title: "Maal",
    href: "/contribution",
    icon: BookOpen,
  },
  {
    title: "Tarbiyyat",
    href: "/academics",
    icon: GraduationCap,
  },
  {
    title: "Other Shobas",
    href: "/other-reports",
    icon: BookOpen,
  },
    // ...existing code...
    {
      title: "Region-Majlis",
      href: "/region-majlis",
      icon: MapPin,
    },
  {
    title: "Ijtemas",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Users",
    href: "/users",
    icon: UserPlus,
  },
]

export function MainNavigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const supabase = createClient()
  const [userDisplayName, setUserDisplayName] = useState<string>("")
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [subUser, setSubUser] = useState<any>(null)
  const [dashboardUrl, setDashboardUrl] = useState<string>("/dashboard")
  // removed avatar upload handlers

  const filteredItems = subUser ? [
    {
      title: "Dashboard",
      href: dashboardUrl,
      icon: LayoutDashboard,
    },
    {
      title: subUser.role,
      href: (() => {
        const roleToPage: Record<string, string> = {
          "Tajneed": "/participants",
          "Maal": "/contribution",
          "Tarbiyyat": "/academics",
          "Ijtemas": "/settings",
          "Tabligh": "/other-reports",
          "Umumi": "/other-reports",
          "Talim-ul-Quran": "/other-reports",
          "Talim": "/other-reports",
          "Isaar": "/other-reports",
          "Dhahanat & Sihat-e-Jismani": "/other-reports"
        }
        return roleToPage[subUser.role] || "/other-reports"
      })(),
      icon: (() => {
        const roleToIcon: Record<string, any> = {
          "Tajneed": Users,
          "Maal": BookOpen,
          "Tarbiyyat": GraduationCap,
          "Ijtemas": Settings,
          "Tabligh": BookOpen,
          "Umumi": BookOpen,
          "Talim-ul-Quran": BookOpen,
          "Talim": BookOpen,
          "Isaar": BookOpen,
          "Dhahanat & Sihat-e-Jismani": BookOpen
        }
        return roleToIcon[subUser.role] || BookOpen
      })(),
    }
  ] : navigationItems

  // Load current user name and avatar
  React.useEffect(() => {
    let isMounted = true
    ;(async () => {
      const subUserData = localStorage.getItem("subUser")
      if (subUserData) {
        const user = JSON.parse(subUserData)
        if (isMounted) {
          setSubUser(user)
          setUserDisplayName(user.name)

          // Set dashboard URL based on role
          const roleToDashboard: Record<string, string> = {
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
          setDashboardUrl(roleToDashboard[user.role] || "/dashboard")
        }
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !isMounted) return
      // Try profile first
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle()
      const name = profile?.full_name || profile?.username || user.email || "User"
      if (isMounted) {
        setUserDisplayName(name)
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
      }
    })()
    return () => { isMounted = false }
  }, [])

  const handleLogout = async () => {
    localStorage.removeItem("subUser")
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <div className="bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="relative container mx-auto px-4 py-3 flex flex-col items-center">
          {/* Top-right user menu */}
          <div className="absolute right-4 top-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-full">
                  <Avatar>
                    <AvatarImage src={avatarUrl || "/placeholder-user.jpg"} alt={userDisplayName} />
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{userDisplayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col items-center w-full">
            <Link href={dashboardUrl} className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden mx-auto">
                <Image
                  src="/ansar-logo.jpeg"
                  alt="Majlis Ansarullah Kenya Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-foreground">Majlis Ansarullah Kenya</h1>
                <p className="text-sm text-muted-foreground">Majlis Ansarullah Kenya Management System</p>
              </div>
            </Link>
          </div>
          <div className="flex justify-center w-full mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-2 flex flex-col items-center">
          <div className="hidden md:flex space-x-1 overflow-x-auto justify-center w-full items-center">
            {filteredItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "flex items-center space-x-2 whitespace-nowrap",
                      isActive && "bg-primary text-primary-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Button>
                </Link>
              )
            })}
            {/* user menu moved to top-right */}
          </div>

          <div className={cn("md:hidden", isMobileMenuOpen ? "block" : "hidden")}> 
            <div className="flex flex-col space-y-1 py-2 items-center">
              {filteredItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-center flex items-center space-x-2",
                        isActive && "bg-primary text-primary-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Button>
                  </Link>
                )
              })}
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
