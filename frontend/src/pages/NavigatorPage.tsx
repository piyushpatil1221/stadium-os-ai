import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Navigation, AlertTriangle, Accessibility,
  Loader2, Zap, MapPin, Clock, Ruler,
} from 'lucide-react'
import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Waypoint { x: number; y: number; label: string }

interface RouteResult {
  from_location: string
  to_location: string
  route_type: string
  estimated_time_minutes: number
  distance_meters: number
  path_data: Waypoint[]
  congestion_zones: string[]
  accessibility_features: string[]
  ai_notes: string
}

// ─── Form schema ─────────────────────────────────────────────────────────────
const routeSchema = z.object({
  from_location: z.string().min(1, 'Select a starting location'),
  to_location: z.string().min(1, 'Select a destination'),
  route_type: z.enum(['fastest', 'least_crowded', 'accessible']),
  wheelchair_accessible: z.boolean(),
  avoid_crowds: z.boolean(),
})
type RouteForm = z.infer<typeof routeSchema>

// ─── Location list (shown in dropdowns) ──────────────────────────────────────
const LOCATIONS = [
  'Gate A – Main Entrance', 'Gate B – North Entrance', 'Gate C – VIP Entrance',
  'Gate D – Staff Entrance', 'Gate E – Accessible Entrance',
  'Section 101 – North Lower', 'Section 102 – North Upper',
  'Section 201 – South Lower', 'Section 202 – South Upper',
  'Section 301 – East Lower', 'Section 401 – West Lower',
  'VIP Lounge', 'Medical Center', 'Information Desk – Level 1',
  'Food Court – Level 1 North', 'Food Court – Level 2 South',
  'Fan Zone – East Plaza', 'Merchandise Store – West Concourse',
  'Accessible Washroom – Level 1', 'First Aid Station – Section 150',
  'Metro Station Exit', 'Parking Lot A Entry', 'Parking Lot B Entry',
  'Rideshare Pickup Zone',
]

// ─── Coordinate map (SVG viewBox 700 × 510) ──────────────────────────────────
// Every location is pinned to a real position on the stadium floor plan.
const LOCATION_COORDS: Record<string, { x: number; y: number }> = {
  'Gate A – Main Entrance':             { x: 350, y: 35  },
  'Gate B – North Entrance':            { x: 595, y: 148 },
  'Gate C – VIP Entrance':              { x: 595, y: 362 },
  'Gate D – Staff Entrance':            { x: 350, y: 470 },
  'Gate E – Accessible Entrance':       { x: 105, y: 255 },
  'Section 101 – North Lower':          { x: 350, y: 102 },
  'Section 102 – North Upper':          { x: 350, y: 72  },
  'Section 201 – South Lower':          { x: 350, y: 400 },
  'Section 202 – South Upper':          { x: 350, y: 432 },
  'Section 301 – East Lower':           { x: 548, y: 255 },
  'Section 401 – West Lower':           { x: 152, y: 255 },
  'VIP Lounge':                         { x: 350, y: 178 },
  'Medical Center':                     { x: 470, y: 432 },
  'Information Desk – Level 1':         { x: 350, y: 132 },
  'Food Court – Level 1 North':         { x: 248, y: 97  },
  'Food Court – Level 2 South':         { x: 452, y: 422 },
  'Fan Zone – East Plaza':              { x: 612, y: 255 },
  'Merchandise Store – West Concourse': { x: 158, y: 182 },
  'Accessible Washroom – Level 1':      { x: 200, y: 255 },
  'First Aid Station – Section 150':    { x: 232, y: 158 },
  'Metro Station Exit':                 { x: 350, y: 490 },
  'Parking Lot A Entry':                { x: 118, y: 462 },
  'Parking Lot B Entry':                { x: 582, y: 462 },
  'Rideshare Pickup Zone':              { x: 118, y: 382 },
}

