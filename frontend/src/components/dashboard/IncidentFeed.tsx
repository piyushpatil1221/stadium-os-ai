/**
 * IncidentFeed — Compact incident list used in multiple dashboards.
 * Shows the latest incidents with severity badges and timestamps.
 */
import { cn } from '@/lib/utils'
import { ShieldAlert } from 'lucide-react'
import type { Incident } from '@/types'

interface IncidentFeedProps {
  incidents: Incident[]
  limit?: number
  title?: string
}

const severityStyles: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/25',
  high:     'bg-orange-500/15 text-orange-400 border-orange-500/25',
  medium:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  low:      'bg-blue-500/15 text-blue-400 border-blue-500/25',
}

export function IncidentFeed({
  incidents,
  limit = 5,
  title = 'Recent Incidents',
}: IncidentFeedProps) {
  const items = incidents.slice(0, limit)

  return (
    <div className="stadium-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert size={14} className="text-red-400" />
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        <span className="ml-auto text-[10px] text-text-secondary font-medium">
          {incidents.length} total
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-text-secondary text-center py-6">No incidents reported</p>
      ) : (
        <div className="space-y-2">
          {items.map(inc => (
            <div
              key={inc.id}
              className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle hover:border-border-strong transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">{inc.title}</p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {inc.location} · {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded border shrink-0',
                  severityStyles[inc.severity] ?? severityStyles.medium,
                )}
              >
                {inc.severity?.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
