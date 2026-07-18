import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-[hsl(224,71%,4%)] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500"
        />
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-gray-400 font-medium">StadiumOS AI</span>
        </div>
      </motion.div>
    </div>
  )
}
