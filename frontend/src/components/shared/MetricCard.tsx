import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  status?: 'normal' | 'warning' | 'danger' | 'success'
  className?: string
  delay?: number
}

const statusColors: Record<string, string> = {
  normal: 'text-blue-400 bg-blue-500/10',
  warning: 'text-yellow-400 bg-yellow-500/10',
  danger: 'text-red-400 bg-red-500/10',
  success: 'text-emerald-400 bg-emerald-500/10',
}

export default function MetricCard({
  title, value, subtitle, icon: Icon, trend, status = 'normal', className, delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        'stadium-card p-5 hover:border-[hsl(217,32%,28%)] transition-all cursor-default group',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1.5 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn('text-xs font-medium', trend.value >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-600">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110', statusColors[status])}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  )
}
