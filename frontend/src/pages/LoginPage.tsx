import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Zap, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { getRoleDashboard } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().default(false),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null)
      await login(data.email, data.password)
      // Redirect to the dashboard appropriate for this user's role.
      // useAuth updates `user` synchronously from the API response, so we
      // read it from localStorage which AuthProvider persists immediately.
      const stored = localStorage.getItem('stadiumos_user')
      const role: string = stored ? (JSON.parse(stored) as { role: string }).role : 'fan'
      navigate(getRoleDashboard(role), { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials. Please try again.'
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? message)
    }
  }

  const fillDemo = (role: string) => {
    const creds: Record<string, { email: string; password: string }> = {
      admin: { email: 'admin@stadiumos.ai', password: 'admin1234' },
      organizer: { email: 'organizer@stadiumos.ai', password: 'organizer1234' },
      staff: { email: 'staff@stadiumos.ai', password: 'staff1234' },
      fan: { email: 'fan@stadiumos.ai', password: 'fan12345' },
    }
    if (creds[role]) {
      setValue('email', creds[role].email)
      setValue('password', creds[role].password)
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(224,71%,4%)] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(222,47%,6%)] border-r border-[hsl(217,32%,18%)] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white">StadiumOS AI</p>
              <p className="text-[10px] text-blue-400">FIFA World Cup 2026</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            The command center for world-class stadium operations.
          </h1>
          <p className="text-gray-400 mt-4 leading-relaxed">
            AI-powered crowd intelligence, real-time incident response, smart navigation, and operational analytics — all in one platform.
          </p>
        </div>
        {/* Floating stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Fans Served', value: '2.4M+' },
            { label: 'Avg Response Time', value: '< 90s' },
            { label: 'Incidents Resolved', value: '99.2%' },
            { label: 'Uptime SLA', value: '99.9%' },
          ].map((stat) => (
            <div key={stat.label} className="stadium-card p-4">
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">StadiumOS AI</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-8">Sign in to your StadiumOS account</p>

          {/* Demo quick-fill */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Quick Demo Access</p>
            <div className="flex flex-wrap gap-2">
              {['admin', 'organizer', 'staff', 'fan'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(role)}
                  className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 capitalize transition-colors"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@stadiumos.ai"
                autoComplete="email"
                className="w-full bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] focus:border-blue-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-gray-400">Password</label>
                <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] focus:border-blue-500/60 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                {...register('remember_me')}
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-[hsl(217,32%,18%)] bg-[hsl(222,47%,9%)] accent-blue-500"
              />
              <label htmlFor="remember" className="text-sm text-gray-400">Remember me</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
