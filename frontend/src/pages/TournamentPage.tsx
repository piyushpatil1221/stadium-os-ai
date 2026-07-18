/**
 * TournamentPage — Real-time tournament operations dashboard.
 * Reads from the shared matchStore so any match the organizer adds/removes
 * immediately appears here. KPIs and charts auto-update from live data.
 */
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import { Trophy, Users, Leaf, TrendingUp, DollarSign, Globe, Radio, Clock, MapPin } from 'lucide-react'
import { useMatchStore } from '@/stores/matchStore'
import { cn } from '@/lib/utils'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6b7280', '#a78bfa', '#f87171']
const STAGES = ['Group Stage', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final']

const nationalityData = [
  { name: 'USA', value: 38 }, { name: 'Mexico', value: 24 },
  { name: 'Brazil', value: 12 }, { name: 'Argentina', value: 9 },
  { name: 'Germany', value: 7 }, { name: 'Others', value: 10 },
]

const sustainabilityData = [
  { metric: 'Energy',  value: 87, fill: '#3b82f6' },
  { metric: 'Waste',   value: 67, fill: '#10b981' },
  { metric: 'Water',   value: 92, fill: '#06b6d4' },
  { metric: 'Carbon',  value: 79, fill: '#f59e0b' },
]

function calcRevenue(attendance: number, ticketPrice: number) {
  const tickets     = attendance * ticketPrice
  const concessions = attendance * 18
  const merch       = attendance * 9
  const parking     = Math.floor(attendance / 2.5) * 30
  return tickets + concessions + merch + parking
}

export default function TournamentPage() {
  const { matches, live, currentAttendance } = useMatchStore()

  // ── Derived stats from real match data ──
  const liveMatch     = matches.find(m => m.status === 'live')
  const completedMatches = matches.filter(m => m.status === 'completed')
  const scheduledMatches = matches.filter(m => m.status === 'scheduled')

  const totalRevenue = useMemo(() => {
    return matches.reduce((sum, m) => {
      const att = m.status === 'live' ? currentAttendance : (m.actualAttendance ?? m.expectedAttendance)
      return sum + calcRevenue(att, m.ticketPrice)
    }, 0)
  }, [matches, currentAttendance])

  const totalAttendance = useMemo(() => {
    return matches.reduce((sum, m) => {
      if (m.status === 'completed') return sum + (m.actualAttendance ?? m.expectedAttendance)
      if (m.status === 'live')      return sum + currentAttendance
      return sum
    }, 0)
  }, [matches, currentAttendance])

  const avgFillRate = useMemo(() => {
    const played = matches.filter(m => m.status !== 'scheduled')
    if (!played.length) return 0
    return played.reduce((sum, m) => {
      const att = m.status === 'live' ? currentAttendance : (m.actualAttendance ?? m.expectedAttendance)
      return sum + (att / m.capacity)
    }, 0) / played.length * 100
  }, [matches, currentAttendance])

  // Revenue per stage (from real matches)
  const revenueByStage = useMemo(() => {
    const stageMap: Record<string, number> = {}
    matches.forEach(m => {
      if (m.status === 'scheduled') return
      const att = m.status === 'live' ? currentAttendance : (m.actualAttendance ?? m.expectedAttendance)
      const rev = calcRevenue(att, m.ticketPrice) / 1e6
      stageMap[m.stage] = (stageMap[m.stage] ?? 0) + rev
    })
    return Object.entries(stageMap).map(([stage, revenue]) => ({ stage, revenue: parseFloat(revenue.toFixed(1)) }))
  }, [matches, currentAttendance])

  // Per-match attendance data
  const attendanceChartData = useMemo(() =>
    matches
      .filter(m => m.status !== 'scheduled')
      .map(m => ({
        match: `${m.home} v ${m.away}`,
        attendance: m.status === 'live' ? currentAttendance : (m.actualAttendance ?? m.expectedAttendance),
        capacity: m.capacity,
      }))
  , [matches, currentAttendance])

  const statusColor = (status: string) =>
    status === 'live'      ? 'text-red-400 bg-red-500/10 border-red-500/20' :
    status === 'completed' ? 'text-gray-400 bg-gray-500/10 border-gray-500/20' :
                             'text-blue-400 bg-blue-500/10 border-blue-500/20'

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Tournament Operations</h1>
          <p className="text-gray-400 text-sm mt-1">FIFA World Cup 2026 · Live analytics — synced with organizer command center</p>
        </div>
        {liveMatch && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-red-400">
              {live.homeFlag} {live.homeTeam} {live.homeScore}–{live.awayScore} {live.awayTeam} {live.awayFlag}
            </span>
            <span className="text-xs text-gray-500">{live.minute}' · {live.venue}</span>
          </div>
        )}
      </div>

      {/* ── Live match hero (if match is live) ── */}
      {liveMatch && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="stadium-card p-6 border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-4">
            <Radio size={14} className="text-red-400 animate-pulse" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Live Now</span>
            <span className="text-xs text-gray-500 ml-1">· {liveMatch.stage} · {liveMatch.venue}</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-4xl mb-1">{live.homeFlag}</div>
                <p className="font-black text-white text-lg">{live.homeTeam}</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-white tabular-nums">{live.homeScore} – {live.awayScore}</div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className={cn('text-xs font-bold px-3 py-1 rounded-full',
                    live.isRunning ? 'bg-red-500/15 text-red-400 border border-red-500/25' : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25')}>
                    {live.isRunning ? `● ${live.minute}' LIVE` : `⏸ ${live.minute}' PAUSED`}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-1">{live.awayFlag}</div>
                <p className="font-black text-white text-lg">{live.awayTeam}</p>
              </div>
            </div>
            {/* Match events */}
            <div className="flex-1 max-w-xs space-y-1.5">
              {live.events.filter(e => e.minute <= live.minute).slice(-4).map(e => (
                <div key={e.id} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-7 text-right tabular-nums">{e.minute}'</span>
                  <span>{e.type==='goal'?'⚽':e.type==='yellow_card'?'🟨':e.type==='red_card'?'🟥':e.type==='var'?'📺':'🔄'}</span>
                  <span className={cn('font-semibold truncate', e.team==='home'?'text-blue-400':'text-emerald-400')}>{e.player}</span>
                </div>
              ))}
            </div>
            {/* Live attendance */}
            <div className="text-center">
              <p className="text-3xl font-black text-white">{currentAttendance.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">attending now</p>
              <div className="w-32 h-1.5 rounded-full bg-white/10 mt-2 mx-auto overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${currentAttendance/liveMatch.capacity*100}%` }} />
              </div>
              <p className="text-[10px] text-gray-600 mt-1">{Math.round(currentAttendance/liveMatch.capacity*100)}% capacity</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue',     value: `$${(totalRevenue/1e6).toFixed(0)}M`,    sub: `${completedMatches.length + (liveMatch?1:0)} matches played`, icon: <DollarSign size={18} />, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Total Attendance',  value: totalAttendance > 0 ? `${(totalAttendance/1e6).toFixed(2)}M` : '—', sub: `${avgFillRate.toFixed(0)}% avg fill rate`, icon: <Users size={18} />, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Matches Played',    value: `${completedMatches.length + (liveMatch?1:0)}/${matches.length}`, sub: `${scheduledMatches.length} remaining`, icon: <Trophy size={18} />, color: 'text-yellow-400 bg-yellow-500/10' },
          { label: 'Nations Competing', value: '48', sub: 'Record field size', icon: <Globe size={18} />, color: 'text-purple-400 bg-purple-500/10' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="stadium-card p-5">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${m.color}`}>{m.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{m.label}</p>
                <p className="text-xl font-bold text-white">{m.value}</p>
                <p className="text-xs text-emerald-400">{m.sub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue by stage */}
        <div className="col-span-2 stadium-card p-5">
          <h3 className="font-semibold text-text-primary text-sm mb-1">Revenue by Stage</h3>
          <p className="text-xs text-gray-500 mb-5">Total revenue ($M) per tournament stage — live data</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByStage}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="stage" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} unit="M" />
              <Tooltip
                formatter={(v: any) => [`$${v}M`, 'Revenue']}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fan nationality */}
        <div className="stadium-card p-5">
          <h3 className="font-semibold text-text-primary text-sm mb-1">Fan Nationality</h3>
          <p className="text-xs text-gray-500 mb-4">Distribution of today's attendance</p>
          <div className="flex items-center justify-center">
            <PieChart width={160} height={160}>
              <Pie data={nationalityData} cx={80} cy={80} innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {nationalityData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
            </PieChart>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {nationalityData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                <span className="text-gray-400">{d.name}</span>
                <span className="text-white font-medium ml-auto">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Attendance + Sustainability ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Attendance chart */}
        <div className="stadium-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-blue-400" />
            <h3 className="font-semibold text-text-primary text-sm">Per-Match Attendance</h3>
          </div>
          {attendanceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="match" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => `${(v/1000).toFixed(0)}K`} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: any) => [Number(v ?? 0).toLocaleString(), 'Attendance']}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="attendance" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar dataKey="capacity" fill="rgba(255,255,255,0.05)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No completed matches yet</div>
          )}
        </div>

        {/* Sustainability */}
        <div className="stadium-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Leaf size={16} className="text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">Sustainability Targets</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sustainabilityData.map(s => (
              <div key={s.metric} className="text-center p-3 bg-white/2 rounded-xl">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg viewBox="0 0 64 64" className="rotate-[-90deg]">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke={s.fill} strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${(s.value/100)*163.4} 163.4`} />
                  </svg>
                  <p className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{s.value}%</p>
                </div>
                <p className="text-xs text-gray-400">{s.metric}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Match schedule table (real data from store) ── */}
      <div className="stadium-card p-5">
        <h3 className="font-semibold text-text-primary text-sm mb-4 flex items-center gap-2">
          <Trophy size={16} className="text-yellow-400" /> Match Schedule
          <span className="ml-auto text-[10px] text-gray-500 font-normal">Synced with Organizer Command Center</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-secondary border-b border-border-subtle">
                <th className="text-left pb-3 font-medium">Match</th>
                <th className="text-left pb-3 font-medium hidden sm:table-cell">Stage</th>
                <th className="text-left pb-3 font-medium">Score</th>
                <th className="text-left pb-3 font-medium">Status</th>
                <th className="text-left pb-3 font-medium hidden md:table-cell">Attendance</th>
                <th className="text-left pb-3 font-medium hidden md:table-cell">Revenue</th>
                <th className="text-left pb-3 font-medium hidden lg:table-cell">Venue</th>
                <th className="text-left pb-3 font-medium hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {matches.map(m => {
                const att = m.status === 'live' ? currentAttendance : (m.actualAttendance ?? m.expectedAttendance)
                const rev = calcRevenue(att, m.ticketPrice)
                return (
                  <tr key={m.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3 font-semibold text-text-primary">
                      <div className="flex items-center gap-2">
                        <span>{m.homeFlag}</span><span>{m.home}</span>
                        <span className="text-gray-600">vs</span>
                        <span>{m.away}</span><span>{m.awayFlag}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-400 hidden sm:table-cell">{m.stage}</td>
                    <td className="py-3 font-mono font-bold text-white">
                      {m.status === 'live'
                        ? `${live.homeScore}–${live.awayScore}`
                        : m.score ?? '—'}
                    </td>
                    <td className="py-3">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', statusColor(m.status))}>
                        {m.status === 'live' ? '● LIVE' : m.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-300 hidden md:table-cell">
                      {m.status === 'scheduled' ? `${m.expectedAttendance.toLocaleString()} exp.` : att.toLocaleString()}
                    </td>
                    <td className="py-3 font-medium text-emerald-400 hidden md:table-cell">
                      {m.status === 'scheduled' ? `$${(calcRevenue(m.expectedAttendance,m.ticketPrice)/1e6).toFixed(1)}M proj.` : `$${(rev/1e6).toFixed(1)}M`}
                    </td>
                    <td className="py-3 text-gray-400 hidden lg:table-cell">{m.venue}</td>
                    <td className="py-3 text-gray-500 hidden sm:table-cell">{m.date} {m.time}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
