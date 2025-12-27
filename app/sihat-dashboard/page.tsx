"use client"

import { RoleDashboard } from "@/components/role-dashboard"
import { Activity, Users } from "lucide-react"

export default function SihatDashboardPage() {
  const statsConfig = [
    { key: 'ansarRegularInExercise', label: 'Regular Exercise', icon: Activity, description: 'Ansar regular in exercise' },
    { key: 'ansarWhoOwnsBicycle', label: 'Bicycle Owners', icon: Users, description: 'Ansar who own bicycles' }
  ]

  return (
    <RoleDashboard
      role="Dhahanat & Sihat-e-Jismani"
      sectionKey="sihat"
      title="Dhahanat & Sihat-e-Jismani"
      description="Overview of physical health and fitness activities"
      statsConfig={statsConfig}
    />
  )
}