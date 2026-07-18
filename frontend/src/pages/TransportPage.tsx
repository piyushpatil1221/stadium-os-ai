import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bus, Car, ParkingSquare, Zap, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle, Minus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '@/lib/api'
import type { Transport, TransportSummary } from '@/types'
import { cn } from '@/lib/utils'

const trafficData = [
  { zone: 'Gate A', time: 4 }, { zone: 'Gate B', time: 12 }, { zone: 'Gate C', time: 6 },
  { zone: 'N Exit', time: 18 }, { zone: 'S Exit', time: 8 }, { zone: 'Metro', time: 3 },
]

const statusIcon: Record<string, React.ReactNode> = {
  operational: <CheckCircle size={14} className="text-emerald-400" />,
  delayed: <Clock size={14} className="text-yellow-400" />,
  disrupted: <XCircle size={14} className="text-red-400" />,
  closed: <XCircle size={14} className="text-gray-500" />,
  full: <Minus size={14} className="text-orange-400" />,
}

const statusBg: Record<string, string> = {
  operational: 'border-emerald-500/20 bg-emerald-500/3',
  delayed: 'border-yellow-500/20 bg-yellow-500/3',
  disrupted: 'border-red-500/20 bg-red-500/3',
  closed: 'border-gray-500/20 bg-gray-500/3',
  full: 'border-orange-500/20 bg-orange-500/3',
}

const typeIcon: Record<string, React.ReactNode> = {
  metro: <Bus size={18} className="text-blue-400" />,
  bus: <Bus size={18} className="text-purple-400" />,
  parking: <ParkingSquare size={18} className="text-yellow-400" />,
  rideshare: <Car size={18} className="text-emerald-400" />,
}

export default function TransportPage() {
  const { data: transports, isLoading } = useQuery<Transport[]>({
    queryKey: ['transport'],
    queryFn: () => api.get('/transport/').then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: summary } = useQuery<TransportSummary>({
    queryKey: ['transport-summary'],
    queryFn: () => api.get('/transport/summary').then(r => r.data),
  })

  const byType = (type: string) => transports?.filter(t => t.type === type) ?? []

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Transport</h1>
        <p className="text-gray-400 text-sm mt-1">Live status of metro, buses, parking, and rideshare options</p>
      </div>

      {/* AI Recommendation */}
      {summary?.recommendation && (
        <div className="flex items-start gap-3 p-4 stadium-card border-blue-500/20">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Zap size={14} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-400 mb-0.5">AI Exit Recommendation</p>
            <p className="text-sm text-gray-300">{summary.recommendation}</p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Operational', value: summary?.operational ?? '-', icon: <CheckCircle size={18} className="text-emerald-400" />, color: 'text-emerald-400' },
          { label: 'Disruptions', value: summary?.disrupted ?? '-', icon: <AlertCircle size={18} className="text-red-400" />, color: 'text-red-400' },
          { label: 'Parking Spaces', value: summary?.available_parking_spaces ?? '-', icon: <ParkingSquare size={18} className="text-yellow-400" />, color: 'text-yellow-400' },
          { label: 'Total Lines', value: summary?.total ?? '-', icon: <TrendingUp size={18} className="text-blue-400" />, color: 'text-blue-400' },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="stadium-card p-4 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">{m.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Transport list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Metro */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Bus size={14} /> Metro Lines
            </h3>
            <div className="space-y-2">
              {isLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 bg-white/3 animate-pulse rounded-xl" />)
              ) : byType('metro').map((t) => (
                <TransportCard key={t.id} transport={t} />
              ))}
            </div>
          </div>

          {/* Buses */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Bus size={14} className="text-purple-400" /> Shuttle Buses
            </h3>
            <div className="space-y-2">
              {byType('bus').map((t) => <TransportCard key={t.id} transport={t} />)}
            </div>
          </div>

          {/* Rideshare */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Car size={14} className="text-emerald-400" /> Rideshare
            </h3>
            <div className="space-y-2">
              {byType('rideshare').map((t) => <TransportCard key={t.id} transport={t} />)}
            </div>
          </div>

          {/* Parking */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ParkingSquare size={14} className="text-yellow-400" /> Parking
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {byType('parking').map((t) => (
                <div key={t.id} className={`p-4 rounded-xl border ${statusBg[t.status]}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <span className="text-xs text-gray-400">{t.status}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{t.available_spaces ?? 0}</p>
                  <p className="text-xs text-gray-500">spaces available</p>
                  <div className="mt-2 h-1.5 bg-white/5 rounded-full">
                    <div
                      className={`h-full rounded-full ${t.load_percent > 80 ? 'bg-red-500' : t.load_percent > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                      style={{ width: `${t.load_percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Traffic chart + exit guide */}
        <div className="space-y-4">
          <div className="stadium-card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Predicted Exit Time (min)</h3>
            <p className="text-xs text-gray-500 mb-4">AI-predicted wait per exit</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trafficData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="zone" type="category" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="time" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="stadium-card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Post-Match Exit Guide</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Fastest Exit', value: 'Metro Line 1 (Gate A)', tag: '3 min', color: 'text-emerald-400' },
                { label: 'For North Fans', value: 'Gate B → Shuttle A', tag: '8 min', color: 'text-blue-400' },
                { label: 'South Parking', value: 'Lot B (400 spaces left)', tag: '11 min', color: 'text-yellow-400' },
                { label: 'Rideshare', value: 'Uber/Lyft Zone (East)', tag: '~8 min ETA', color: 'text-purple-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between text-xs gap-2">
                  <div>
                    <p className="text-gray-500">{item.label}</p>
                    <p className="text-white font-medium">{item.value}</p>
                  </div>
                  <span className={`${item.color} font-bold shrink-0`}>{item.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TransportCard({ transport: t }: { transport: Transport }) {
  const statusBg: Record<string, string> = {
    operational: 'border-emerald-500/20',
    delayed: 'border-yellow-500/20',
    disrupted: 'border-red-500/20',
    closed: 'border-gray-500/20',
    full: 'border-orange-500/20',
  }
  return (
    <div className={`stadium-card p-4 ${statusBg[t.status] ?? ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            {t.type === 'metro' ? <Bus size={16} className="text-blue-400" /> :
             t.type === 'bus' ? <Bus size={16} className="text-purple-400" /> :
             t.type === 'rideshare' ? <Car size={16} className="text-emerald-400" /> :
             <ParkingSquare size={16} className="text-yellow-400" />}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{t.name}</p>
            {t.next_arrival_minutes != null && (
              <p className="text-xs text-gray-500">Next: {t.next_arrival_minutes} min · Every {t.frequency_minutes}m</p>
            )}
            {t.eta_minutes != null && (
              <p className="text-xs text-gray-500">ETA: ~{t.eta_minutes} min</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${t.load_percent > 80 ? 'bg-red-500' : t.load_percent > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                style={{ width: `${t.load_percent}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">{t.load_percent}% capacity</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium">
            {t.status === 'operational' ? <span className="text-emerald-400">●</span> :
             t.status === 'delayed' ? <span className="text-yellow-400">●</span> :
             <span className="text-red-400">●</span>}
            <span className="text-gray-400 capitalize">{t.status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
