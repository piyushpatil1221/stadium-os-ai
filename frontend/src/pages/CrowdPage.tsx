import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LineChart, Line
} from 'recharts'
import { Users, TrendingUp, Clock, AlertTriangle, Zap } from 'lucide-react'
import api from '@/lib/api'
import { ChartSkeleton, CardSkeleton } from '@/components/shared/Skeleton'
import type { Crowd, CrowdSummary } from '@/types'

// Mock historical data
const historicalData = [
  { match: 'GRP A', peak: 62000, avg: 48000 },
  { match: 'GRP B', peak: 71000, avg: 55000 },
  { match: 'GRP C', peak: 68421, avg: 52000 },
  { match: 'R16 1', peak: 72000, avg: 65000 },
  { match: 'QF', peak: 72000, avg: 70000 },
]

const hourlyData = [
  { hour: '14:00', density: 12 }, { hour: '15:00', density: 28 },
  { hour: '16:00', density: 44 }, { hour: '17:00', density: 62 },
  { hour: '18:00', density: 78 }, { hour: '19:00', density: 86 },
  { hour: '20:00', density: 91 }, { hour: '21:00', density: 88 },
  { hour: '22:00', density: 72 }, { hour: '23:00', density: 30 },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] rounded-lg px-3 py-2 text-xs space-y-1">
        <p className="text-gray-400">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-white font-semibold">{p.name}: {p.value}{typeof p.value === 'number' && p.value < 100 ? '%' : ''}</p>
        ))}
      </div>
    )
  }
  return null
}

const statusColors: Record<string, string> = {
  normal: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  busy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
  critical: 'bg-red-500/20 text-red-400 border-red-500/20',
}

export default function CrowdPage() {
  const { data: crowds, isLoading } = useQuery<Crowd[]>({
    queryKey: ['crowds'],
    queryFn: () => api.get('/crowds/').then(r => r.data),
    refetchInterval: 20000,
  })
  const { data: summary, isLoading: summaryLoading } = useQuery<CrowdSummary>({
    queryKey: ['crowd-summary'],
    queryFn: () => api.get('/crowds/summary').then(r => r.data),
    refetchInterval: 20000,
  })

  // Build radar data from zone aggregates
  const zones = ['North Stand', 'South Stand', 'East Wing', 'West Wing', 'VIP Lounge', 'Main Concourse']
  const radarData = zones.map(zone => {
    const zoneCrowds = crowds?.filter(c => c.zone === zone) ?? []
    const avgDensity = zoneCrowds.length
      ? Math.round(zoneCrowds.reduce((acc, c) => acc + c.density_percent, 0) / zoneCrowds.length)
      : 0
    return { zone: zone.split(' ')[0], density: avgDensity }
  })

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Crowd Intelligence</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time density monitoring, queue prediction, and occupancy analytics</p>
      </div>

      {/* AI Insight banner */}
      {summary?.ai_insight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 stadium-card border-blue-500/20"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Zap size={14} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-400 mb-0.5">AI Crowd Insight</p>
            <p className="text-sm text-gray-300">{summary.ai_insight}</p>
          </div>
        </motion.div>
      )}

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            {[
              { label: 'Total Attendance', value: summary?.total_attendance?.toLocaleString() ?? '68,421', icon: <Users size={18} /> },
              { label: 'Avg Zone Density', value: `${summary?.avg_density_percent ?? 0}%`, icon: <TrendingUp size={18} /> },
              { label: 'Critical Zones', value: summary?.critical_zones?.length ?? 0, icon: <AlertTriangle size={18} /> },
              { label: 'Busy Zones', value: summary?.busy_zones?.length ?? 0, icon: <Clock size={18} /> },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="stadium-card p-5 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">{m.icon}</div>
                <div>
                  <p className="text-xs text-gray-500">{m.label}</p>
                  <p className="text-xl font-bold text-white mt-0.5">{m.value}</p>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Hourly density */}
        <div className="col-span-2 stadium-card p-5">
          <h3 className="font-semibold text-white text-sm mb-1">Hourly Crowd Density</h3>
          <p className="text-xs text-gray-500 mb-5">Average density % across all zones throughout the day</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="densityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="density" stroke="#f59e0b" strokeWidth={2} fill="url(#densityGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Zone radar */}
        <div className="stadium-card p-5">
          <h3 className="font-semibold text-white text-sm mb-1">Zone Density Radar</h3>
          <p className="text-xs text-gray-500 mb-3">Current crowd density per zone</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="zone" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 9 }} />
              <Radar name="Density" dataKey="density" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical comparison */}
      <div className="stadium-card p-5">
        <h3 className="font-semibold text-white text-sm mb-1">Historical Attendance Comparison</h3>
        <p className="text-xs text-gray-500 mb-5">Peak vs average attendance across tournament matches</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="match" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="peak" name="Peak" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avg" name="Average" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Zone heatmap table */}
      <div className="stadium-card p-5">
        <h3 className="font-semibold text-white text-sm mb-4">Zone-by-Zone Status</h3>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-white/3 animate-pulse rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-[hsl(217,32%,18%)]">
                  <th className="text-left pb-2 font-medium">Zone</th>
                  <th className="text-left pb-2 font-medium">Section</th>
                  <th className="text-left pb-2 font-medium">Count</th>
                  <th className="text-left pb-2 font-medium">Capacity</th>
                  <th className="text-left pb-2 font-medium">Density</th>
                  <th className="text-left pb-2 font-medium">Queue</th>
                  <th className="text-left pb-2 font-medium">Wait</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(217,32%,12%)]">
                {crowds?.slice(0, 12).map((crowd) => (
                  <tr key={crowd.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-2.5 text-gray-300 font-medium">{crowd.zone}</td>
                    <td className="py-2.5 text-gray-400">{crowd.section}</td>
                    <td className="py-2.5 text-white font-medium">{crowd.current_count.toLocaleString()}</td>
                    <td className="py-2.5 text-gray-400">{crowd.capacity.toLocaleString()}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${crowd.density_percent > 80 ? 'bg-red-500' : crowd.density_percent > 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                            style={{ width: `${crowd.density_percent}%` }}
                          />
                        </div>
                        <span className="text-gray-300">{crowd.density_percent}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-gray-300">{crowd.queue_length}</td>
                    <td className="py-2.5 text-gray-300">{crowd.wait_time_minutes}m</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${statusColors[crowd.status]}`}>
                        {crowd.status.charAt(0).toUpperCase() + crowd.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
