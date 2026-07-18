import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Accessibility, Volume2, ZoomIn, Eye, MapPin, ArrowUpDown, Toilet,
  CheckCircle, Navigation, PhoneCall, X, AlertCircle, Mic, MicOff,
} from 'lucide-react'

const facilities = [
  { icon: <Toilet size={16} />, name: 'Accessible Washroom A', location: 'Level 1, Near Gate A', status: 'available', distance: '80m' },
  { icon: <Toilet size={16} />, name: 'Accessible Washroom B', location: 'Level 2, East Wing', status: 'available', distance: '180m' },
  { icon: <ArrowUpDown size={16} />, name: 'Elevator E-1', location: 'Gate A, Level 0–2', status: 'operational', distance: '45m' },
  { icon: <ArrowUpDown size={16} />, name: 'Elevator E-2', location: 'Gate B, Level 0–3', status: 'operational', distance: '220m' },
  { icon: <ArrowUpDown size={16} />, name: 'Elevator E-3', location: 'Central Atrium', status: 'out_of_service', distance: '310m' },
  { icon: <MapPin size={16} />, name: 'Accessible Viewing Area', location: 'Section A1 – Pitch Level', status: 'available', distance: '150m' },
]

const routes = [
  {
    name: 'Gate A → Section A1 (Accessible)',
    time: '8 min',
    features: ['Ramp at Gate A', 'Elevator E-1', 'Wide corridors'],
    type: 'recommended',
    instructions: 'Head through Gate A, take the first ramp on your right, then use Elevator E-1 to Level 2. Follow the green accessible strip to Section A1.',
  },
  {
    name: 'Gate E → VIP Lounge',
    time: '5 min',
    features: ['Accessible Entry Gate', 'Priority elevator', 'Level access throughout'],
    type: 'short',
    instructions: 'Enter through Gate E (accessible entrance). Priority elevator is directly ahead. Exit on Level 2, VIP Lounge is 30 meters on your left.',
  },
  {
    name: 'Gate B → First Aid',
    time: '4 min',
    features: ['Ramp access', 'Smooth path', 'Clear signage'],
    type: 'emergency',
    instructions: 'From Gate B, proceed straight 50 meters. Take the ramp down to Level 1. First Aid station is marked with the red cross, immediately on your right.',
  },
]

const VOICE_ROUTES: Record<string, string> = {
  'Gate A → Section A1 (Accessible)': 'Head through Gate A, take the first ramp on your right, then use Elevator E-1 to Level 2. Follow the green accessible strip to Section A1.',
  'Gate E → VIP Lounge': 'Enter through Gate E. Priority elevator is directly ahead. Exit on Level 2. VIP Lounge is 30 meters on your left.',
  'Gate B → First Aid': 'From Gate B, proceed straight 50 meters. Take the ramp down to Level 1. First Aid station is on your right.',
}

