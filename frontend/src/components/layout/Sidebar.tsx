import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Map, Bus, Accessibility, HandHelping,
  AlertTriangle, Trophy, Settings, Zap, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  roles?: string[]
  badge?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard',         path: '/dashboard',    icon: <LayoutDashboard size={18} /> },
  { label: 'Crowd Intelligence', path: '/crowd',        icon: <Users size={18} />,       roles: ['staff', 'organizer', 'admin'] },
  { label: 'AI Navigator',      path: '/navigator',    icon: <Map size={18} /> },
  { label: 'Transport',         path: '/transport',    icon: <Bus size={18} /> },
  { label: 'Accessibility',     path: '/accessibility', icon: <Accessibility size={18} /> },
  { label: 'Volunteer Ops',     path: '/volunteers',   icon: <HandHelping size={18} />,  roles: ['volunteer', 'staff', 'organizer', 'admin'] },
  { label: 'Incident Center',   path: '/incidents',    icon: <AlertTriangle size={18} />, roles: ['volunteer', 'staff', 'organizer', 'admin'] },
  { label: 'Tournament Ops',    path: '/tournament',   icon: <Trophy size={18} />,        roles: ['organizer', 'admin'] },
  { label: 'Settings',          path: '/settings',     icon: <Settings size={18} /> },
]

const ROLE_COLORS: Record<string, string> = {
  fan: 'text-sky-400',
  volunteer: 'text-emerald-400',
  staff: 'text-orange-400',
  organizer: 'text-yellow-400',
  admin: 'text-blue-400',
}

const ROLE_LABELS: Record<string, string> = {
  fan: '🎟 Fan',
  volunteer: '🦺 Volunteer',
  staff: '👮 Staff',
  organizer: '🏟 Organizer',
  admin: '⚡ Admin',
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()

  const visibleItems = navItems.filter(
    item => !item.roles || (user && item.roles.includes(user.role)),
  )

  return (
    /* Sidebar is always dark — even in light mode. This is intentional:
       it creates the "professional enterprise dashboard" look used by
       Linear, Vercel, Notion etc. */
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex flex-col h-full overflow-hidden shrink-0"
      style={{
        background: 'hsl(222, 47%, 6%)',
        borderRight: '1px solid hsl(217, 32%, 15%)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid hsl(217, 32%, 15%)' }}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
          <Zap size={15} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-sm font-bold text-white leading-none">StadiumOS</p>
              <p className="text-[10px] text-blue-400 font-medium mt-0.5">AI Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group',
                isActive
                  ? 'bg-blue-500/15 text-blue-400 font-medium'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/6',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn(
                  'shrink-0 transition-colors',
                  isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300',
                )}>
                  {item.icon}
                </span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge && !collapsed && (
                  <span className="ml-auto shrink-0 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-3" style={{ borderTop: '1px solid hsl(217, 32%, 15%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.full_name?.[0] ?? 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-white truncate">{user?.full_name}</p>
                <span className={cn(
                  'text-[10px] font-semibold capitalize',
                  ROLE_COLORS[user?.role ?? 'fan'],
                )}>
                  {ROLE_LABELS[user?.role ?? 'fan']}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute', top: '50%', right: '-12px',
          width: 24, height: 24, borderRadius: '50%',
          background: 'hsl(222, 47%, 9%)',
          border: '1px solid hsl(217, 32%, 20%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'hsl(215, 20%, 55%)',
          cursor: 'pointer', zIndex: 10,
          transform: 'translateY(-50%)',
        }}
        className="hover:text-white transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}