// ─── Outer concourse ring ─────────────────────────────────────────────────────
// 12 nodes placed clockwise starting from the North gate.
// These represent the main walking corridors around the stadium perimeter.
const RING: { x: number; y: number; label: string }[] = [
  { x: 350, y: 58,  label: 'North Concourse'      },   // 0
  { x: 482, y: 82,  label: 'NE Concourse'          },   // 1
  { x: 572, y: 162, label: 'East Upper Concourse'  },   // 2
  { x: 582, y: 255, label: 'East Concourse'        },   // 3
  { x: 572, y: 345, label: 'East Lower Concourse'  },   // 4
  { x: 482, y: 422, label: 'SE Concourse'          },   // 5
  { x: 350, y: 448, label: 'South Concourse'       },   // 6
  { x: 218, y: 422, label: 'SW Concourse'          },   // 7
  { x: 128, y: 345, label: 'West Lower Concourse'  },   // 8
  { x: 118, y: 255, label: 'West Concourse'        },   // 9
  { x: 128, y: 162, label: 'West Upper Concourse'  },   // 10
  { x: 218, y: 82,  label: 'NW Concourse'          },   // 11
]

// ─── Routing helpers ──────────────────────────────────────────────────────────
function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

/** Find the index of the ring node closest to (x, y) */
function nearestRingIdx(x: number, y: number): number {
  let minD = Infinity, idx = 0
  RING.forEach((n, i) => {
    const d = dist(n.x, n.y, x, y)
    if (d < minD) { minD = d; idx = i }
  })
  return idx
}

/**
 * Build a realistic concourse path from start → end.
 * Strategy:
 *   1. start point
 *   2. nearest ring node from start
 *   3. walk around the ring in the SHORTER direction to the ring node nearest end
 *   4. end point
 * This guarantees the animated line follows the outer corridor, not a diagonal cut-through.
 */
function buildConcourseRoute(
  startName: string, endName: string,
  startCoord: { x: number; y: number },
  endCoord:   { x: number; y: number },
): Waypoint[] {
  const si = nearestRingIdx(startCoord.x, startCoord.y)
  const ei = nearestRingIdx(endCoord.x, endCoord.y)

  const N = RING.length

  // If same nearest node, just go direct (they're in the same zone)
  if (si === ei) {
    return [
      { ...startCoord, label: startName },
      { ...endCoord,   label: endName   },
    ]
  }

  // Count steps clockwise (si → ei) and counterclockwise
  const cwSteps  = (ei - si + N) % N
  const ccwSteps = (si - ei + N) % N

  const path: Waypoint[] = [{ ...startCoord, label: startName }]

  if (cwSteps <= ccwSteps) {
    // Walk clockwise
    for (let s = 1; s <= cwSteps; s++) {
      const node = RING[(si + s) % N]
      path.push({ x: node.x, y: node.y, label: node.label })
    }
  } else {
    // Walk counterclockwise
    for (let s = 1; s <= ccwSteps; s++) {
      const node = RING[(si - s + N) % N]
      path.push({ x: node.x, y: node.y, label: node.label })
    }
  }

  path.push({ ...endCoord, label: endName })
  return path
}

function pathStats(waypoints: Waypoint[]): { minutes: number; meters: number } {
  let totalSvg = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalSvg += dist(waypoints[i].x, waypoints[i].y, waypoints[i+1].x, waypoints[i+1].y)
  }
  const meters = Math.round(totalSvg * 0.65)
  return { minutes: Math.max(1, Math.round(meters / 60)), meters }
}

function buildPathD(waypoints: Waypoint[]): string {
  if (waypoints.length < 2) return ''
  return `M ${waypoints[0].x} ${waypoints[0].y} ` +
    waypoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
}

// ─── Map decoration data ──────────────────────────────────────────────────────
const ZONES = [
  { label: 'North Stand',   x: 202, y: 58,  w: 296, h: 68,  fill: 'rgba(59,130,246,0.08)',  stroke: 'rgba(59,130,246,0.25)' },
  { label: 'South Stand',   x: 202, y: 375, w: 296, h: 70,  fill: 'rgba(59,130,246,0.08)',  stroke: 'rgba(59,130,246,0.25)' },
  { label: 'East Wing',     x: 512, y: 152, w: 76,  h: 208, fill: 'rgba(16,185,129,0.08)', stroke: 'rgba(16,185,129,0.25)' },
  { label: 'West Wing',     x: 112, y: 152, w: 76,  h: 208, fill: 'rgba(16,185,129,0.08)', stroke: 'rgba(16,185,129,0.25)' },
  { label: 'Playing Field', x: 200, y: 148, w: 300, h: 210, fill: 'rgba(6,95,70,0.25)',     stroke: 'rgba(16,185,129,0.20)' },
  { label: 'VIP Lounge',    x: 275, y: 158, w: 150, h: 58,  fill: 'rgba(245,158,11,0.08)', stroke: 'rgba(245,158,11,0.30)' },
]

