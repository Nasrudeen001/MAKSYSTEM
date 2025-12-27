import { MainNavigation } from "@/components/main-navigation"
import { ParticipantManagement } from "@/components/participant-management"

export default function ParticipantsPage() {
  return (
    <div>
      <MainNavigation />
      
      <main className="container mx-auto px-4 py-6">
        <ParticipantManagement />
      </main>
    </div>
  )
}
