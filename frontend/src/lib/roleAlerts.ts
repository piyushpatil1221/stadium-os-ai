/**
 * Role-contextual alert system.
 * The same stadium event surfaces different information depending on who is reading it.
 *
 * Example — Gate A congestion:
 *   fan       → "Gate A is crowded. Use Gate C instead."
 *   volunteer → "Please assist crowd management at Gate A."
 *   staff     → "Deploy two additional security personnel to Gate A."
 *   organizer → "Gate A occupancy has exceeded threshold. Open Gate C and reroute incoming visitors."
 */

export interface ContextualAlert {
  id: string
  event: string          // Machine-readable event key
  severity: 'info' | 'warning' | 'danger' | 'critical'
  zone?: string
  messages: Record<string, string>    // role → message
  actions?: Record<string, string[]>  // role → suggested actions
  timestamp: string
}

export const CONTEXTUAL_ALERTS: ContextualAlert[] = [
  {
    id: 'gate-a-congestion',
    event: 'crowd.congestion',
    severity: 'danger',
    zone: 'Gate A',
    timestamp: new Date(Date.now() - 3 * 60_000).toISOString(),
    messages: {
      fan: '🚶 Gate A is very crowded right now. We recommend using Gate C or Gate E for a faster entry.',
      volunteer: '⚠️ Gate A is becoming crowded. Please move to Gate A and assist with crowd management.',
      staff: '🚨 Gate A occupancy has exceeded 90%. Deploy two additional security personnel immediately.',
      organizer: '📊 Gate A occupancy threshold breached (94%). Recommend opening Gate C, PA announcement, and volunteer redeployment.',
      admin: '📊 Gate A occupancy threshold breached (94%). Recommend opening Gate C, PA announcement, and volunteer redeployment.',
    },
    actions: {
      fan: ['Navigate to Gate C', 'Enable real-time alerts'],
      volunteer: ['Mark yourself available at Gate A', 'View Gate A crowd map'],
      staff: ['Deploy personnel to Gate A', 'Request backup from control room', 'Broadcast PA announcement'],
      organizer: ['Open Gate C', 'Reroute visitor flow', 'Send PA announcement', 'Redeploy volunteers'],
      admin: ['Open Gate C', 'Reroute visitor flow', 'Send PA announcement', 'Redeploy volunteers'],
    },
  },
  {
    id: 'metro-delay',
    event: 'transport.delay',
    severity: 'warning',
    zone: 'Metro Line 2',
    timestamp: new Date(Date.now() - 12 * 60_000).toISOString(),
    messages: {
      fan: '🚇 Metro Line 2 is delayed by 30 minutes. Use Shuttle Route A from Gate B as an alternative.',
      volunteer: '🚇 Metro Line 2 is delayed. Assist fans at Gate B who may need directions to Shuttle Route A.',
      staff: '🚇 Metro Line 2 delay confirmed (30 min). Monitor Gate B for crowd buildup and prepare overflow procedures.',
      organizer: '🚇 Metro Line 2 disruption is causing a 30-min delay. Crowd buildup expected at Gate B. Activate overflow transport protocol.',
      admin: '🚇 Metro Line 2 disruption is causing a 30-min delay. Crowd buildup expected at Gate B. Activate overflow transport protocol.',
    },
    actions: {
      fan: ['Get shuttle directions', 'View transport options'],
      volunteer: ['Move to Gate B shuttle area', 'Assist redirecting fans'],
      staff: ['Monitor Gate B cameras', 'Brief shuttle drivers', 'Post signage'],
      organizer: ['Activate overflow protocol', 'Increase shuttle frequency', 'Send fan notifications'],
      admin: ['Activate overflow protocol', 'Increase shuttle frequency', 'Send fan notifications'],
    },
  },
  {
    id: 'medical-b12',
    event: 'incident.medical',
    severity: 'critical',
    zone: 'Section B12',
    timestamp: new Date(Date.now() - 5 * 60_000).toISOString(),
    messages: {
      fan: '🏥 Medical assistance is active near Section B12. Please keep the area clear and follow staff instructions.',
      volunteer: '🏥 Medical incident in Section B12. Clear a 5-meter radius and direct fans away from the area.',
      staff: '🏥 Medical emergency in Section B12. Medical team deployed. Ensure area is clear and document incident.',
      organizer: '🏥 Medical incident active in Section B12. Response team on-site. Monitor via CCTV. Fan notification sent.',
      admin: '🏥 Medical incident active in Section B12. Response team on-site. Monitor via CCTV. Fan notification sent.',
    },
    actions: {
      fan: ['Find nearest first aid', 'Contact venue info desk'],
      volunteer: ['Clear area in B12', 'Direct fans to Section B14'],
      staff: ['Confirm medical team status', 'Update incident log', 'Restrict B12 access'],
      organizer: ['View live CCTV', 'Track response timeline', 'Brief PR team'],
      admin: ['View live CCTV', 'Track response timeline', 'Brief PR team'],
    },
  },
]

/**
 * Returns alerts filtered and contextualized for the given role.
 */
export function getAlertsForRole(role: string): ContextualAlert[] {
  return CONTEXTUAL_ALERTS.filter(a => a.messages[role])
}

/**
 * Returns the message for a specific alert and role.
 */
export function getAlertMessage(alert: ContextualAlert, role: string): string {
  return alert.messages[role] ?? alert.messages['staff'] ?? ''
}

/**
 * Returns suggested actions for a role.
 */
export function getAlertActions(alert: ContextualAlert, role: string): string[] {
  return alert.actions?.[role] ?? []
}
