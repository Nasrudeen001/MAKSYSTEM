"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  Award,
  Settings,
  ClipboardList,
  UserCheck,
  FileText,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

const menuItems = [
  {
    title: "Overview",
    icon: Home,
    href: "/admin",
    badge: null,
  },
  {
    title: "Participants",
    icon: Users,
    href: "/admin/participants",
    badge: "8",
  },
  {
    title: "Sessions",
    icon: BookOpen,
    href: "/admin/sessions",
    badge: "5",
  },
  {
    title: "Assessments",
    icon: ClipboardList,
    href: "/admin/assessments",
    badge: "5",
  },
  {
    title: "Performance",
    icon: TrendingUp,
    href: "/admin/performance",
    badge: null,
  },
  {
    title: "Attendance",
    icon: UserCheck,
    href: "/admin/attendance",
    badge: "3",
  },
  {
    title: "Certificates",
    icon: Award,
    href: "/admin/certificates",
    badge: "3",
  },
  // ...removed reports navigation...
  {
    title: "Schedule",
    icon: Calendar,
    href: "/admin/schedule",
    badge: null,
  },
  {
    title: "Documents",
    icon: FileText,
    href: "/admin/documents",
    badge: null,
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
    badge: null,
  },
]

export function AdminSidebar() {
  const [activeItem, setActiveItem] = useState("Overview")

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">MAK Admin</h2>
            <p className="text-xs text-muted-foreground">Management Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
  {menuItems.map((item: any) => {
          const Icon = item.icon
          const isActive = activeItem === item.title
          return (
            <Button
              key={item.title}
              variant={isActive ? "secondary" : "ghost"}
              className={cn("w-full justify-start h-10", isActive && "bg-primary/10 text-primary hover:bg-primary/20")}
              onClick={() => setActiveItem(item.title)}
              asChild
            >
              <Link href={item.href}>
                <Icon className="w-4 h-4 mr-3" />
                <span className="flex-1 text-left">{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            </Button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          <p>MAK 2024</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}
