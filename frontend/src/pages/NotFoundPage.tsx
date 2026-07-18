import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-8"
        >
          <Zap size={36} className="text-blue-400" />
        </motion.div>

        <h1 className="text-8xl font-black text-text-primary mb-4">404</h1>
        <h2 className="text-xl font-bold text-text-primary mb-2">Page not found</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          This section of the stadium doesn't exist. The AI Navigator can't find a route here. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-xl transition-all"
          >
            <Home size={16} /> Back to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-6 py-3 rounded-xl transition-all"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  )
}
