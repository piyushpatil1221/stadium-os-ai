import { useQuery } from '@tanstack/react-query'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, DollarSign, ShieldAlert, Zap,
  Activity, AlertTriangle, Megaphone, DoorOpen, DoorClosed,
  CheckCircle2, Send, X, Siren, Heart, Shield, Save,
  Plus, Trash2, Calendar, UserCheck,
  UserPlus, UserMinus,
  Calculator, Ticket, Clock, Eye,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { useAuth } from '@/providers/AuthProvider'
import { getAlertsForRole, getAlertMessage, getAlertActions } from '@/lib/roleAlerts'
import { useMatchStore, type ScheduledMatch } from '@/stores/matchStore'
import type { Crowd, Incident } from '@/types'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

// ─── Stadium heatmap zones ────────────────────────────────────────────────────
const HEATMAP_ZONES = [
  { id: 'north', label: 'North', x: 215, y: 60,  w: 270, h: 70,  density: 92 },
  { id: 'south', label: 'South', x: 215, y: 370, w: 270, h: 70,  density: 67 },
  { id: 'east',  label: 'East',  x: 510, y: 150, w: 75,  h: 200, density: 45 },
  { id: 'west',  label: 'West',  x: 115, y: 150, w: 75,  h: 200, density: 78 },
  { id: 'vip',   label: 'VIP',   x: 285, y: 170, w: 130, h: 60,  density: 55 },
  { id: 'field', label: 'Field', x: 215, y: 145, w: 270, h: 210, density: 0  },
]
const heatmapColor = (d: number) => {
  if (d === 0) return 'rgba(6,95,70,0.25)'
  if (d >= 85) return 'rgba(239,68,68,0.45)'
  if (d >= 65) return 'rgba(245,158,11,0.35)'
  return 'rgba(16,185,129,0.25)'
}

const attendanceFlow = [
  { t: '16:00', fans: 8200 }, { t: '17:00', fans: 18400 },
  { t: '18:00', fans: 34100 }, { t: '19:00', fans: 52700 },
  { t: '20:00', fans: 68421 }, { t: '21:00', fans: 67900 },
  { t: '22:00', fans: 61200 }, { t: '23:00', fans: 22000 },
]

const PA_TEMPLATES = [
  { id: 'crowd',     label: '🚪 Crowd Redirect',  text: 'Attention all fans: Gate A is at full capacity. Please use Gates B, C, or E. Follow steward guidance.' },
  { id: 'halftime',  label: '⏸ Half-Time',         text: 'Half-time! 15-minute break. Refreshments available on all concourse levels. Return at the second whistle.' },
  { id: 'fulltime',  label: '🏁 Full-Time',         text: 'Full-time! Thank you for attending FIFA World Cup 2026. Please exit via your designated gate.' },
  { id: 'medical',   label: '🏥 Medical Alert',     text: 'Medical team responding. Please keep all aisles clear for emergency access. Thank you.' },
  { id: 'transport', label: '🚌 Transport Update',  text: 'Metro Line 2 delayed 30 min. Shuttle Route A available from East Plaza as alternative.' },
  { id: 'emergency', label: '⚠ Emergency',          text: 'URGENT: All fans in Section North please proceed calmly to the nearest exit. Follow steward instructions.' },
]

const VOLUNTEER_ROLES = ['Gate Marshal','First Aid','Crowd Control','Information Desk','Accessibility Aid','Parking Guide','Media Escort','VIP Concierge','Security Support','Translation Aid']
const SECTIONS = ['Gate A','Gate B','Gate C','Gate D','Gate E','Section 101','Section 102','Section 201','Section 301','Concourse 1','VIP Lounge','Press Box','Parking A','Parking B']

