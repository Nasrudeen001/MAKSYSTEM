"use client"

import { RoleDashboard } from "@/components/role-dashboard"
import { Heart, Users } from "lucide-react"

export default function IsaarDashboardPage() {
  const statsConfig = [
    { key: 'ansarVisitingSick', label: 'Visiting Sick', icon: Heart, description: 'Ansar visiting sick people' },
    { key: 'ansarVisitingElderly', label: 'Visiting Elderly', icon: Heart, description: 'Ansar visiting elderly' },
    { key: 'feedHungryProgramHeld', label: 'Feed the Hungry Programs', icon: Users, description: 'Programs held' },
    { key: 'ansarParticipatedFeedHungry', label: 'Participants in Feed Programs', icon: Users, description: 'Ansar participated' }
  ]

  return (
    <RoleDashboard
      role="Isaar"
      sectionKey="isaar"
      title="Isaar"
      description="Overview of social welfare and community service activities"
      statsConfig={statsConfig}
    />
  )
}