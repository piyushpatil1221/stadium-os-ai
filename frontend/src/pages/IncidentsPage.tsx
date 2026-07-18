import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertTriangle, Plus, X, Loader2, Zap, Clock, CheckCircle,
  Flame, ShieldAlert, Baby, Wrench, Stethoscope
} from 'lucide-react'
import api from '@/lib/api'
import type { Incident } from '@/types'
import { getSeverityColor, getStatusColor, getIncidentIcon, timeAgo } from '@/lib/utils'

const incidentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Please describe the incident in detail (20+ chars)'),
  incident_type: z.enum(['medical', 'security', 'lost_child', 'fire', 'infrastructure']),
  location: z.string().min(3, 'Location is required'),
  zone: z.string().optional(),
})

type IncidentForm = z.infer<typeof incidentSchema>

const incidentTypes = [
  { value: 'medical', label: 'Medical', icon: <Stethoscope size={18} />, color: 'red' },
  { value: 'security', label: 'Security', icon: <ShieldAlert size={18} />, color: 'orange' },
  { value: 'lost_child', label: 'Lost Child', icon: <Baby size={18} />, color: 'yellow' },
  { value: 'fire', label: 'Fire', icon: <Flame size={18} />, color: 'red' },
  { value: 'infrastructure', label: 'Infrastructure', icon: <Wrench size={18} />, color: 'blue' },
]

const ZONES = ['North Stand', 'South Stand', 'East Wing', 'West Wing', 'VIP Lounge', 'Main Concourse']

export default function IncidentsPage() {
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Incident | null>(null)
  const queryClient = useQueryClient()

  const { data: incidents, isLoading } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: () => api.get('/incidents/').then(r => r.data),
    refetchInterval: 15000,
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<IncidentForm>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { incident_type: 'medical' },
  })

  const create = useMutation({
    mutationFn: (data: IncidentForm) => api.post('/incidents/', data).then(r => r.data),
    onSuccess: (newIncident) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      reset()
      setShowForm(false)
      setSelected(newIncident as Incident)
    },
  })

  const selectedType = watch('incident_type')

  const activeIncidents = incidents?.filter(i => i.status !== 'resolved' && i.status !== 'closed') ?? []
  const resolvedIncidents = incidents?.filter(i => i.status === 'resolved' || i.status === 'closed') ?? []

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const sorted = [...activeIncidents].sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4))

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incident Center</h1>
          <p className="text-gray-400 text-sm mt-1">Report, track, and resolve stadium incidents with AI-powered triage</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
        >
          <Plus size={16} /> Report Incident
        </button>
      </div>

      {/* Report form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-lg bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white">Report Incident</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(d => create.mutate(d))} className="space-y-4">
                {/* Type selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Incident Type</label>
                  <div className="grid grid-cols-5 gap-2">
                    {incidentTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setValue('incident_type', type.value as IncidentForm['incident_type'])}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                          selectedType === type.value
                            ? 'border-red-500/40 bg-red-500/10 text-red-400'
                            : 'border-[hsl(217,32%,18%)] text-gray-400 hover:border-[hsl(217,32%,28%)]'
                        }`}
                      >
                        {type.icon}
                        <span className="text-[10px] font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Title</label>
                  <input
                    {...register('title')}
                    placeholder="Brief incident description"
                    className="w-full bg-[hsl(224,71%,4%)] border border-[hsl(217,32%,18%)] focus:border-blue-500/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                  />
                  {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Location</label>
                  <input
                    {...register('location')}
                    placeholder="e.g. Section B12, Gate 3"
                    className="w-full bg-[hsl(224,71%,4%)] border border-[hsl(217,32%,18%)] focus:border-blue-500/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                  />
                  {errors.location && <p className="mt-1 text-xs text-red-400">{errors.location.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Zone</label>
                  <select
                    {...register('zone')}
                    className="w-full bg-[hsl(224,71%,4%)] border border-[hsl(217,32%,18%)] focus:border-blue-500/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="">Select zone (optional)</option>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="Describe the incident in detail..."
                    className="w-full bg-[hsl(224,71%,4%)] border border-[hsl(217,32%,18%)] focus:border-blue-500/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors resize-none"
                  />
                  {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-[hsl(217,32%,18%)] text-gray-400 text-sm hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={create.isPending}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {create.isPending ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : '🚨 Submit Report'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Incident list */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Active ({activeIncidents.length})
            </h3>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/3 animate-pulse rounded-xl" />)}</div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500/40" />
                No active incidents
              </div>
            ) : sorted.map((inc) => (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(inc)}
                className="stadium-card p-4 cursor-pointer hover:border-[hsl(217,32%,28%)] transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getIncidentIcon(inc.incident_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{inc.title}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityColor(inc.severity)}`}>
                          {inc.severity.toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-medium capitalize ${getStatusColor(inc.status)}`}>
                          {inc.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1">{inc.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>📍 {inc.location}</span>
                      <span>• {timeAgo(inc.created_at)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {resolvedIncidents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Resolved ({resolvedIncidents.length})
              </h3>
              {resolvedIncidents.map((inc) => (
                <div key={inc.id} className="opacity-50 stadium-card p-3 mb-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setSelected(inc)}>
                  <div className="flex items-center gap-3">
                    <span>{getIncidentIcon(inc.incident_type)}</span>
                    <p className="text-sm text-gray-300 flex-1">{inc.title}</p>
                    <CheckCircle size={14} className="text-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incident detail panel */}
        <div>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="stadium-card p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{getIncidentIcon(selected.incident_type)}</span>
                  <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">{selected.title}</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityColor(selected.severity)}`}>
                      {selected.severity.toUpperCase()}
                    </span>
                    <span className={`text-[10px] capitalize ${getStatusColor(selected.status)}`}>{selected.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{selected.description}</p>
                </div>

                {selected.ai_summary && (
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={12} className="text-blue-400" />
                      <p className="text-xs font-semibold text-blue-400">AI Analysis</p>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{selected.ai_summary}</p>
                  </div>
                )}

                {selected.ai_recommended_actions && selected.ai_recommended_actions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Recommended Actions</p>
                    <div className="space-y-1.5">
                      {selected.ai_recommended_actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.timeline && selected.timeline.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Timeline</p>
                    <div className="space-y-2">
                      {selected.timeline.map((event, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                          <div>
                            <p className="text-white">{event.event}</p>
                            <p className="text-gray-500">{event.actor} · {timeAgo(event.time)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  📍 {selected.location} {selected.zone && `· ${selected.zone}`}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="stadium-card p-8 text-center text-gray-500"
              >
                <AlertTriangle size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select an incident to view AI analysis and timeline</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
