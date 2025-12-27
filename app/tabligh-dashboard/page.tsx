"use client"

import { RoleDashboard } from "@/components/role-dashboard"
import { MessageSquare, Users, BookOpen, ShoppingBag } from "lucide-react"

export default function TablighDashboardPage() {
  const statsConfig = [
    { key: 'oneToOneMeeting', label: '1-to-1 Meetings', icon: MessageSquare, description: 'Total meetings conducted' },
    { key: 'underTabligh', label: 'Under Tabligh', icon: Users, description: 'People under tabligh' },
    { key: 'bookStall', label: 'Book Stalls', icon: BookOpen, description: 'Total book stalls set up' },
    { key: 'literatureDistributed', label: 'Literature Distributed', icon: BookOpen, description: 'Total literature items' },
    { key: 'newContacts', label: 'New Contacts', icon: Users, description: 'New people contacted' },
    { key: 'exhibitions', label: 'Exhibitions', icon: ShoppingBag, description: 'Total exhibitions held' },
    { key: 'dainEIlallah', label: 'Dain-e-Ilallah', icon: Users, description: 'Total dain-e-ilallah' },
    { key: 'baiats', label: 'Baiats', icon: Users, description: 'Total baiats performed' },
    { key: 'tablighDaysHeld', label: 'Tabligh Days Held', icon: Users, description: 'Total tabligh days' },
    { key: 'digitalContentCreated', label: 'Digital Content', icon: MessageSquare, description: 'Digital content created' },
    { key: 'merchReflectorJackets', label: 'Reflector Jackets', icon: ShoppingBag, description: 'Merchandise jackets' },
    { key: 'merchTShirts', label: 'T-Shirts', icon: ShoppingBag, description: 'Merchandise t-shirts' },
    { key: 'merchCaps', label: 'Caps', icon: ShoppingBag, description: 'Merchandise caps' },
    { key: 'merchStickers', label: 'Stickers', icon: ShoppingBag, description: 'Merchandise stickers' }
  ]

  return (
    <RoleDashboard
      role="Tabligh"
      sectionKey={["tabligh", "tabligh_digital"]}
      title="Tabligh"
      description="Overview of Tabligh activities and achievements"
      statsConfig={statsConfig}
    />
  )
}