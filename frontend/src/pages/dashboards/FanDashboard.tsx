import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Utensils, ShowerHead, Bus, Globe, Accessibility, Bell, Zap, ChevronRight, Volume2, MessageSquare, Loader2 } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { getAlertsForRole, getAlertMessage, getAlertActions } from '@/lib/roleAlerts'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
]

const QUICK_FIND = [
  { icon: <Map size={20} />, label: 'Navigate to My Seat', path: '/navigator', color: 'blue', desc: 'AI route to your section' },
  { icon: <Utensils size={20} />, label: 'Find Food Courts', path: '/navigator', color: 'orange', desc: 'Nearest open vendors' },
  { icon: <ShowerHead size={20} />, label: 'Washrooms', path: '/accessibility', color: 'emerald', desc: 'All nearby facilities' },
  { icon: <Bus size={20} />, label: 'Transport', path: '/transport', color: 'purple', desc: 'Metro, shuttle, rideshare' },
  { icon: <Accessibility size={20} />, label: 'Accessibility', path: '/accessibility', color: 'teal', desc: 'Wheelchair routes & aids' },
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
}

// Simulated AI chat for fan multilingual assistance
interface ChatMessage {
  from: 'user' | 'ai'
  text: string
}

const AI_RESPONSES: Record<string, string> = {
  seat: 'Your seat is in Section 204, Row G, Seat 14. From Gate B, turn right and take the escalator to Level 2. Follow the signs for Section 200-210. Estimated walk: 4 minutes.',
  food: 'The nearest open food court is at Level 1 East — about 80 metres from your seat. It has hot dogs, nachos, and vegetarian options. Queue time is currently under 5 minutes.',
  washroom: 'The closest accessible washroom is at Level 2, near Section 210. It is 60 metres away and currently available with no queue.',
  transport: 'After the match, Metro Line 1 (Gate A) is your fastest exit — 3 min wait. If you prefer, Shuttle Route A from Gate B runs every 8 minutes. Lot B still has 400 parking spaces.',
  help: 'I can help you with: finding your seat, food courts, washrooms, transport options, accessibility services, or any stadium information. What do you need?',
}

function getAIResponse(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('seat') || lower.includes('section')) return AI_RESPONSES.seat
  if (lower.includes('food') || lower.includes('eat') || lower.includes('drink') || lower.includes('nacho')) return AI_RESPONSES.food
  if (lower.includes('washroom') || lower.includes('toilet') || lower.includes('bathroom') || lower.includes('wc')) return AI_RESPONSES.washroom
  if (lower.includes('transport') || lower.includes('metro') || lower.includes('bus') || lower.includes('uber') || lower.includes('taxi') || lower.includes('park')) return AI_RESPONSES.transport
  return AI_RESPONSES.help
}

export default function FanDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const alerts = getAlertsForRole('fan')
  const [lang, setLang] = useState('en')
  const [accessibilityMode, setAccessibilityMode] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { from: 'ai', text: 'Hi! I\'m your StadiumOS assistant. Ask me anything — where to go, what\'s nearby, or how to get home after the match. 🏟️' },
  ])
  const [isTyping, setIsTyping] = useState(false)

  const sendMessage = () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatMessages(prev => [...prev, { from: 'user', text: userMsg }])
    setChatInput('')
    setIsTyping(true)
    setTimeout(() => {
      setChatMessages(prev => [...prev, { from: 'ai', text: getAIResponse(userMsg) }])
      setIsTyping(false)
    }, 900)
  }

  return (
    <div className={cn('p-5 space-y-5 max-w-2xl mx-auto', accessibilityMode && 'text-lg')}>
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Welcome, {user?.full_name?.split(' ')[0]}! 👋</h1>
            <p className="text-gray-400 text-sm mt-0.5">USA vs MEX · SoFi Stadium · <span className="text-red-400 font-medium">LIVE 67'</span></p>
          </div>
          {/* Live score */}
          <div className="text-right">
            <div className="flex items-center gap-2 px-3 py-2 bg-bg-card border border-border-subtle rounded-xl">
              <span className="text-sm font-bold text-text-primary">USA</span>
              <span className="text-lg font-black text-blue-400">2–1</span>
              <span className="text-sm font-bold text-text-primary">MEX</span>
            </div>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-400">LIVE</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Accessibility toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex items-center justify-between p-3 stadium-card"
      >
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Accessibility size={16} className="text-emerald-400" />
          Accessibility Mode
        </div>
        <button
          onClick={() => setAccessibilityMode(!accessibilityMode)}
          className={cn('w-10 h-5 rounded-full transition-colors relative', accessibilityMode ? 'bg-emerald-500' : 'bg-white/10')}
          aria-label="Toggle accessibility mode"
        >
          <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', accessibilityMode ? 'left-[22px]' : 'left-0.5')} />
        </button>
      </motion.div>

      {/* Role-filtered alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Bell size={12} /> Stadium Alerts
          </p>
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                'p-4 rounded-xl border',
                alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                alert.severity === 'danger' ? 'bg-orange-500/5 border-orange-500/20' :
                'bg-yellow-500/5 border-yellow-500/20',
              )}
            >
              <p className="text-sm text-white leading-relaxed">{getAlertMessage(alert, 'fan')}</p>
              {getAlertActions(alert, 'fan').length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {getAlertActions(alert, 'fan').map(action => (
                    <button key={action} className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg transition-colors">
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick find */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Find</p>
        <div className="grid grid-cols-1 gap-2">
          {QUICK_FIND.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-4 p-4 stadium-card hover:border-border-strong transition-all text-left group"
            >
              <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', colorMap[item.color])}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Language selector */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Globe size={12} /> Language
        </p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all',
                lang === l.code
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                  : 'border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary',
              )}
            >
              <span>{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Assistant Chat */}
      <div>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-full flex items-center gap-3 p-4 stadium-card hover:border-blue-500/30 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <MessageSquare size={16} className="text-blue-400" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-white">Stadium AI Assistant</p>
            <p className="text-xs text-gray-500">Ask anything about the stadium, your seat, or services</p>
          </div>
          <ChevronRight size={16} className={cn('text-gray-500 transition-transform', chatOpen && 'rotate-90')} />
        </button>

        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 stadium-card p-4">
                {/* Messages */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={cn('flex', msg.from === 'user' ? 'justify-end' : 'justify-start')}>
                      {msg.from === 'ai' && (
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mr-2 mt-1 shrink-0">
                          <Zap size={10} className="text-blue-400" />
                        </div>
                      )}
                      <div className={cn(
                        'max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed',
                        msg.from === 'user'
                          ? 'bg-blue-500/20 text-white rounded-tr-none'
                          : 'bg-white/5 text-gray-200 rounded-tl-none',
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <Zap size={10} className="text-blue-400" />
                      </div>
                      <div className="flex gap-1 px-3 py-2 bg-white/5 rounded-xl rounded-tl-none">
                        {[0, 0.15, 0.3].map((d, i) => (
                          <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d }}
                            className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Input */}
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about your seat, food, transport..."
                    className="flex-1 bg-bg-inset border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand-blue/50 transition-colors"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatInput.trim() || isTyping}
                    className="px-3 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 rounded-xl transition-colors"
                  >
                    <Volume2 size={16} className="text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
