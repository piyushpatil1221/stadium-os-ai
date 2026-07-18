import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, LogOut, Settings, ChevronDown, Moon, Sun } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useTheme } from '@/providers/ThemeProvider'
import { cn } from '@/lib/utils'

const mockAlerts = [
  { id: 1, title: 'Crowd Alert', message: 'North Stand approaching capacity (92%)', severity: 'danger', time: '2m ago' },
  { id: 2, title: 'Medical Response Active', message: 'Section B12 medical team dispatched', severity: 'warning', time: '5m ago' },
  { id: 3, title: 'Metro Line 2 Delayed', message: '30-min delay — use Shuttle Route A', severity: 'warning', time: '12m ago' },
]

export default function TopNav() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header
      className="h-14 flex items-center gap-4 px-5 shrink-0 transition-all duration-250"
      style={{
        background: 'hsl(var(--bg-card))',
        borderBottom: '1px solid hsl(var(--border-subtle))',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--text-muted))' }} />
          <input
            type="text"
            placeholder="Search… (⌘K)"
            readOnly
            className="w-full rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none transition-all"
            style={{
              background: 'hsl(var(--bg-inset))',
              border: '1px solid hsl(var(--border-subtle))',
              color: 'hsl(var(--text-primary))',
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Match live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: 'hsl(0 84% 60% / 0.08)', border: '1px solid hsl(0 84% 60% / 0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-semibold text-red-400">USA 2 – 1 MEX · LIVE</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
          style={{
            background: 'hsl(var(--bg-inset))',
            border: '1px solid hsl(var(--border-subtle))',
            color: 'hsl(var(--text-secondary))',
          }}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <motion.div
            key={isDark ? 'moon' : 'sun'}
            initial={{ rotate: -30, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </motion.div>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false) }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{
              background: 'hsl(var(--bg-inset))',
              border: '1px solid hsl(var(--border-subtle))',
              color: 'hsl(var(--text-secondary))',
            }}
            aria-label="Notifications"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2"
              style={{ borderColor: 'hsl(var(--bg-card))' }}
            />
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-80 rounded-2xl z-50 overflow-hidden"
                style={{
                  background: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border-default))',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div className="p-4" style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>Notifications</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
                    {mockAlerts.length} active alerts
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y"
                  style={{ borderColor: 'hsl(var(--border-subtle))' }}>
                  {mockAlerts.map(alert => (
                    <div key={alert.id}
                      className="p-4 cursor-pointer transition-colors"
                      style={{ ':hover': { background: 'hsl(var(--bg-inset))' } } as any}
                      onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--bg-inset))')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
                            {alert.title}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-secondary))' }}>
                            {alert.message}
                          </p>
                        </div>
                        <span className={cn('text-[10px] font-medium shrink-0',
                          alert.severity === 'danger' ? 'text-red-400' : 'text-yellow-400',
                        )}>
                          {alert.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2" style={{ borderTop: '1px solid hsl(var(--border-subtle))' }}>
                  <button
                    onClick={() => { navigate('/incidents'); setShowNotifs(false) }}
                    className="w-full text-xs text-blue-400 hover:text-blue-300 py-1.5 text-center transition-colors rounded-lg"
                  >
                    View all in Incident Center →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false) }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all"
            style={{ color: 'hsl(var(--text-primary))' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--bg-inset))')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.full_name?.[0] ?? 'U'}
            </div>
            <span className="hidden sm:block text-xs font-medium" style={{ color: 'hsl(var(--text-primary))' }}>
              {user?.full_name?.split(' ')[0]}
            </span>
            <ChevronDown size={12} style={{ color: 'hsl(var(--text-muted))' }} />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-52 rounded-2xl z-50 overflow-hidden"
                style={{
                  background: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border-default))',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div className="p-3" style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}>
                  <p className="text-xs font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
                    {user?.full_name}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
                    {user?.email}
                  </p>
                  <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize font-medium">
                    {user?.role}
                  </span>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { navigate('/settings'); setShowProfile(false) }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs rounded-xl transition-colors font-medium"
                    style={{ color: 'hsl(var(--text-secondary))' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--bg-inset))')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <Settings size={13} /> Settings
                  </button>
                  <button
                    onClick={() => { logout(); navigate('/login') }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 rounded-xl transition-colors font-medium"
                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(0 84% 60% / 0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
