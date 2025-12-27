"use client"

import { RoleDashboard } from "@/components/role-dashboard"
import { BookOpen, Users } from "lucide-react"

export default function TalimUlQuranDashboardPage() {
  const statsConfig = [
    { key: 'talimUlQuranHeld', label: 'Talim-ul-Quran Sessions', icon: BookOpen, description: 'Total sessions held' },
    { key: 'ansarAttending', label: 'Ansar Attending', icon: Users, description: 'Total ansar attending' },
    { key: 'avgAnsarJoiningWeeklyQuran', label: 'Weekly Quran Class', icon: Users, description: 'Average ansar joining weekly class' }
  ]

  return (
    <RoleDashboard
      role="Talim-ul-Quran"
      sectionKey="talim_ul_quran"
      title="Talim-ul-Quran"
      description="Overview of Quran education and learning activities"
      statsConfig={statsConfig}
    />
  )
}