const INITIAL_VOLUNTEERS = [
  { id: 1, name: 'Alex Johnson',  role: 'Gate Marshal',     section: 'Gate A',      phone: '+1 555-0101', status: 'active' },
  { id: 2, name: 'Priya Sharma',  role: 'First Aid',        section: 'Section 101', phone: '+1 555-0102', status: 'active' },
  { id: 3, name: 'Carlos Ruiz',   role: 'Information Desk', section: 'Concourse 1', phone: '+1 555-0103', status: 'active' },
  { id: 4, name: 'Emma Wilson',   role: 'Crowd Control',    section: 'Gate B',      phone: '+1 555-0104', status: 'break'  },
  { id: 5, name: 'James Lee',     role: 'Parking Guide',    section: 'Parking A',   phone: '+1 555-0105', status: 'active' },
  { id: 6, name: 'Sofia Rossi',   role: 'Accessibility Aid',section: 'Gate E',      phone: '+1 555-0106', status: 'active' },
  { id: 7, name: 'Omar Hassan',   role: 'Media Escort',     section: 'Press Box',   phone: '+1 555-0107', status: 'active' },
  { id: 8, name: 'Yuki Tanaka',   role: 'VIP Concierge',   section: 'VIP Lounge',  phone: '+1 555-0108', status: 'active' },
]

function calcRevenue(attendance: number, ticketPrice: number) {
  const tickets     = attendance * ticketPrice
  const concessions = attendance * 18
  const merch       = attendance * 9
  const parking     = Math.floor(attendance / 2.5) * 30
  return { tickets, concessions, merch, parking, total: tickets + concessions + merch + parking }
}