export default function AccessibilityPage() {
  const [largeText, setLargeText] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Apply high contrast to root element
  useEffect(() => {
    const root = document.documentElement
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    return () => root.classList.remove('high-contrast')
  }, [highContrast])

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  const speak = (text: string) => {
    if (!voiceEnabled) return
    window.speechSynthesis?.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.05
    utterance.volume = 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    synthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }

  const handleVoiceToggle = () => {
    const next = !voiceEnabled
    setVoiceEnabled(next)
    if (!next) stopSpeaking()
    else speak('Voice assistance is now active. Select a route to hear turn-by-turn directions.')
  }

  const handleRouteVoice = (route: typeof routes[number]) => {
    if (!voiceEnabled) {
      setVoiceEnabled(true)
      setTimeout(() => speak(route.instructions), 200)
    } else {
      speak(route.instructions)
    }
    setSelectedRoute(route.name)
  }

  const handleRequestAssistance = () => {
    setShowRequestModal(false)
    setRequestSent(true)
    if (voiceEnabled) speak('Your assistance request has been submitted. A mobility aide will meet you at Gate A information desk within 3 minutes.')
    setTimeout(() => setRequestSent(false), 6000)
  }

  const textSizeClass = largeText ? 'text-lg' : ''
  const cardBase = 'rounded-xl border transition-all duration-200'

  return (
    <div className={`p-6 space-y-6 max-w-7xl mx-auto ${textSizeClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`font-bold text-white ${largeText ? 'text-3xl' : 'text-2xl'}`}>Accessibility Hub</h1>
          <p className={`text-gray-400 mt-1 ${largeText ? 'text-base' : 'text-sm'}`}>
            Wheelchair routing, accessible facilities, and assistive features
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl transition-all text-sm font-medium"
        >
          <PhoneCall size={15} />
          Request Assistance
        </button>
      </div>

      {/* Voice speaking indicator */}
      <AnimatePresence>
        {speaking && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5 items-end h-5">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="w-1 bg-blue-400 rounded-sm animate-pulse"
                    style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <p className="text-sm text-blue-300 font-medium">Voice guidance playing...</p>
            </div>
            <button onClick={stopSpeaking} className="text-blue-400 hover:text-white transition-colors">
              <MicOff size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assistive Feature Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Voice Assistance */}
        <motion.button
          onClick={handleVoiceToggle}
          whileTap={{ scale: 0.97 }}
          className={`${cardBase} p-4 text-left ${voiceEnabled
            ? 'border-blue-500/40 bg-blue-500/8'
            : 'border-[hsl(217,32%,18%)] hover:border-[hsl(217,32%,28%)] bg-[hsl(222,47%,9%)]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              voiceEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'
            }`}>
              {speaking ? <Mic size={20} className="animate-pulse text-blue-400" /> : <Volume2 size={20} />}
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors relative ${voiceEnabled ? 'bg-blue-500' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${voiceEnabled ? 'left-[18px]' : 'left-0.5'}`} />
            </div>
          </div>
          <p className={`font-semibold text-white ${largeText ? 'text-base' : 'text-sm'}`}>Voice Assistance</p>
          <p className={`text-gray-400 mt-0.5 ${largeText ? 'text-sm' : 'text-xs'}`}>
            {voiceEnabled ? 'Tap a route to hear directions' : 'Audio turn-by-turn navigation'}
          </p>
          {voiceEnabled && (
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle size={12} className="text-blue-400" />
              <span className="text-xs text-blue-400">Active — using device speaker</span>
            </div>
          )}
        </motion.button>

        {/* Large Text */}
        <motion.button
          onClick={() => setLargeText(!largeText)}
          whileTap={{ scale: 0.97 }}
          className={`${cardBase} p-4 text-left ${largeText
            ? 'border-emerald-500/40 bg-emerald-500/8'
            : 'border-[hsl(217,32%,18%)] hover:border-[hsl(217,32%,28%)] bg-[hsl(222,47%,9%)]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              largeText ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'
            }`}>
              <ZoomIn size={20} />
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors relative ${largeText ? 'bg-emerald-500' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${largeText ? 'left-[18px]' : 'left-0.5'}`} />
            </div>
          </div>
          <p className={`font-semibold text-white ${largeText ? 'text-base' : 'text-sm'}`}>Large Text Mode</p>
          <p className={`text-gray-400 mt-0.5 ${largeText ? 'text-sm' : 'text-xs'}`}>Increase font size throughout app</p>
          {largeText && (
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle size={12} className="text-emerald-400" />
              <span className="text-xs text-emerald-400">Active</span>
            </div>
          )}
        </motion.button>

        {/* High Contrast */}
        <motion.button
          onClick={() => setHighContrast(!highContrast)}
          whileTap={{ scale: 0.97 }}
          className={`${cardBase} p-4 text-left ${highContrast
            ? 'border-orange-500/40 bg-orange-500/8'
            : 'border-[hsl(217,32%,18%)] hover:border-[hsl(217,32%,28%)] bg-[hsl(222,47%,9%)]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              highContrast ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-400'
            }`}>
              <Eye size={20} />
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors relative ${highContrast ? 'bg-orange-500' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${highContrast ? 'left-[18px]' : 'left-0.5'}`} />
            </div>
          </div>
          <p className={`font-semibold text-white ${largeText ? 'text-base' : 'text-sm'}`}>High Contrast</p>
          <p className={`text-gray-400 mt-0.5 ${largeText ? 'text-sm' : 'text-xs'}`}>Enhanced visual contrast mode</p>
          {highContrast && (
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle size={12} className="text-orange-400" />
              <span className="text-xs text-orange-400">Active — high contrast applied</span>
            </div>
          )}
        </motion.button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Accessible Routes */}
        <div className="bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] rounded-xl p-5">
          <h3 className={`font-semibold text-white mb-4 flex items-center gap-2 ${largeText ? 'text-base' : 'text-sm'}`}>
            <Navigation size={16} className="text-emerald-400" /> Accessible Routes
          </h3>
          <div className="space-y-3">
            {routes.map((route, i) => (
              <motion.div
                key={route.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedRoute === route.name
                    ? 'border-blue-500/40 bg-blue-500/5'
                    : 'border-[hsl(217,32%,18%)] hover:border-emerald-500/30'
                }`}
                onClick={() => handleRouteVoice(route)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className={`font-medium text-white ${largeText ? 'text-base' : 'text-sm'}`}>{route.name}</p>
                    <p className={`text-gray-500 mt-0.5 ${largeText ? 'text-sm' : 'text-xs'}`}>♿ Walking time: {route.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {voiceEnabled && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${speaking && selectedRoute === route.name ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'}`}>
                        <Volume2 size={11} />
                      </div>
                    )}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      route.type === 'recommended' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                      route.type === 'emergency' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                      'text-blue-400 bg-blue-500/10 border-blue-500/20'
                    }`}>
                      {route.type}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {route.features.map(f => (
                    <span key={f} className="text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 px-2 py-0.5 rounded-full">
                      ✓ {f}
                    </span>
                  ))}
                </div>
                {selectedRoute === route.name && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-[hsl(217,32%,18%)]"
                  >
                    <p className={`text-gray-300 leading-relaxed ${largeText ? 'text-sm' : 'text-xs'}`}>{route.instructions}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Accessible Facilities */}
        <div className="bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] rounded-xl p-5">
          <h3 className={`font-semibold text-white mb-4 flex items-center gap-2 ${largeText ? 'text-base' : 'text-sm'}`}>
            <Accessibility size={16} className="text-blue-400" /> Accessible Facilities
          </h3>
          <div className="space-y-2">
            {facilities.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/3 transition-colors cursor-pointer"
                onClick={() => voiceEnabled && speak(`${f.name} is located at ${f.location}, approximately ${f.distance} away. Status: ${f.status === 'out_of_service' ? 'out of service' : f.status}.`)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  f.status === 'out_of_service' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-white font-medium ${largeText ? 'text-base' : 'text-sm'}`}>{f.name}</p>
                  <p className={`text-gray-500 ${largeText ? 'text-sm' : 'text-xs'}`}>{f.location}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-gray-400 ${largeText ? 'text-sm' : 'text-xs'}`}>{f.distance}</p>
                  <span className={`font-medium ${f.status === 'out_of_service' ? 'text-red-400' : 'text-emerald-400'} ${largeText ? 'text-sm' : 'text-[10px]'}`}>
                    {f.status === 'out_of_service' ? '⚠ Closed' : '● Open'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency contacts */}
      <div className="bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] rounded-xl p-5">
        <h3 className={`font-semibold text-white mb-4 ${largeText ? 'text-base' : 'text-sm'}`}>
          Accessibility Support Contacts
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { role: 'Accessibility Coordinator', contact: 'Zone A Desk · Ext. 101', voice: 'Accessibility Coordinator is at Zone A desk. Call extension 101.' },
            { role: 'Medical Assistance', contact: 'Medical Center Level 1 · Ext. 999', voice: 'Medical assistance is available at Medical Center Level 1. Call extension 999.' },
            { role: 'Mobility Aid Request', contact: 'Gate A Information · Ext. 205', voice: 'Request mobility aid at Gate A information desk. Call extension 205.' },
          ].map((c) => (
            <div
              key={c.role}
              className="p-3 bg-white/3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => voiceEnabled && speak(c.voice)}
            >
              <p className={`font-medium text-white ${largeText ? 'text-sm' : 'text-xs'}`}>{c.role}</p>
              <p className={`text-gray-400 mt-0.5 ${largeText ? 'text-sm' : 'text-xs'}`}>{c.contact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Request Assistance Success Banner */}
      <AnimatePresence>
        {requestSent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl shadow-2xl max-w-sm"
          >
            <CheckCircle size={20} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Assistance Requested</p>
              <p className="text-xs text-gray-400 mt-0.5">A mobility aide will meet you at Gate A within 3 minutes</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Assistance Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRequestModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,22%)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Request Accessibility Assistance</h2>
                  <p className="text-sm text-gray-400 mt-1">A trained mobility aide will be dispatched to your location.</p>
                </div>
                <button onClick={() => setShowRequestModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  { label: 'Wheelchair assistance', icon: '♿' },
                  { label: 'Visual impairment guide', icon: '👁' },
                  { label: 'Hearing loop device', icon: '🔊' },
                  { label: 'General mobility support', icon: '🦽' },
                ].map(opt => (
                  <label key={opt.label} className="flex items-center gap-3 p-3 rounded-xl border border-[hsl(217,32%,18%)] hover:border-emerald-500/30 cursor-pointer transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-emerald-500" />
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-sm text-gray-200">{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-5">
                <AlertCircle size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-300">Aide will meet you at your current section. Average response time is 2–4 minutes.</p>
              </div>

              <button
                onClick={handleRequestAssistance}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Confirm Request
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
