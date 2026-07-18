import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, MapPin, AlertTriangle, Users, Zap, Clock, CheckCircle, Plus, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { getAlertsForRole, getAlertMessage, getAlertActions } from '@/lib/roleAlerts'
import type { VolunteerSummary, Crowd } from '@/types'
import api from '@/lib/api'
import { cn, timeAgo } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

// Mock volunteer-specific task data
const MY_TASKS = [
  { id: 1, title: 'Monitor Gate 7 queue', zone: 'West Wing – Gate 7', priority: 'high', status: 'active', assigned: '10 min ago', eta: 'Ongoing' },
  { id: 2, title: 'Assist with crowd flow at Section C entrance', zone: 'Main Concourse', priority: 'medium', status: 'pending', assigned: '25 min ago', eta: 'Start in 5 min' },
  { id: 3, title: 'Check in fans with accessibility needs at Gate E', zone: 'Gate E – Accessible Entrance', priority: 'low', status: 'completed', assigned: '45 min ago', eta: 'Done' },
]

const incidentSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  incident_type: z.enum(['medical', 'security', 'lost_child', 'fire', 'infrastructure']),
  location: z.string().min(3),
})
type IncidentForm = z.infer<typeof incidentSchema>

const priorityStyle: Record<string, string> = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

const taskStatusStyle: Record<string, string> = {
  active: 'text-blue-400',
  pending: 'text-yellow-400',
  completed: 'text-gray-500 line-through',
}

export default function VolunteerDashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const alerts = getAlertsForRole('volunteer')
  const [showReport, setShowReport] = useState(false)

  const { data: summary } = useQuery<VolunteerSummary>({
    queryKey: ['volunteer-summary'],
    queryFn: () => api.get('/volunteers/summary').then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: crowds } = useQuery<Crowd[]>({
    queryKey: ['crowds'],
    queryFn: () => api.get('/crowds/').then(r => r.data),
    refetchInterval: 20000,
  })

  // Zone crowd density for the volunteer's assigned zone
  const myZone = 'West Wing'
  const myZoneCrowds = crowds?.filter(c => c.zone === myZone) ?? []
  const myZoneDensity = myZoneCrowds.length
    ? Math.round(myZoneCrowds.reduce((a, c) => a + c.density_percent, 0) / myZoneCrowds.length)
    : 0

  const { register, handleSubmit, reset, formState: { errors } } = useForm<IncidentForm>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { incident_type: 'medical' },
  })

  const reportIncident = useMutation({
    mutationFn: (data: IncidentForm) => api.post('/incidents/', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidents'] }); reset(); setShowReport(false) },
  })

  const completed = MY_TASKS.filter(t => t.status === 'completed').length
  const total = MY_TASKS.length

  return (
    <div className="p-5 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Volunteer HQ</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {user?.full_name} · <span className="text-emerald-400">● Active</span>
            </p>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-2 bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium px-3 py-2 rounded-xl transition-all"
          >
            <AlertTriangle size={14} /> Report
          </button>
        </div>
      </motion.div>

      {/* My assignment + zone density */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="stadium-card p-4"
        >
          <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs font-medium uppercase tracking-wider">
            <MapPin size={12} /> My Zone
          </div>
          <p className="text-white font-bold">{myZone}</p>
          <p className="text-xs text-gray-500 mt-0.5">Gate 7 – West Concourse</p>
          <p className="text-xs text-gray-500 mt-1">Shift: 18:00 – 23:00</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={cn('stadium-card p-4', myZoneDensity > 80 ? 'border-red-500/20' : myZoneDensity > 60 ? 'border-yellow-500/20' : 'border-emerald-500/20')}
        >
          <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs font-medium uppercase tracking-wider">
            <Users size={12} /> Zone Crowd
          </div>
          <p className={cn('text-3xl font-black', myZoneDensity > 80 ? 'text-red-400' : myZoneDensity > 60 ? 'text-yellow-400' : 'text-emerald-400')}>
            {myZoneDensity}%
          </p>
          <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', myZoneDensity > 80 ? 'bg-red-500' : myZoneDensity > 60 ? 'bg-yellow-500' : 'bg-emerald-500')}
              style={{ width: `${myZoneDensity}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Task progress */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="stadium-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white flex items-center gap-2">
            <CheckSquare size={15} className="text-blue-400" /> My Tasks
          </p>
          <span className="text-xs text-gray-500">{completed}/{total} done</span>
        </div>
        <div className="mb-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(completed / total) * 100}%` }} />
        </div>
        <div className="space-y-2.5">
          {MY_TASKS.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.07 }}
              className={cn('flex items-start gap-3 p-3 rounded-xl border', task.status === 'completed' ? 'border-white/5 opacity-50' : 'border-[hsl(217,32%,18%)]')}
            >
              <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0',
                task.status === 'completed' ? 'border-emerald-500 bg-emerald-500/20' :
                task.status === 'active' ? 'border-blue-500' : 'border-gray-600')}>
                {task.status === 'completed' && <CheckCircle size={10} className="text-emerald-400" />}
                {task.status === 'active' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', taskStatusStyle[task.status])}>{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin size={10} className="text-gray-600 shrink-0" />
                  <p className="text-xs text-gray-500 truncate">{task.zone}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', priorityStyle[task.priority])}>
                  {task.priority}
                </span>
                <p className="text-[10px] text-gray-600 mt-1">{task.eta}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI task recommendation banner */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl"
      >
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Zap size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-blue-400 mb-1">AI Recommendation</p>
          <p className="text-sm text-gray-200">
            Gate 6 crowd density has risen to 78% in the last 10 minutes. Consider moving there after completing your current task at Gate 7 to maintain zone balance.
          </p>
          <button className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">Accept assignment →</button>
        </div>
      </motion.div>

      {/* Role-filtered alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Alerts</p>
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
              className={cn('p-4 rounded-xl border', alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-500/5 border-yellow-500/20')}
            >
              <p className="text-sm text-white">{getAlertMessage(alert, 'volunteer')}</p>
              {getAlertActions(alert, 'volunteer').length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {getAlertActions(alert, 'volunteer').map(action => (
                    <button key={action} className="text-xs px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg transition-colors">{action}</button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-600 mt-2">{timeAgo(alert.timestamp)}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Report Incident modal */}
      <AnimatePresence>
        {showReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">Report Incident</h3>
                <button onClick={() => setShowReport(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit(d => reportIncident.mutate(d))} className="space-y-3">
                <select {...register('incident_type')} className="w-full bg-[hsl(224,71%,4%)] border border-[hsl(217,32%,18%)] rounded-xl px-3 py-2.5 text-sm text-white outline-none">
                  {['medical', 'security', 'lost_child', 'fire', 'infrastructure'].map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
                <input {...register('title')} placeholder="Brief title" className="w-full bg-[hsl(224,71%,4%)] border border-[hsl(217,32%,18%)] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none" />
                <input {...register('location')} placeholder="Location (e.g. Gate 7, Section C)" className="w-full bg-[hsl(224,71%,4%)] border border-[hsl(217,32%,18%)] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none" />
                <textarea {...register('description')} rows={3} placeholder="Describe what you see..." className="w-full bg-[hsl(224,71%,4%)] border border-[hsl(217,32%,18%)] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none resize-none" />
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowReport(false)} className="flex-1 py-2.5 border border-[hsl(217,32%,18%)] text-gray-400 rounded-xl text-sm hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={reportIncident.isPending} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2">
                    {reportIncident.isPending ? <Loader2 size={14} className="animate-spin" /> : '🚨 Submit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
