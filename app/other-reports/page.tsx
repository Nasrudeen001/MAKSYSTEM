"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OtherReports } from "@/components/other-reports"
import { MainNavigation } from "@/components/main-navigation"

export default function Page() {
  // Check if user is a sub-user
  const isSubUser = typeof window !== 'undefined' && localStorage.getItem("subUser")

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <div>
        {/* Header - only show for admin users */}
        {!isSubUser && (
          <div className="bg-primary/5 border-b">
            <div className="container mx-auto px-4 py-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground">Other Shobas</h1>
                <p className="text-muted-foreground mt-2">Manage and track various Majlis Ansarullah Kenya reports</p>
              </div>
            </div>
          </div>
        )}
        <div className="container mx-auto px-4 py-6">
          <OtherReports />
        </div>
      </div>
    </div>
  )
}