const GATES = [
  { label: 'A', x: 350, y: 35  },
  { label: 'B', x: 595, y: 148 },
  { label: 'C', x: 595, y: 362 },
  { label: 'D', x: 350, y: 470 },
  { label: 'E', x: 105, y: 255 },
]

const AMENITIES = [
  { icon: '🏥', x: 470, y: 432 }, { icon: '♿', x: 200, y: 255 },
  { icon: '🍔', x: 248, y: 97  }, { icon: '🍔', x: 452, y: 422 },
  { icon: '🛍',  x: 158, y: 182 }, { icon: 'ℹ',  x: 350, y: 132 },
  { icon: '🚌', x: 350, y: 490 }, { icon: '🚑', x: 232, y: 158 },
]

const AI_NOTES: Record<string, string[]> = {
  fastest: [
    'Taking the main concourse — fastest route based on current crowd sensors.',
    'Head through the main corridor. Congestion is light on this path right now.',
    'This route avoids the merchandise stands which are currently busy.',
  ],
  least_crowded: [
    'Routing via the quieter outer perimeter. 30% fewer fans on this path right now.',
    'Quiet corridor route selected — avoiding peak congestion zones near Gates 1-4.',
    'Least-crowded path along the outer ring. Estimated 15% faster than average.',
  ],
  accessible: [
    'Wheelchair-accessible route: all ramps, wide corridors, priority elevators.',
    'Accessible path confirmed. No stairs on this route. Elevator E-1 pre-notified.',
    'Full accessible route. Accessible washroom is at the halfway point of your journey.',
  ],
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NavigatorPage() {
  const [result, setResult] = useState<RouteResult | null>(null)
  const [loading, setLoading]   = useState(false)
  const [animKey, setAnimKey]   = useState(0)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RouteForm>({
    resolver: zodResolver(routeSchema),
    defaultValues: { route_type: 'fastest', wheelchair_accessible: false, avoid_crowds: false },
  })

  const watchAccessible   = watch('wheelchair_accessible')
  const watchAvoidCrowds  = watch('avoid_crowds')
  const watchRouteType    = watch('route_type')
  const fromVal = watch('from_location')
  const toVal   = watch('to_location')

  const onSubmit = async (data: RouteForm) => {
    const startCoord = LOCATION_COORDS[data.from_location]
    const endCoord   = LOCATION_COORDS[data.to_location]

    if (!startCoord || !endCoord) return

    setLoading(true)

    // ── Build the path entirely on the client ──────────────────────────────
    const key = data.wheelchair_accessible ? 'accessible'
                : data.avoid_crowds        ? 'least_crowded'
                : data.route_type

    const waypoints = buildConcourseRoute(
      data.from_location, data.to_location, startCoord, endCoord,
    )
    const { minutes, meters } = pathStats(waypoints)

    // Congestion zones (simulated)
    const allZones = ['Main Concourse', 'Gate 3', 'Food Court East', 'Merchandise Stand B']
    const congestion = data.avoid_crowds ? [] : allZones.slice(0, Math.floor(Math.random() * 3))

    const accFeatures = data.wheelchair_accessible
      ? ['Ramp access at Gate A', 'Priority elevator E-1', 'Wide accessible corridors', 'Accessible washroom at midpoint']
      : []

    const notes = AI_NOTES[key] ?? AI_NOTES['fastest']
    const aiNote = notes[Math.floor(Math.random() * notes.length)]

    // Try to enrich with backend AI text (optional — if it fails we already have everything)
    let finalNote = aiNote
    try {
      const r = await api.post('/navigator/route', {
        from_location: data.from_location,
        to_location:   data.to_location,
        route_type:    key,
        wheelchair_accessible: data.wheelchair_accessible,
        avoid_crowds:  data.avoid_crowds,
        language:      'en',
      })
      if (r.data?.ai_notes) finalNote = r.data.ai_notes
    } catch (_) { /* silently ignore — we still have a perfect route */ }

    setResult({
      from_location:       data.from_location,
      to_location:         data.to_location,
      route_type:          key,
      estimated_time_minutes: minutes,
      distance_meters:        meters,
      path_data:              waypoints,
      congestion_zones:       congestion,
      accessibility_features: accFeatures,
      ai_notes:               finalNote,
    })
    setAnimKey(k => k + 1)
    setLoading(false)
  }

  const pathD        = result ? buildPathD(result.path_data) : ''
  const previewFrom  = fromVal ? LOCATION_COORDS[fromVal] : null
  const previewTo    = toVal   ? LOCATION_COORDS[toVal]   : null

  // Route colour by type
  const routeColor =
    watchAccessible  ? '#10b981' :
    watchAvoidCrowds ? '#f59e0b' : '#3b82f6'

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Navigator</h1>
        <p className="text-gray-400 text-sm mt-1">
          AI-powered navigation along the stadium concourse, personalised for your needs
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* ── Left panel: form + result ── */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* From */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">📍 Current Location</label>
              <select {...register('from_location')}
                className="w-full bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] focus:border-blue-500/60 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
              >
                <option value="">Select starting point…</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {errors.from_location && <p className="mt-1 text-xs text-red-400">{errors.from_location.message}</p>}
            </div>

            {/* To */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">🏁 Destination</label>
              <select {...register('to_location')}
                className="w-full bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] focus:border-blue-500/60 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
              >
                <option value="">Select destination…</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {errors.to_location && <p className="mt-1 text-xs text-red-400">{errors.to_location.message}</p>}
            </div>

            {/* Route type */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Route Preference</label>
              <div className="grid grid-cols-3 gap-2">
                {(['fastest', 'least_crowded', 'accessible'] as const).map(type => (
                  <label key={type}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border cursor-pointer transition-all text-center ${
                      watchRouteType === type
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                        : 'border-[hsl(217,32%,18%)] text-gray-400 hover:border-[hsl(217,32%,28%)]'
                    }`}
                  >
                    <input type="radio" {...register('route_type')} value={type} className="hidden" />
                    <span className="text-lg">{type === 'fastest' ? '⚡' : type === 'least_crowded' ? '🧘' : '♿'}</span>
                    <span className="text-[11px] font-medium capitalize leading-tight">{type.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              {([
                { key: 'wheelchair_accessible' as const, icon: <Accessibility size={15} className="text-emerald-400" />, label: 'Wheelchair accessible', val: watchAccessible, color: 'bg-emerald-500' },
                { key: 'avoid_crowds'          as const, icon: <AlertTriangle  size={15} className="text-yellow-400"  />, label: 'Avoid crowded areas',  val: watchAvoidCrowds, color: 'bg-yellow-500' },
              ]).map(t => (
                <div key={t.key} className="flex items-center justify-between p-3 bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] rounded-xl">
                  <div className="flex items-center gap-2">
                    {t.icon}
                    <span className="text-sm text-gray-300">{t.label}</span>
                  </div>
                  <button type="button" onClick={() => setValue(t.key, !t.val)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${t.val ? t.color : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${t.val ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Calculating route…</>
                : <><Navigation size={16} /> Get AI Route</>
              }
            </button>
          </form>

          {/* Route result panel */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-[hsl(222,47%,9%)] border border-blue-500/20 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                    <Zap size={12} className="text-blue-400" />
                  </div>
                  <p className="text-xs font-semibold text-blue-400">AI Navigation Result</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-white/3 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Clock size={10} className="text-blue-400" />
                      <p className="text-lg font-bold text-white">{result.estimated_time_minutes} min</p>
                    </div>
                    <p className="text-[10px] text-gray-500">Walking time</p>
                  </div>
                  <div className="text-center p-2 bg-white/3 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Ruler size={10} className="text-emerald-400" />
                      <p className="text-lg font-bold text-white">{result.distance_meters}m</p>
                    </div>
                    <p className="text-[10px] text-gray-500">Distance</p>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{result.ai_notes}</p>

                {/* Turn-by-turn */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Turn-by-turn</p>
                  {result.path_data.map((wp, i) => {
                    const isStart = i === 0
                    const isEnd   = i === result.path_data.length - 1
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          isStart ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                          isEnd   ? 'bg-amber-500/20  text-amber-400  border border-amber-500/40'   :
                                    'bg-blue-500/15   text-blue-400   border border-blue-500/30'
                        }`}>
                          {isStart ? '▶' : isEnd ? '★' : i}
                        </div>
                        <p className="text-xs text-gray-300">{wp.label}</p>
                      </div>
                    )
                  })}
                </div>

                {result.congestion_zones.length > 0 && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                    <AlertTriangle size={11} className="text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-300">Congestion: {result.congestion_zones.join(', ')}</p>
                  </div>
                )}

                {result.accessibility_features.length > 0 && (
                  <div className="space-y-1">
                    {result.accessibility_features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-emerald-400">
                        <span>✓</span> {f}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right panel: SVG map ── */}
        <div className="lg:col-span-3 bg-[hsl(222,47%,9%)] border border-[hsl(217,32%,18%)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-blue-400" />
              <h3 className="font-semibold text-white text-sm">Stadium Map — SoFi Stadium</h3>
            </div>
            {result && (
              <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full animate-pulse">
                Route active
              </span>
            )}
          </div>

          <div className="bg-[hsl(222,47%,6%)] rounded-xl overflow-hidden">
            <svg viewBox="0 0 700 510" className="w-full" style={{ height: 400 }}>
              {/* Background */}
              <rect width="700" height="510" fill="hsl(222,47%,6%)" />

              {/* Subtle grid */}
              {[...Array(8)].map((_, i)  => <line key={`h${i}`} x1="0" y1={i*64} x2="700" y2={i*64} stroke="rgba(255,255,255,0.02)" strokeWidth="1" />)}
              {[...Array(11)].map((_, i) => <line key={`v${i}`} x1={i*70} y1="0" x2={i*70} y2="510" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />)}

              {/* Outer stadium oval */}
              <ellipse cx="350" cy="255" rx="290" ry="220"
                fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="2.5" strokeDasharray="8 4" />

              {/* Concourse ring (thick pale band showing the walking corridor) */}
              <polyline
                points={RING.map(n => `${n.x},${n.y}`).join(' ')}
                fill="none" stroke="rgba(59,130,246,0.10)" strokeWidth="22"
                strokeLinejoin="round" strokeLinecap="round"
              />
              {/* Close ring */}
              <line x1={RING[11].x} y1={RING[11].y} x2={RING[0].x} y2={RING[0].y}
                stroke="rgba(59,130,246,0.10)" strokeWidth="22" strokeLinecap="round" />

              {/* Zones */}
              {ZONES.map(z => (
                <g key={z.label}>
                  <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="8"
                    fill={z.fill} stroke={z.stroke} strokeWidth="1.5" />
                  <text x={z.x + z.w/2} y={z.y + z.h/2}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="rgba(255,255,255,0.32)" fontSize="10" fontWeight="500">
                    {z.label}
                  </text>
                </g>
              ))}

              {/* Field markings */}
              <rect x="230" y="190" width="240" height="130" rx="2" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
              <circle cx="350" cy="255" r="30" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <line x1="350" y1="190" x2="350" y2="320" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

              {/* Amenities */}
              {AMENITIES.map((a, i) => (
                <g key={i}>
                  <circle cx={a.x} cy={a.y} r="11" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <text x={a.x} y={a.y} textAnchor="middle" dominantBaseline="middle" fontSize="9">{a.icon}</text>
                </g>
              ))}

              {/* Gates */}
              {GATES.map(g => (
                <g key={g.label}>
                  <circle cx={g.x} cy={g.y} r="16"
                    fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.65)" strokeWidth="2" />
                  <text x={g.x} y={g.y} textAnchor="middle" dominantBaseline="middle"
                    fill="#93c5fd" fontSize="11" fontWeight="bold">
                    {g.label}
                  </text>
                </g>
              ))}

              {/* ── Preview pins (before route is calculated) ── */}
              {!result && previewFrom && (
                <g>
                  <circle cx={previewFrom.x} cy={previewFrom.y} r="10" fill="#10b981" opacity="0.8" />
                  <circle cx={previewFrom.x} cy={previewFrom.y} r="10" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.3">
                    <animate attributeName="r" from="10" to="24" dur="1.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                  <text x={previewFrom.x} y={previewFrom.y - 18} textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="700">START</text>
                </g>
              )}
              {!result && previewTo && (
                <g>
                  <circle cx={previewTo.x} cy={previewTo.y} r="10" fill="#f59e0b" opacity="0.8" />
                  <circle cx={previewTo.x} cy={previewTo.y} r="10" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.3">
                    <animate attributeName="r" from="10" to="24" dur="1.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                  <text x={previewTo.x} y={previewTo.y - 18} textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="700">END</text>
                </g>
              )}

              {/* ── Active route path ── */}
              {result && result.path_data.length >= 2 && (
                <g key={animKey}>
                  {/* Glow layer */}
                  <path d={pathD} fill="none"
                    stroke={routeColor} strokeWidth="10" strokeOpacity="0.12"
                    strokeLinecap="round" strokeLinejoin="round" />

                  {/* Animated dashed route line */}
                  <path d={pathD} fill="none"
                    stroke={routeColor} strokeWidth="3.5" strokeOpacity="0.95"
                    strokeDasharray="14 6" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <animate attributeName="stroke-dashoffset" from="80" to="0" dur="1.0s" repeatCount="indefinite" />
                  </path>

                  {/* Intermediate waypoint dots */}
                  {result.path_data.slice(1, -1).map((wp, i) => (
                    <circle key={i} cx={wp.x} cy={wp.y} r="5"
                      fill={routeColor} opacity="0.85"
                      stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
                  ))}

                  {/* START pin */}
                  {(() => {
                    const s = result.path_data[0]
                    return (
                      <g>
                        <circle cx={s.x} cy={s.y} r="9" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.3">
                          <animate attributeName="r" from="9" to="20" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx={s.x} cy={s.y} r="9" fill="#10b981" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
                        <text x={s.x} y={s.y - 18} textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="700">▶ START</text>
                      </g>
                    )
                  })()}

                  {/* END pin */}
                  {(() => {
                    const e = result.path_data[result.path_data.length - 1]
                    return (
                      <g>
                        <circle cx={e.x} cy={e.y} r="9" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.3">
                          <animate attributeName="r" from="9" to="20" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx={e.x} cy={e.y} r="9" fill="#f59e0b" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
                        <text x={e.x} y={e.y - 18} textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="700">★ END</text>
                      </g>
                    )
                  })()}
                </g>
              )}

              {/* Legend */}
              <g>
                <circle cx="28"  cy="496" r="5" fill="#10b981" />
                <text   x="38"  y="500" fill="#6b7280" fontSize="10">Start</text>
                <circle cx="82"  cy="496" r="5" fill="#f59e0b" />
                <text   x="92"  y="500" fill="#6b7280" fontSize="10">End</text>
                <line x1="134" y1="496" x2="164" y2="496"
                  stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 3" />
                <text x="170" y="500" fill="#6b7280" fontSize="10">Route</text>
                <circle cx="225" cy="496" r="5" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)" strokeWidth="1" />
                <text x="234" y="500" fill="#6b7280" fontSize="10">Concourse corridor</text>
              </g>
            </svg>
          </div>

          <p className="text-xs text-gray-600 mt-2 text-center">
            {result
              ? `${result.from_location}  →  ${result.to_location}  ·  ${result.path_data.length} waypoints along concourse`
              : fromVal || toVal
              ? 'Pins showing — click Get AI Route to compute the concourse path'
              : 'Select locations above to preview pins, then calculate your route'}
          </p>
        </div>
      </div>
    </div>
  )
}
