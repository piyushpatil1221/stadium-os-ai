import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Bell, Shield, Globe, Loader2, CheckCircle, Save } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import api from '@/lib/api'

const profileSchema = z.object({
  full_name: z.string().min(2),
  preferred_language: z.string(),
  accessibility_needs: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'pt', label: 'Português' },
  { value: 'ar', label: 'العربية' },
  { value: 'hi', label: 'हिन्दी' },
]

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? '',
      preferred_language: user?.preferred_language ?? 'en',
      accessibility_needs: user?.accessibility_needs ?? '',
    },
  })

  const onSubmit = async (data: ProfileForm) => {
    try {
      const res = await api.patch('/auth/me', data)
      updateUser(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={15} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
    { id: 'security', label: 'Security', icon: <Shield size={15} /> },
    { id: 'language', label: 'Language', icon: <Globe size={15} /> },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account and platform preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-inset border border-border-subtle rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {/* Avatar */}
          <div className="stadium-card p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {user?.full_name?.[0] ?? 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user?.full_name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
              <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="stadium-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Personal Information</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                <input
                  {...register('full_name')}
                  className="w-full bg-bg-inset border border-border-subtle focus:border-brand-blue/60 rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                <input
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full bg-bg-inset border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-muted cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Preferred Language</label>
              <select
                {...register('preferred_language')}
                className="w-full bg-bg-inset border border-border-subtle focus:border-brand-blue/60 rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none"
              >
                {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Accessibility Needs</label>
              <textarea
                {...register('accessibility_needs')}
                rows={3}
                placeholder="e.g. Wheelchair user, visual impairment, hearing aid..."
                className="w-full bg-bg-inset border border-border-subtle focus:border-brand-blue/60 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none resize-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Changes
              </button>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-emerald-400 text-sm"
                >
                  <CheckCircle size={15} /> Saved
                </motion.div>
              )}
            </div>
          </div>
        </motion.form>
      )}

      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stadium-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Notification Preferences</h3>
          {[
            { label: 'Critical Incident Alerts', desc: 'Immediate notifications for critical incidents', enabled: true },
            { label: 'Crowd Density Warnings', desc: 'Alert when zones exceed 85% capacity', enabled: true },
            { label: 'Transport Disruptions', desc: 'Notify when metro or buses are delayed', enabled: true },
            { label: 'Weather Advisories', desc: 'Stadium weather and safety updates', enabled: false },
            { label: 'Match Score Updates', desc: 'Live score notifications', enabled: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
              <div>
                <p className="text-sm text-text-primary font-medium">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <div className={`w-9 h-5 rounded-full cursor-pointer transition-colors ${item.enabled ? 'bg-blue-500' : 'bg-white/10'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow m-0.5 transition-transform ${item.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stadium-card p-6 space-y-5">
          <h3 className="text-sm font-semibold text-text-primary">Security Settings</h3>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Current Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-bg-inset border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
            <input type="password" placeholder="8+ characters" className="w-full bg-bg-inset border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none" />
          </div>
          <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all">
            <Shield size={15} /> Update Password
          </button>
        </motion.div>
      )}

      {activeTab === 'language' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stadium-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Platform Language</h3>
          <div className="grid grid-cols-2 gap-2">
            {languages.map(lang => (
              <button
                key={lang.value}
                className={`p-3 rounded-xl border text-left transition-all ${
                  user?.preferred_language === lang.value
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                    : 'border-border-subtle text-text-secondary hover:border-border-strong'
                }`}
              >
                <p className="text-sm font-medium">{lang.label}</p>
                <p className="text-[10px] text-gray-500">{lang.value.toUpperCase()}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
