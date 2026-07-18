import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

export function getSeverityColor(severity: string): string {
  const map: Record<string, string> = {
    low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    critical: 'text-red-400 bg-red-400/10 border-red-400/20',
    info: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    warning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    danger: 'text-red-400 bg-red-400/10 border-red-400/20',
  }
  return map[severity] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/20'
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    operational: 'text-emerald-400',
    delayed: 'text-yellow-400',
    disrupted: 'text-red-400',
    closed: 'text-gray-500',
    normal: 'text-emerald-400',
    busy: 'text-yellow-400',
    critical: 'text-red-400',
    open: 'text-blue-400',
    in_progress: 'text-yellow-400',
    resolved: 'text-emerald-400',
    live: 'text-red-400',
    scheduled: 'text-blue-400',
    completed: 'text-gray-400',
  }
  return map[status] ?? 'text-gray-400'
}

export function getIncidentIcon(type: string): string {
  const map: Record<string, string> = {
    medical: '🏥',
    security: '🔒',
    lost_child: '🧒',
    fire: '🔥',
    infrastructure: '🔧',
  }
  return map[type] ?? '⚠️'
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

/**
 * Returns the default post-login route for each user role.
 *
 * Role → Dashboard mapping:
 *   admin      → /dashboard        (full platform overview)
 *   organizer  → /tournament       (tournament operations hub)
 *   staff      → /dashboard        (operations command center)
 *   volunteer  → /volunteers       (volunteer management panel)
 *   fan        → /navigator        (AI wayfinding — fan-facing)
 */
export function getRoleDashboard(role: string): string {
  const map: Record<string, string> = {
    admin: '/dashboard',
    organizer: '/tournament',
    staff: '/dashboard',
    volunteer: '/volunteers',
    fan: '/navigator',
  }
  return map[role] ?? '/dashboard'
}

