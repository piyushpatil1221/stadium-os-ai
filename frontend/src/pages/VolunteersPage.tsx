import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, CheckCircle, Clock, Activity, Zap, UserCheck, MapPin, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import type { Volunteer, VolunteerSummary } from '@/types'
import { cn } from '@/lib/utils'

const roleColors: Record<string, string> = {
  crowd_control: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  medical_assist: 'text-red-400 bg-red-500/10 border-red-500/20',
  info_desk: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  accessibility_aid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  transport_guide: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
}

const statusBadge: Record<string, string> = {
  available: 'text-emerald-400',
  busy: 'text-yellow-400',
  break: 'text-gray-400',
  offline: 'text-red-400',
}

export default function VolunteersPage() {
  const queryClient = useQueryClient()
  const { data: volunteers, isLoading } = useQuery<Volunteer[]>({
    queryKey: ['volunteers'],
    queryFn: () => api.get('/volunteers/').then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: summary } = useQuery<VolunteerSummary>({
    queryKey: ['volunteer-summary'],
    queryFn: () => api.get('/volunteers/summary').then(r => r.data),
  })

  const checkIn = useMutation({
    mutationFn: (id: number) => api.patch(`/volunteers/${id}/checkin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] })
      queryClient.invalidateQueries({ queryKey: ['volunteer-summary'] })
    },
  })

  const workloadColor = (score: number) => {
    if (score >= 80) return 'text-red-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-emerald-400'
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Volunteer Operations</h1>
        <p className="text-gray-400 text-sm mt-1">Roster management, check-in, task assignment, and AI workload balancing</p>
      </div>

      {/* AI Recommendation */}
      {summary?.ai_recommendation && (
        <div className="flex items-start gap-3 p-4 stadium-card border-blue-500/20">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Zap size={14} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-400 mb-0.5">AI Workload Balancer</p>
            <p className="text-sm text-gray-300">{summary.ai_recommendation}</p>
          </div>
        </div>
      )}

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: summary?.total ?? '-', color: 'text-white', icon: <Users size={16} /> },
          { label: 'Checked In', value: summary?.checked_in ?? '-', color: 'text-blue-400', icon: <UserCheck size={16} /> },
          { label: 'Available', value: summary?.available ?? '-', color: 'text-emerald-400', icon: <CheckCircle size={16} /> },
          { label: 'Busy', value: summary?.busy ?? '-', color: 'text-yellow-400', icon: <Activity size={16} /> },
          { label: 'On Break', value: summary?.on_break ?? '-', color: 'text-gray-400', icon: <Clock size={16} /> },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="stadium-card p-4 text-center"
          >
            <div className={`flex justify-center mb-2 ${m.color}`}>{m.icon}</div>
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Volunteer roster */}
      <div className="stadium-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary text-sm">Volunteer Roster</h3>
          <span className="text-xs text-gray-500">{volunteers?.length ?? 0} registered</span>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-white/3 animate-pulse rounded-lg" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-secondary border-b border-border-subtle">
                  <th className="text-left pb-3 font-medium">Badge</th>
                  <th className="text-left pb-3 font-medium">Role</th>
                  <th className="text-left pb-3 font-medium">Zone</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-left pb-3 font-medium">Workload</th>
                  <th className="text-left pb-3 font-medium">Skills</th>
                  <th className="text-left pb-3 font-medium">Check In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {volunteers?.map((v) => (
                  <tr key={v.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3 font-mono text-gray-300">{v.badge_number}</td>
                    <td className="py-3">
                      <span className={cn('px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize', roleColors[v.role] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/20')}>
                        {v.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 text-gray-300">
                        <MapPin size={10} className="text-gray-500" />
                        {v.zone}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          v.status === 'available' ? 'bg-emerald-500' :
                          v.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <span className={cn('capitalize', statusBadge[v.status])}>{v.status}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${v.workload_score >= 80 ? 'bg-red-500' : v.workload_score >= 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                            style={{ width: `${v.workload_score}%` }}
                          />
                        </div>
                        <span className={cn('font-medium', workloadColor(v.workload_score))}>{v.workload_score}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {v.languages?.slice(0, 2).map(lang => (
                          <span key={lang} className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-gray-400">{lang}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      {v.is_checked_in ? (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle size={12} /> <span>Done</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => checkIn.mutate(v.id)}
                          disabled={checkIn.isPending}
                          className="text-[11px] px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg transition-colors"
                        >
                          Check In
                        </button>
                      )}
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
