import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: ReactNode
  color?: 'blue' | 'emerald' | 'red' | 'purple' | 'yellow' | 'orange'
}

const colours: Record<string, string> = {
  blue:    'bg-blue-500/10 text-blue-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  red:     'bg-red-500/10 text-red-400',
  purple:  'bg-purple-500/10 text-purple-400',
  yellow:  'bg-yellow-500/10 text-yellow-400',
  orange:  'bg-orange-500/10 text-orange-400',
}

export function StatCard({ label, value, sub, icon, color = 'blue' }: StatCardProps) {
  return (
    <div className="stadium-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-secondary font-medium">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
          {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colours[color])}>
          {icon}
        </div>
      </div>
    </div>
  )
}
