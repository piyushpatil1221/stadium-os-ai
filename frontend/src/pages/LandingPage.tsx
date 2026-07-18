import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Zap, Users, Map, Bus, Shield, Trophy, BarChart3, Globe,
  ChevronRight, ArrowRight, Activity, Brain, AlertTriangle,
  Cpu, Wifi, CheckCircle, Star
} from 'lucide-react'

const features = [
  { icon: <Brain size={22} className="text-blue-400" />, title: 'AI-Powered Intelligence', desc: 'Real-time crowd analysis, predictive routing, and automated incident response powered by generative AI.' },
  { icon: <Users size={22} className="text-emerald-400" />, title: 'Crowd Intelligence', desc: 'Live occupancy heatmaps, queue predictions, and density monitoring across all stadium zones.' },
  { icon: <Map size={22} className="text-orange-400" />, title: 'Smart Navigation', desc: 'Personalized wayfinding with accessibility support, crowd-avoiding routes, and real-time updates.' },
  { icon: <Bus size={22} className="text-purple-400" />, title: 'Transport Coordination', desc: 'Integrated metro, bus, parking and rideshare status with AI exit recommendations.' },
  { icon: <Shield size={22} className="text-red-400" />, title: 'Incident Center', desc: 'AI-triaged incident management with severity scoring, team dispatch, and live timelines.' },
  { icon: <Trophy size={22} className="text-yellow-400" />, title: 'Tournament Dashboard', desc: 'Organizer-level analytics — revenue, attendance trends, sustainability, and operational KPIs.' },
]

const stats = [
  { value: '80K+', label: 'Fans Served Per Match' },
  { value: '< 2s', label: 'AI Response Time' },
  { value: '99.9%', label: 'Platform Uptime' },
  { value: '12', label: 'Active Modules' },
]

const testimonials = [
  { name: 'Rodrigo Silva', role: 'Stadium Director, Brazil', text: "StadiumOS AI transformed how we manage 78,000 fans. The crowd intelligence module alone prevented three major congestion events." },
  { name: 'Sarah Chen', role: 'Operations Lead, FIFA', text: "The incident center's AI triage cut our response time from 8 minutes to under 90 seconds. It's remarkable technology." },
  { name: 'James Okafor', role: 'Head of Volunteer Ops', text: "Managing 500+ volunteers used to be chaos. The AI workload balancer keeps everyone optimally deployed across all zones." },

]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-bg-base/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-text-primary text-sm">StadiumOS AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#stats" className="hover:text-white transition-colors">Platform</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-bg opacity-40" />
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              FIFA World Cup 2026 · Official Stadium Platform
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-tight tracking-tight"
          >
            The AI Operating System{' '}
            <span className="text-gradient-blue">for Smart Stadiums</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            StadiumOS AI unifies crowd intelligence, transport coordination, incident response,
            volunteer management, and real-time navigation into one platform — built for the world's
            biggest football tournament.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20 w-full sm:w-auto justify-center"
            >
              Start Free Trial <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-6 py-3 rounded-xl transition-all w-full sm:w-auto justify-center"
            >
              Sign In to Dashboard
            </Link>
          </motion.div>
        </div>

        {/* Stadium SVG illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="relative bg-bg-card border border-border-subtle rounded-2xl overflow-hidden shadow-2xl">
            {/* Mock dashboard preview */}
            <div className="bg-bg-elevated border-b border-border-subtle px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4 bg-bg-card rounded px-3 py-0.5">
                <p className="text-xs text-gray-600">stadiumos.ai/dashboard</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total Attendance', value: '68,421', color: 'blue' },
                  { label: 'Crowd Density', value: '86.2%', color: 'yellow' },
                  { label: 'Active Incidents', value: '4', color: 'red' },
                  { label: 'Volunteers On Duty', value: '247', color: 'emerald' },
                ].map((item) => (
                  <div key={item.label} className="stadium-card p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{item.label}</p>
                    <p className={`text-xl font-bold mt-1 text-${item.color}-400`}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 stadium-card p-3 h-28 flex items-center justify-center">
                  <div className="w-full space-y-1.5">
                    {['North Stand', 'South Stand', 'East Wing'].map((zone, i) => (
                      <div key={zone} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 w-20">{zone}</span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${[92, 67, 45][i]}%` }}
                            transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
                            className={`h-full rounded-full ${['bg-red-500', 'bg-yellow-500', 'bg-emerald-500'][i]}`}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 w-8">{[92, 67, 45][i]}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="stadium-card p-3 h-28 flex flex-col justify-between">
                  <p className="text-[10px] text-gray-500">LIVE MATCH</p>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-lg font-bold text-white">USA</span>
                      <span className="text-2xl font-black text-blue-400">2–1</span>
                      <span className="text-lg font-bold text-white">MEX</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] text-red-400">67'</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl font-black text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-blue-400 uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to run a world-class stadium</h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Twelve tightly integrated modules working together, powered by AI at every layer.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="stadium-card p-5 hover:border-[hsl(217,32%,28%)] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/8 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-white text-sm mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-bg-elevated">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl font-bold">Trusted by stadium professionals worldwide</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="stadium-card p-5"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={12} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="stadium-card p-12"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Zap size={28} className="text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Ready to upgrade your stadium operations?</h2>
            <p className="text-gray-400 mb-8">Join the FIFA World Cup 2026 platform powering smarter, safer, and more sustainable stadiums.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-xl transition-all"
              >
                Create Account <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-6 py-3 rounded-xl transition-all"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold">StadiumOS AI</span>
            <span className="text-xs text-gray-600 ml-2">FIFA World Cup 2026</span>
          </div>
          <div className="flex gap-6 text-xs text-gray-600">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-gray-400 transition-colors">API</a>
          </div>
          <p className="text-xs text-gray-600">© 2026 StadiumOS AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