const StatCard = ({ label, value, sub, icon, color = 'blue' }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color?: string }) => {
  const colours: Record<string, string> = {
    blue:   'bg-blue-500/10 text-blue-400',
    emerald:'bg-emerald-500/10 text-emerald-400',
    red:    'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
  }
  return (
    <div className="stadium-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colours[color])}>{icon}</div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrganizerDashboard() {
  const { user } = useAuth()
  const alerts = getAlertsForRole('organizer')

  // ── Store (shared match state) ──
  const { live, matches, addMatch, removeMatch, setMinute, setRunning, jumpToHalfTime, jumpToFullTime,
          currentAttendance, currentCapacity, setAttendance, setCapacity } = useMatchStore()

  // ── Backend queries ──
  const { data: crowds }    = useQuery<Crowd[]>({ queryKey: ['crowds'],    queryFn: () => api.get('/crowds/').then(r => r.data),    refetchInterval: 15000 })
  const { data: incidents } = useQuery<Incident[]>({ queryKey: ['incidents'], queryFn: () => api.get('/incidents/').then(r => r.data), refetchInterval: 10000 })

  // ── Local UI state ──
  const [tab, setTab] = useState<'overview'|'match-control'|'matches'|'volunteers'|'gate'|'pa'|'emergency'>('overview')

  // ── Attendance & revenue ──
  const [ticketPrice, setTicketPrice] = useState(320)
  const revenue = useMemo(() => calcRevenue(currentAttendance, ticketPrice), [currentAttendance, ticketPrice])

  // ── Live minute ticker ──
  useEffect(() => {
    if (!live.isRunning) return
    const id = setInterval(() => {
      if (live.minute < 90) setMinute(live.minute + 1)
      else setRunning(false)
    }, 30000) // advance 1 min every 30 seconds (demo speed)
    return () => clearInterval(id)
  }, [live.isRunning, live.minute])

  // ── Gate states ──
  const [gates, setGates] = useState({ A: true, B: true, C: true, D: false, E: true })
  const toggleGate = (g: keyof typeof gates) => setGates(prev => ({ ...prev, [g]: !prev[g] }))

  // ── PA Broadcast ──
  const [paText, setPaText]   = useState('')
  const [paSent, setPaSent]   = useState(false)
  const broadcastPA = () => {
    if (!paText.trim()) return
    setPaSent(true)
    setTimeout(() => { setPaSent(false); setPaText('') }, 3500)
  }

  // ── Emergency ──
  const [activeProtocol,  setActiveProtocol]  = useState<string | null>(null)
  const [emergencyBanner, setEmergencyBanner] = useState(false)
  const activateProtocol = (name: string) => { setActiveProtocol(name); setEmergencyBanner(true) }
  const standDown        = () => { setActiveProtocol(null); setEmergencyBanner(false) }

  // ── Matches form ──
  const [showAddMatch, setShowAddMatch] = useState(false)
  const [newMatch, setNewMatch] = useState({
    home: '', away: '', homeFlag: '🏴', awayFlag: '🏴',
    date: '', time: '19:00', venue: 'SoFi Stadium, LA', stage: 'Group Stage',
    capacity: 72000, expectedAttendance: 65000, ticketPrice: 180,
  })
  const handleAddMatch = () => {
    if (!newMatch.home || !newMatch.away || !newMatch.date) return
    addMatch(newMatch)
    setNewMatch({ home: '', away: '', homeFlag: '🏴', awayFlag: '🏴', date: '', time: '19:00', venue: 'SoFi Stadium, LA', stage: 'Group Stage', capacity: 72000, expectedAttendance: 65000, ticketPrice: 180 })
    setShowAddMatch(false)
  }

  // ── Volunteers ──
  const [volunteers, setVolunteers] = useState(INITIAL_VOLUNTEERS)
  const [showAddVol, setShowAddVol] = useState(false)
  const [newVol, setNewVol] = useState({ name: '', role: 'Gate Marshal', section: 'Gate A', phone: '' })
  const addVolunteer = () => {
    if (!newVol.name) return
    setVolunteers(prev => [...prev, { ...newVol, id: Date.now(), status: 'active' }])
    setNewVol({ name: '', role: 'Gate Marshal', section: 'Gate A', phone: '' })
    setShowAddVol(false)
  }
  const removeVolunteer = (id: number) => setVolunteers(prev => prev.filter(v => v.id !== id))
  const toggleVolStatus = (id: number) => setVolunteers(prev =>
    prev.map(v => v.id === id ? { ...v, status: v.status === 'active' ? 'break' : 'active' } : v)
  )

  const criticals = incidents?.filter(i => i.priority === 'critical').length ?? 3
  const totalVols  = volunteers.length
  const activeVols = volunteers.filter(v => v.status === 'active').length

  const TABS = [
    { id: 'overview',      label: 'Overview',      icon: <Activity size={14} /> },
    { id: 'match-control', label: 'Match Control',  icon: <Clock size={14} /> },
    { id: 'matches',       label: 'Matches',        icon: <Calendar size={14} /> },
    { id: 'volunteers',    label: 'Volunteers',      icon: <Users size={14} /> },
    { id: 'gate',          label: 'Gate Control',   icon: <DoorOpen size={14} /> },
    { id: 'pa',            label: 'PA Broadcast',   icon: <Megaphone size={14} /> },
    { id: 'emergency',     label: 'Emergency',      icon: <Siren size={14} />, danger: true },
  ] as const

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">

      {/* ── Emergency banner ── */}
      <AnimatePresence>
        {emergencyBanner && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between p-4 bg-red-600/20 border border-red-500/40 rounded-xl">
            <div className="flex items-center gap-3">
              <Siren size={18} className="text-red-400 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-red-300">⚠ EMERGENCY PROTOCOL ACTIVE — {activeProtocol}</p>
                <p className="text-xs text-red-400/80">All stations notified. Awaiting stand-down.</p>
              </div>
            </div>
            <button onClick={standDown} className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl">STAND DOWN</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">FIFA Command Center</h1>
          <p className="text-gray-400 text-sm mt-0.5">{user?.full_name} · Tournament Organizer · FIFA World Cup 2026 · SoFi Stadium, LA</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-bold text-red-400">{live.homeFlag} {live.homeTeam} {live.homeScore} – {live.awayScore} {live.awayTeam} {live.awayFlag}</span>
          <span className="text-xs text-gray-500">{live.minute}' {live.isRunning ? 'LIVE' : 'PAUSED'}</span>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Live Attendance"  value={currentAttendance.toLocaleString()} sub={`${Math.round(currentAttendance/currentCapacity*100)}% of ${(currentCapacity/1000).toFixed(0)}K`} icon={<Users size={18} />} color="blue" />
        <StatCard label="Match Revenue"    value={`$${(revenue.total/1e6).toFixed(1)}M`} sub="+18% vs forecast" icon={<DollarSign size={18} />} color="emerald" />
        <StatCard label="Active Incidents" value={criticals} sub={`${criticals} critical`} icon={<ShieldAlert size={18} />} color="red" />
        <StatCard label="Volunteers"       value={`${activeVols}/${totalVols}`} sub="on duty" icon={<UserCheck size={18} />} color="purple" />
        <StatCard label="Gates Open"       value={`${Object.values(gates).filter(Boolean).length}/5`} sub="operational" icon={<DoorOpen size={18} />} color="yellow" />
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 bg-[hsl(222,47%,7%)] border border-[hsl(217,32%,18%)] rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
              tab === t.id
                ? t.danger ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                : t.danger ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5',
            )}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* AI alerts */}
          <div className="stadium-card p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Zap size={14} className="text-blue-400" /> Operational Intelligence</h3>
            <div className="space-y-2.5">
              {alerts.slice(0, 3).map((a, i) => (
                <div key={i} className={cn('flex items-start justify-between p-3 rounded-xl border',
                  a.severity === 'danger'  ? 'border-red-500/20 bg-red-500/5' :
                  a.severity === 'warning' ? 'border-yellow-500/20 bg-yellow-500/5' :
                                             'border-orange-500/20 bg-orange-500/5')}>
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-xs text-gray-300 font-medium">{getAlertMessage(a, 'organizer')}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{a.zone ?? 'Stadium'} · {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {getAlertActions(a, 'organizer').map((ac: string) => (
                        <button key={ac} className="text-[10px] px-2.5 py-1 border border-[hsl(217,32%,18%)] text-gray-300 hover:text-white hover:border-blue-500/40 rounded-lg transition-colors">{ac}</button>
                      ))}
                    </div>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded shrink-0',
                    a.severity === 'danger'  ? 'bg-red-500/20 text-red-400' :
                    a.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                              'bg-orange-500/20 text-orange-400'
                  )}>{a.severity.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Heatmap */}
            <div className="stadium-card p-5">
              <h3 className="text-sm font-bold text-white mb-3">Live Crowd Heatmap</h3>
              <svg viewBox="0 0 700 500" className="w-full rounded-xl" style={{ background: 'hsl(222,47%,6%)' }}>
                <ellipse cx="350" cy="250" rx="300" ry="235" fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth="2" />
                {HEATMAP_ZONES.map(z => (
                  <g key={z.id}>
                    <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="8" fill={heatmapColor(z.density)} stroke={z.density >= 85 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'} strokeWidth="1" />
                    <text x={z.x+z.w/2} y={z.y+z.h/2-6} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11" fontWeight="600">{z.label}</text>
                    {z.density > 0 && <text x={z.x+z.w/2} y={z.y+z.h/2+10} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">{z.density}%</text>}
                  </g>
                ))}
              </svg>
            </div>

            {/* Revenue Calculator */}
            <div className="stadium-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Calculator size={15} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Revenue Calculator</h3>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full ml-auto">Live</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1.5">Actual Attendance</label>
                  <input type="number" value={currentAttendance} min={0} max={currentCapacity}
                    onChange={e => setAttendance(Number(e.target.value))}
                    className="w-full rounded-xl px-3 py-2 text-sm font-semibold bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] text-white outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all"
                      style={{ width: `${Math.min(100, currentAttendance/currentCapacity*100)}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{Math.round(currentAttendance/currentCapacity*100)}% of {currentCapacity.toLocaleString()} capacity</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1.5">Avg Ticket Price (USD)</label>
                  <input type="number" value={ticketPrice} min={0}
                    onChange={e => setTicketPrice(Number(e.target.value))}
                    className="w-full rounded-xl px-3 py-2 text-sm font-semibold bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] text-white outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Ticket Sales',            value: revenue.tickets,     icon: <Ticket size={11} />,  color: 'text-blue-400' },
                  { label: 'Concessions ($18/head)',   value: revenue.concessions, icon: '🍔',                  color: 'text-orange-400' },
                  { label: 'Merchandise ($9/head)',    value: revenue.merch,       icon: '🛍',                  color: 'text-purple-400' },
                  { label: 'Parking ($30/car)',        value: revenue.parking,     icon: '🅿',                  color: 'text-yellow-400' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[hsl(217,32%,12%)] last:border-0">
                    <div className="flex items-center gap-2"><span className="text-xs">{r.icon}</span><span className="text-xs text-gray-400">{r.label}</span></div>
                    <span className={cn('text-xs font-bold', r.color)}>${(r.value/1e6).toFixed(2)}M</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t-2 border-[hsl(217,32%,22%)]">
                  <span className="text-sm font-bold text-white">Total Revenue</span>
                  <span className="text-lg font-black text-emerald-400">${(revenue.total/1e6).toFixed(2)}M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance flow */}
          <div className="stadium-card p-5">
            <h3 className="text-sm font-bold text-white mb-1">Attendance Flow</h3>
            <p className="text-xs text-gray-500 mb-4">Fan arrival and departure throughout today</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={attendanceFlow}>
                <defs>
                  <linearGradient id="fanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => `${(v/1000).toFixed(0)}K`} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [Number(v ?? 0).toLocaleString()]} contentStyle={{ background: 'hsl(222,47%,9%)', border: '1px solid hsl(217,32%,18%)', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="fans" stroke="#3b82f6" strokeWidth={2} fill="url(#fanGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MATCH CONTROL TAB (READ-ONLY SCORE)
      ══════════════════════════════════════ */}
      {tab === 'match-control' && (
        <div className="space-y-4">
          {/* Live scoreboard — READ-ONLY (score comes from live feed) */}
          <div className="stadium-card p-6 space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Live Feed — Read Only</p>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">FIFA World Cup 2026 · {live.stage}</p>

            <div className="flex items-center justify-center gap-12">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-4xl mx-auto mb-3">{live.homeFlag}</div>
                <p className="text-base font-bold text-white">{live.homeTeam}</p>
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center gap-5">
                  <span className="text-6xl font-black text-white tabular-nums">{live.homeScore}</span>
                  <span className="text-2xl text-gray-600 font-light">–</span>
                  <span className="text-6xl font-black text-white tabular-nums">{live.awayScore}</span>
                </div>
                <div className={cn('text-xs font-bold px-3 py-1 rounded-full inline-block',
                  live.isRunning ? 'bg-red-500/15 text-red-400 border border-red-500/25' : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25')}>
                  {live.isRunning ? `● ${live.minute}' LIVE` : `⏸ ${live.minute}' PAUSED`}
                </div>
                <p className="text-[11px] text-gray-500">{live.venue}</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-4xl mx-auto mb-3">{live.awayFlag}</div>
                <p className="text-base font-bold text-white">{live.awayTeam}</p>
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-600 mt-2">Score is sourced from the official FIFA live data feed and cannot be manually edited.</p>
          </div>

          {/* Match timing controls */}
          <div className="stadium-card p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Match Timing Control</h3>
              <p className="text-xs text-gray-500 mt-0.5">Control broadcast timing and stadium operations</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-black text-white w-14 text-center tabular-nums">{live.minute}'</span>
              <input type="range" min={1} max={90} value={live.minute}
                onChange={e => setMinute(Number(e.target.value))}
                className="flex-1 accent-blue-500" />
              <span className="text-xs text-gray-500">90'</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '▶ Resume',    action: () => setRunning(true),  active: live.isRunning,   color: 'bg-blue-500 text-white' },
                { label: '⏸ Pause',    action: () => setRunning(false), active: !live.isRunning,  color: 'bg-yellow-500 text-black' },
                { label: '⏱ Half-Time', action: jumpToHalfTime,         active: false,             color: '' },
                { label: '🏁 Full-Time', action: jumpToFullTime,         active: false,             color: '' },
              ].map(b => (
                <button key={b.label} onClick={b.action}
                  className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-all', b.active ? b.color : 'bg-white/5 text-gray-400 hover:bg-white/10')}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Match events timeline */}
          <div className="stadium-card p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Eye size={14} className="text-blue-400" /> Match Events Timeline</h3>
            <div className="space-y-2">
              {live.events.filter(e => e.minute <= live.minute).map(e => (
                <div key={e.id} className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-right font-bold text-gray-500 tabular-nums shrink-0">{e.minute}'</span>
                  <span className={cn('text-base shrink-0',
                    e.type === 'goal' ? '⚽' :
                    e.type === 'yellow_card' ? '🟨' :
                    e.type === 'red_card' ? '🟥' :
                    e.type === 'var' ? '📺' : '🔄'
                  )}>
                    {e.type === 'goal' ? '⚽' : e.type === 'yellow_card' ? '🟨' : e.type === 'red_card' ? '🟥' : e.type === 'var' ? '📺' : '🔄'}
                  </span>
                  <div className="flex-1">
                    <span className={cn('font-semibold', e.team === 'home' ? 'text-blue-400' : 'text-emerald-400')}>{e.player}</span>
                    <span className="text-gray-500 ml-2">{e.description}</span>
                  </div>
                </div>
              ))}
              {live.events.filter(e => e.minute <= live.minute).length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No events yet in this match</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MATCHES TAB
      ══════════════════════════════════════ */}
      {tab === 'matches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Match Schedule</h2>
              <p className="text-xs text-gray-500">{matches.length} matches · {matches.filter(m => m.status === 'live').length} live · {matches.filter(m => m.status === 'completed').length} completed</p>
            </div>
            <button onClick={() => setShowAddMatch(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20">
              <Plus size={15} /> Add Match
            </button>
          </div>

          <AnimatePresence>
            {showAddMatch && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="stadium-card p-5 space-y-4 border-blue-500/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Plus size={14} className="text-blue-400" /> New Match</h3>
                  <button onClick={() => setShowAddMatch(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label: 'Home Team *', key: 'home', placeholder: 'e.g. USA' },
                    { label: 'Away Team *', key: 'away', placeholder: 'e.g. MEX' },
                    { label: 'Venue',       key: 'venue', placeholder: 'Stadium name' },
                    { label: 'Stage',       key: 'stage', placeholder: 'Group Stage, QF…' },
                    { label: 'Home Flag',   key: 'homeFlag', placeholder: '🇺🇸' },
                    { label: 'Away Flag',   key: 'awayFlag', placeholder: '🇲🇽' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs text-gray-400 font-medium mb-1.5">{f.label}</label>
                      <input value={(newMatch as any)[f.key]} placeholder={f.placeholder}
                        onChange={e => setNewMatch(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full rounded-xl px-3 py-2 text-sm bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] text-white outline-none focus:border-blue-500/50" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-gray-400 font-medium mb-1.5">Date *</label>
                    <input type="date" value={newMatch.date} onChange={e => setNewMatch(p => ({ ...p, date: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-sm bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] text-white outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-medium mb-1.5">Kick-off</label>
                    <input type="time" value={newMatch.time} onChange={e => setNewMatch(p => ({ ...p, time: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-sm bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] text-white outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-medium mb-1.5">Expected Attendance</label>
                    <input type="number" value={newMatch.expectedAttendance} onChange={e => setNewMatch(p => ({ ...p, expectedAttendance: Number(e.target.value) }))}
                      className="w-full rounded-xl px-3 py-2 text-sm bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] text-white outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-medium mb-1.5">Ticket Price (USD)</label>
                    <input type="number" value={newMatch.ticketPrice} onChange={e => setNewMatch(p => ({ ...p, ticketPrice: Number(e.target.value) }))}
                      className="w-full rounded-xl px-3 py-2 text-sm bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] text-white outline-none focus:border-blue-500/50" />
                  </div>
                </div>
                {/* Revenue preview */}
                {newMatch.expectedAttendance > 0 && newMatch.ticketPrice > 0 && (() => {
                  const r = calcRevenue(newMatch.expectedAttendance, newMatch.ticketPrice)
                  return (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-4 flex-wrap">
                      <Calculator size={13} className="text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-semibold">Projected Revenue: ${(r.total/1e6).toFixed(2)}M</span>
                      <span className="text-xs text-gray-500">${(r.tickets/1e6).toFixed(1)}M tickets · ${(r.concessions/1e6).toFixed(1)}M food · ${(r.merch/1e6).toFixed(1)}M merch</span>
                    </div>
                  )
                })()}
                <div className="flex gap-2">
                  <button onClick={handleAddMatch} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"><Save size={14} /> Save Match</button>
                  <button onClick={() => setShowAddMatch(false)} className="px-4 py-2.5 rounded-xl text-sm text-gray-400 bg-white/5 hover:bg-white/10">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {matches.map((m: ScheduledMatch) => {
              const r = calcRevenue(m.actualAttendance ?? m.expectedAttendance, m.ticketPrice)
              return (
                <motion.div key={m.id} layout className="stadium-card p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{m.homeFlag}</span>
                        <span className="text-lg font-black text-white">{m.home}</span>
                        {m.score
                          ? <span className="text-base font-black text-white px-2">{m.score}</span>
                          : <span className="text-sm text-gray-500 px-2">vs</span>}
                        <span className="text-lg font-black text-white">{m.away}</span>
                        <span className="text-xl">{m.awayFlag}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold border',
                          m.status === 'live'      ? 'bg-red-500/15 text-red-400 border-red-500/25 animate-pulse' :
                          m.status === 'completed' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                                                     'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        )}>{m.status === 'live' ? '● LIVE' : m.status.toUpperCase()}</span>
                        <span className="text-[10px] text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">{m.stage}</span>
                        <span className="text-xs text-gray-500">{m.date} · {m.time}</span>
                        <span className="text-xs text-gray-500">{m.venue}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 text-xs flex-wrap">
                      <div className="text-center">
                        <p className="text-gray-500">Attendance</p>
                        <p className="font-bold text-white">{(m.actualAttendance ?? m.expectedAttendance).toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Capacity</p>
                        <p className="font-semibold text-gray-300">{m.capacity.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Revenue</p>
                        <p className="font-bold text-emerald-400">${(r.total/1e6).toFixed(1)}M</p>
                      </div>
                      <button onClick={() => removeMatch(m.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          VOLUNTEERS TAB
      ══════════════════════════════════════ */}
      {tab === 'volunteers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Volunteer Roster</h2>
              <p className="text-xs text-gray-500">{activeVols} active · {totalVols - activeVols} on break · {totalVols} total</p>
            </div>
            <button onClick={() => setShowAddVol(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
              <UserPlus size={15} /> Add Volunteer
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Active',   value: activeVols,            color: 'bg-emerald-500' },
              { label: 'On Break', value: totalVols - activeVols, color: 'bg-yellow-500' },
              { label: 'Total',    value: totalVols,              color: 'bg-blue-500'   },
            ].map(s => (
              <div key={s.label} className="stadium-card p-4 text-center">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                <div className="w-full h-1.5 rounded-full bg-white/5 mt-2">
                  <div className={cn('h-full rounded-full', s.color)} style={{ width: `${s.value/totalVols*100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {showAddVol && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="stadium-card p-5 space-y-4 border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><UserPlus size={14} className="text-emerald-400" /> Add Volunteer</h3>
                  <button onClick={() => setShowAddVol(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 font-medium mb-1.5">Full Name *</label>
                    <input value={newVol.name} placeholder="e.g. Alex Johnson" onChange={e => setNewVol(p => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-sm bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] text-white outline-none focus:border-emerald-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-medium mb-1.5">Phone</label>
                    <input value={newVol.phone} placeholder="+1 555-0000" onChange={e => setNewVol(p => ({ ...p, phone: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-sm bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] text-white outline-none focus:border-emerald-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-medium mb-1.5">Role</label>
                    <select value={newVol.role} onChange={e => setNewVol(p => ({ ...p, role: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-sm bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] text-white outline-none">
                      {VOLUNTEER_ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-medium mb-1.5">Section</label>
                    <select value={newVol.section} onChange={e => setNewVol(p => ({ ...p, section: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-sm bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] text-white outline-none">
                      {SECTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addVolunteer} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"><UserPlus size={14} /> Add</button>
                  <button onClick={() => setShowAddVol(false)} className="px-4 py-2.5 rounded-xl text-sm text-gray-400 bg-white/5 hover:bg-white/10">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="stadium-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[hsl(217,32%,18%)] text-gray-500">
                  <th className="text-left px-5 py-3 font-semibold">Name</th>
                  <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Role</th>
                  <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Section</th>
                  <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(217,32%,12%)]">
                {volunteers.map(v => (
                  <motion.tr key={v.id} layout className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">{v.name[0]}</div>
                        <span className="font-medium text-gray-200">{v.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">{v.role}</td>
                    <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{v.section}</td>
                    <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">{v.phone}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleVolStatus(v.id)}
                        className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all',
                          v.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20')}>
                        {v.status === 'active' ? '● Active' : '◐ Break'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => removeVolunteer(v.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                        <UserMinus size={12} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          GATE CONTROL TAB
      ══════════════════════════════════════ */}
      {tab === 'gate' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setGates({ A:true,B:true,C:true,D:true,E:true })} className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl font-medium">Open All</button>
            <button onClick={() => setGates({ A:false,B:false,C:false,D:false,E:false })} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl font-medium">Close All</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(gates).map(([gate, open]) => (
              <motion.div key={gate} layout
                className={cn('stadium-card p-5 cursor-pointer transition-all', open ? 'border-emerald-500/20' : 'border-red-500/20')}
                onClick={() => toggleGate(gate as keyof typeof gates)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', open ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                      {open ? <DoorOpen size={18} className="text-emerald-400" /> : <DoorClosed size={18} className="text-red-400" />}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Gate {gate}</p>
                      <p className="text-[10px] text-gray-500">{gate==='C'?'VIP Entrance':gate==='D'?'Staff Only':gate==='E'?'Accessible':'General'}</p>
                    </div>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', open ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                    {open ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <div className={cn('h-1 rounded-full', open ? 'bg-emerald-500' : 'bg-red-500/50')} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PA BROADCAST TAB
      ══════════════════════════════════════ */}
      {tab === 'pa' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PA_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setPaText(t.text)} className="text-left p-3 stadium-card hover:border-blue-500/30 transition-all">
                <p className="text-xs font-semibold text-gray-300">{t.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{t.text}</p>
              </button>
            ))}
          </div>
          <div className="stadium-card p-5 space-y-3">
            <label className="block text-xs font-semibold text-gray-400">Broadcast Message</label>
            <textarea value={paText} onChange={e => setPaText(e.target.value)} rows={4} placeholder="Type or select a template above…"
              className="w-full bg-[hsl(222,47%,7%)] border border-[hsl(217,32%,18%)] focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none resize-none" />
            <div className="flex items-center gap-3">
              <button onClick={broadcastPA} disabled={!paText.trim()}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl">
                <Send size={14} /> Broadcast to All Zones
              </button>
              <AnimatePresence>
                {paSent && (
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-emerald-400 text-sm">
                    <CheckCircle2 size={15} /> Broadcast sent!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          EMERGENCY TAB
      ══════════════════════════════════════ */}
      {tab === 'emergency' && (
        <div className="space-y-4">
          {activeProtocol && (
            <div className="p-4 bg-red-600/20 border border-red-500/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Siren size={18} className="text-red-400 animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-red-300">ACTIVE: {activeProtocol}</p>
                  <p className="text-xs text-red-400/80">Emergency protocol in effect.</p>
                </div>
              </div>
              <button onClick={standDown} className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl">STAND DOWN</button>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Medical Emergency', icon: <Heart size={20} />,         color: 'red',    desc: 'Dispatch medical team, clear aisles, alert nearest hospital.' },
              { name: 'Security Breach',   icon: <Shield size={20} />,        color: 'orange', desc: 'Lockdown breach zone, alert security HQ, restrict access.' },
              { name: 'Evacuation',        icon: <AlertTriangle size={20} />, color: 'yellow', desc: 'Activate all exit routes, PA evacuation message, emergency services.' },
              { name: 'Fire Alert',        icon: <Siren size={20} />,         color: 'red',    desc: 'Fire suppression engaged, evacuate affected zones, LAFD notified.' },
              { name: 'Power Outage',      icon: <Zap size={20} />,           color: 'yellow', desc: 'Backup generators online, emergency lighting activated.' },
              { name: 'Crowd Surge',       icon: <Users size={20} />,         color: 'orange', desc: 'Close affected gates, reroute fans, increase stewarding.' },
            ].map(p => {
              const isActive = activeProtocol === p.name
              const colours: Record<string, string> = {
                red: 'bg-red-500/10 text-red-400', orange: 'bg-orange-500/10 text-orange-400', yellow: 'bg-yellow-500/10 text-yellow-400',
              }
              return (
                <div key={p.name} className={cn('stadium-card p-5', isActive && 'border-red-500/40 bg-red-500/5')}>
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', colours[p.color])}>{p.icon}</div>
                  <p className="text-sm font-bold text-white">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{p.desc}</p>
                  <div className="mt-4">
                    {!isActive
                      ? <button onClick={() => activateProtocol(p.name)} className="w-full text-xs font-bold py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20">ACTIVATE</button>
                      : <button onClick={standDown} className="w-full text-xs font-bold py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">STAND DOWN</button>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
