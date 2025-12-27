"use client"

import { RoleDashboard } from "@/components/role-dashboard"
import { BookOpen, Users } from "lucide-react"

export default function TalimDashboardPage() {
  const statsConfig = [
    { key: 'ansarReadingBook', label: 'Ansar Reading Books', icon: BookOpen, description: 'Ansar actively reading books' },
    { key: 'ansarParticipatedExam', label: 'Exam Participants', icon: Users, description: 'Ansar participated in exams' }
  ]

  return (
    <RoleDashboard
      role="Talim"
      sectionKey="talim"
      title="Talim"
      description="Overview of educational activities and book reading programs"
      statsConfig={statsConfig}
    />
  )
}