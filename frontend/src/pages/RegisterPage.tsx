import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Zap, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { getRoleDashboard } from '@/lib/utils'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['fan', 'volunteer', 'staff', 'organizer']),
  preferred_language: z.string().default('en'),
})

type RegisterForm = z.infer<typeof registerSchema>

const roles = [
  { value: 'fan', label: 'Fan', desc: 'Match-goer experience' },
  { value: 'volunteer', label: 'Volunteer', desc: 'On-ground support' },
  { value: 'staff', label: 'Stadium Staff', desc: 'Operations team' },
  { value: 'organizer', label: 'Organizer', desc: 'Tournament management' },
]

export default function RegisterPage() {
  const { register: authRegister, isLoading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'fan' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null)
      await authRegister(data)
      // Redirect to role-specific landing page
      navigate(getRoleDashboard(data.role), { replace: true })

    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-text-primary">StadiumOS AI</span>
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-1">Create your account</h2>
        <p className="text-gray-400 text-sm mb-8">Join the FIFA World Cup 2026 operations platform</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </motion.div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
            <input
              {...register('full_name')}
              placeholder="Maria Santos"
              className="w-full bg-bg-inset border border-border-subtle focus:border-brand-blue/60 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors"
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="w-full bg-bg-inset border border-border-subtle focus:border-brand-blue/60 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="8+ characters"
                className="w-full bg-bg-inset border border-border-subtle focus:border-brand-blue/60 rounded-xl px-4 py-3 pr-10 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === role.value
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-border-subtle bg-bg-card hover:border-border-strong'
                  }`}
                >
                  <input type="radio" {...register('role')} value={role.value} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                    selectedRole === role.value ? 'border-blue-500' : 'border-gray-600'
                  }`}>
                    {selectedRole === role.value && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{role.label}</p>
                    <p className="text-xs text-gray-500">{role.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Creating account...</>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
