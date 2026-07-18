/**
 * PAAnnouncementPanel — PA broadcast system panel.
 * Extracted from OrganizerDashboard.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Send, CheckCircle2 } from 'lucide-react'

interface PATemplate {
  id: string
  label: string
  text: string
}

interface PAAnnouncementPanelProps {
  templates: PATemplate[]
}

export function PAAnnouncementPanel({ templates }: PAAnnouncementPanelProps) {
  const [paText, setPaText] = useState('')
  const [paSent, setPaSent] = useState(false)

  const broadcastPA = () => {
    if (!paText.trim()) return
    setPaSent(true)
    setTimeout(() => { setPaSent(false); setPaText('') }, 3500)
  }

  return (
    <div className="stadium-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone size={16} className="text-blue-400" />
        <h3 className="text-sm font-bold text-text-primary">Stadium PA System</h3>
      </div>

      {/* Templates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => setPaText(t.text)}
            className="text-left p-2.5 rounded-xl border border-border-subtle hover:border-brand-blue/40 text-[11px] text-text-secondary hover:text-text-primary transition-all"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Text area */}
      <textarea
        value={paText}
        onChange={e => setPaText(e.target.value)}
        rows={3}
        placeholder="Type announcement or select a template above..."
        className="w-full bg-bg-inset border border-border-subtle focus:border-brand-blue/60 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors resize-none"
      />

      {/* Broadcast button */}
      <AnimatePresence mode="wait">
        {paSent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 justify-center py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold"
          >
            <CheckCircle2 size={16} /> Broadcast sent to all speakers
          </motion.div>
        ) : (
          <motion.button
            key="send"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={broadcastPA}
            disabled={!paText.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
          >
            <Send size={14} /> Broadcast to Stadium
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export type { PATemplate }
