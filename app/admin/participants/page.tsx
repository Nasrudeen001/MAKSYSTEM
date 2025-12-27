import { AdminSidebar } from "@/components/admin-sidebar"
import { ParticipantManagement } from "@/components/participant-management"

export default function AdminParticipantsPage() {
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Participant Management</h1>
              <p className="text-muted-foreground">Manage all Members</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <ParticipantManagement />
        </main>
      </div>
    </div>
  )
}
