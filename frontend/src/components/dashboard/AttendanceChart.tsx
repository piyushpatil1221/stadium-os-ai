/**
 * AttendanceChart — Responsive area chart showing fan arrival/departure flow.
 * Extracted from OrganizerDashboard.
 */
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

interface AttendanceDataPoint {
  t: string
  fans: number
}

interface AttendanceChartProps {
  data: AttendanceDataPoint[]
  height?: number
  title?: string
  subtitle?: string
}

export function AttendanceChart({
  data,
  height = 160,
  title = 'Attendance Flow',
  subtitle = 'Fan arrival and departure throughout today',
}: AttendanceChartProps) {
  return (
    <div className="stadium-card p-5">
      <h3 className="text-sm font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-secondary mb-4">{subtitle}</p>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="fanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            formatter={(v: any) => [Number(v ?? 0).toLocaleString()]}
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              fontSize: 11,
            }}
          />
          <Area type="monotone" dataKey="fans" stroke="#3b82f6" strokeWidth={2} fill="url(#fanGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export type { AttendanceDataPoint }
