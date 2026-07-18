import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ShieldAlert, Users, Monitor, Megaphone, Stethoscope,
  Plus, Zap, TrendingUp, Activity, CheckCircle, Clock, AlertCircle
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '@/providers/AuthProvider'
import { getAlertsForRole, getAlertMessage, getAlertActions } from '@/lib/roleAlerts'
import type { Crowd } from '@/types'
import api from '@/lib/api'
import { cn, getSeverityColor, timeAgo } from '@/lib/utils'

// Gate crowd mock data (staff can see entry analytics)
const gateData = [
  { gate: 'Gate A', count: 1840, capacity: 2000 },
  { gate: 'Gate B', count: 1650, capacity: 2000 },
  { gate: 'Gate C', count: 920, capacity: 1200 },
  { gate: 'Gate D', count: 1100, capacity: 1500 },
  { gate: 'Gate E', count: 480, capacity: 800 },
]

const ANNOUNCEMENT_TEMPLATES = [
  'Please proceed to your allocated gate. Gates are now open.',
  'Attention: Medical assistance is available at Section B12. Please keep the area clear.',
  'Post-match transport: Metro Line 1 (Gate A) is the fastest exit. Shuttles depart Gate B every 8 minutes.',
  'Gate A is currently at capacity. Please use Gate C for a faster entry experience.',
]

export default function StaffDashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const alerts = getAlertsForRole('staff')
  const [announcement, setAnnouncement] = useState('')
  const [sentAnnouncement, setSentAnnouncement] = useState<string | null>(null)
  const [showIncidentForm, setShowIncidentForm] = useState(false)

  const { data: crowds } = useQuery<Crowd[]>({
    queryKey: ['crowds'],
    queryFn: () => api.get('/crowds/').then(r => r.data),
    refetchInterval: 20000,
  })

  const totalAttendance = crowds?.reduce((sum, c) => sum + c.current_count, 0) ?? 68421
  const criticalZones = crowds?.filter(c => c.density_percent > 85) ?? []

  const sendAnnouncement = () => {
    if (!announcement.trim()) return
    setSentAnnouncement(announcement)
    setAnnouncement('')
    setTimeout(() => setSentAnnouncement(null), 5000)
  }

  return (
    <div className="p-5 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Operations Center</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {user?.full_name} · <span className="text-blue-400">Stadium Staff</span>
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-white">USA 2 – 1 MEX</span>
            <span className="text-xs text-red-400">67'</span>
          </div>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Attendance', value: totalAttendance.toLocaleString(), icon: <Users size={16} />, color: 'text-blue-400 bg-blue-500/10', status: 'normal' },
          { label: 'Critical Zones', value: criticalZones.length, icon: <AlertCircle size={16} />, color: criticalZones.length > 0 ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10', status: criticalZones.length > 0 ? 'danger' : 'normal' },
          { label: 'Active Incidents', value: 4, icon: <ShieldAlert size={16} />, color: 'text-orange-400 bg-orange-500/10', status: 'warning' },
          { label: 'Gates Monitored', value: '5/5', icon: <Monitor size={16} />, color: 'text-emerald-400 bg-emerald-500/10', status: 'normal' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="stadium-card p-4 flex items-center gap-3"
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', m.color)}>{m.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className="text-xl font-bold text-white">{m.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Role-filtered alerts (staff-level messaging) */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert size={12} /> Operational Alerts
          </p>
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
              className={cn('p-4 rounded-xl border', alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-orange-500/5 border-orange-500/20')}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-white leading-relaxed">{getAlertMessage(alert, 'staff')}</p>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0', getSeverityColor(alert.severity))}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              {getAlertActions(alert, 'staff').length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {getAlertActions(alert, 'staff').map(action => (
                    <button key={action} className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 rounded-lg transition-colors font-medium">
                      {action}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-600 mt-2">{timeAgo(alert.timestamp)}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Gate monitoring bar chart */}
        <div className="lg:col-span-3 stadium-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={15} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Entry Gate Monitoring</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="gate" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(222,47%,9%)', border: '1px solid hsl(217,32%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" name="Current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="capacity" name="Capacity" fill="rgba(255,255,255,0.05)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-5 gap-1 mt-3">
            {gateData.map(g => {
              const pct = Math.round((g.count / g.capacity) * 100)
              return (
                <div key={g.gate} className="text-center">
                  <div className={cn('text-xs font-bold', pct > 90 ? 'text-red-400' : pct > 70 ? 'text-yellow-400' : 'text-emerald-400')}>{pct}%</div>
                  <div className="text-[10px] text-gray-600">{g.gate}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick actions + PA announcement */}
        <div className="lg:col-span-2 space-y-3">
          {/* Action buttons */}
          <div className="stadium-card p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Staff Actions</p>
            <div className="space-y-2">
              {[
                { icon: <ShieldAlert size={14} />, label: 'Create Incident', color: 'text-red-400', action: () => setShowIncidentForm(true) },
                { icon: <Stethoscope size={14} />, label: 'Request Medical Support', color: 'text-pink-400', action: () => {} },
                { icon: <Users size={14} />, label: 'Request Security Backup', color: 'text-orange-400', action: () => {} },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[hsl(217,32%,18%)] hover:border-[hsl(217,32%,28%)] transition-all text-left"
                >
                  <span className={item.color}>{item.icon}</span>
                  <span className="text-sm text-gray-200">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PA Announcement */}
          <div className="stadium-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone size={14} className="text-yellow-400" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PA Announcement</p>
            </div>
            {sentAnnouncement ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
                <CheckCircle size={14} /> Announcement sent to all zones
              </motion.div>
            ) : (
              <>
                <textarea
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                  placeholder="Type announcement text..."
                  rows={3}
                  className="w-full bg-[hsl(224,71%,4%)] border border-[hsl(217,32%,18%)] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none resize-none mb-2"
                />
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ANNOUNCEMENT_TEMPLATES.slice(0, 2).map(t => (
                    <button key={t} onClick={() => setAnnouncement(t)} className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 rounded-lg transition-colors line-clamp-1 text-left max-w-[140px] truncate">
                      {t}
                    </button>
                  ))}
                </div>
                <button
                  onClick={sendAnnouncement}
                  disabled={!announcement.trim()}
                  className="w-full py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-sm font-medium rounded-xl transition-all disabled:opacity-40"
                >
                  📢 Broadcast
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI operational insight for staff */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Zap size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-blue-400 mb-1">AI Staff Recommendation</p>
          <p className="text-sm text-gray-200">
            Deploy two additional security personnel to Gate A. Current occupancy is at 92% — above your 85% threshold. Gate C has capacity to absorb overflow if you open the east lane.
          </p>
        </div>
      </div>
    </div>
  )
}
