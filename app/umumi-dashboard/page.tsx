"use client"

import { RoleDashboard } from "@/components/role-dashboard"
import { Calendar, Users, CheckCircle } from "lucide-react"

export default function UmumiDashboardPage() {
  const statsConfig = [
    { key: 'monthlyReport', label: 'Monthly Reports', icon: CheckCircle, description: 'Monthly reports submitted' },
    { key: 'amilaMeeting', label: 'Amila Meetings', icon: Calendar, description: 'Total amila meetings held' },
    { key: 'generalMeeting', label: 'General Meetings', icon: Users, description: 'Total general meetings held' },
    { key: 'visitedNazmEAla', label: 'Visited by Nazm-e-Ala', icon: CheckCircle, description: 'Visits by Nazm-e-Ala' }
  ]

  return (
    <RoleDashboard
      role="Umumi"
      sectionKey="umumi"
      title="Umumi"
      description="Overview of Umumi activities and administrative functions"
      statsConfig={statsConfig}
    />
  )
}