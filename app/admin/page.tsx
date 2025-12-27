import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminOverview } from "@/components/admin-overview"
import { Button } from "@/components/ui/button"
import { Settings, Bell, User } from "lucide-react"
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"

export default function AdminPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        {/* Collapsible/Offcanvas sidebar on mobile via Sidebar component */}
        <Sidebar className="md:block">
          <AdminSidebar />
        </Sidebar>
        <SidebarInset>
          {/* Admin Header */}
          <header className="border-b border-border bg-card px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Sidebar trigger visible on mobile */}
                <div className="md:hidden">
                  <SidebarTrigger />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">Admin Dashboard</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">Majlis Ansarullah Kenya Management System</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:space-x-4">
                <Button variant="outline" size="sm">
                  <Bell className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Notifications</span>
                </Button>
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  <User className="w-4 h-4 mr-2" />
                  Admin Profile
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <AdminOverview />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
