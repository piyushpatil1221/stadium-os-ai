/**
 * DashboardPage — role-aware router.
 *
 * The dashboard a user lands on depends entirely on their role:
 *
 *   fan       → FanDashboard       (navigation, alerts, AI chat)
 *   volunteer → VolunteerDashboard (tasks, zone crowd, report)
 *   staff     → StaffDashboard     (gates, incidents, PA)
 *   organizer → OrganizerDashboard (everything — command center)
 *   admin     → OrganizerDashboard (same as organizer)
 *
 * The /dashboard route is kept so that guards and nav links
 * still work; the actual content is role-switched below.
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import FanDashboard from './dashboards/FanDashboard'
import VolunteerDashboard from './dashboards/VolunteerDashboard'
import StaffDashboard from './dashboards/StaffDashboard'
import OrganizerDashboard from './dashboards/OrganizerDashboard'

export default function DashboardPage() {
  const { user } = useAuth()
  const role = user?.role ?? 'fan'

  switch (role) {
    case 'fan':
      return <FanDashboard />
    case 'volunteer':
      return <VolunteerDashboard />
    case 'staff':
      return <StaffDashboard />
    case 'organizer':
    case 'admin':
      return <OrganizerDashboard />
    default:
      return <Navigate to="/login" replace />
  }
}
