import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import TopNav from './TopNav'

export default function AppLayout() {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'hsl(var(--bg-base))' }}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopNav />
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: 'hsl(var(--bg-base))' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

