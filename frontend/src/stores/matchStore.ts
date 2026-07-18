/**
 * matchStore.ts
 * Global Zustand store for live match data.
 * Single source of truth shared between:
 *   - OrganizerDashboard (writes match list, controls timing)
 *   - TournamentPage (reads matches, displays schedule + analytics)
 *   - TopNav (live score indicator)
 *   - Any dashboard overview
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ScheduledMatch {
  id: number
  home: string
  away: string
  homeFlag: string
  awayFlag: string
  date: string
  time: string
  venue: string
  stage: string
  capacity: number
  expectedAttendance: number
  ticketPrice: number
  status: 'scheduled' | 'live' | 'completed'
  score?: string
  actualAttendance?: number
}

export interface LiveMatchState {
  homeTeam: string
  awayTeam: string
  homeFlag: string
  awayFlag: string
  homeScore: number
  awayScore: number
  minute: number
  isRunning: boolean
  stage: string
  venue: string
  events: MatchEvent[]
}

export interface MatchEvent {
  id: number
  minute: number
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'var'
  team: 'home' | 'away'
  player: string
  description: string
}

interface MatchStore {
  // Scheduled matches list (organizer manages)
  matches: ScheduledMatch[]
  addMatch: (m: Omit<ScheduledMatch, 'id' | 'status'>) => void
  removeMatch: (id: number) => void
  updateMatchStatus: (id: number, status: ScheduledMatch['status'], score?: string, actualAttendance?: number) => void

  // Live match state (read-only score, organizer controls timing)
  live: LiveMatchState
  setMinute: (minute: number) => void
  setRunning: (running: boolean) => void
  jumpToHalfTime: () => void
  jumpToFullTime: () => void

  // Attendance (organizer sets)
  currentAttendance: number
  currentCapacity: number
  setAttendance: (n: number) => void
  setCapacity: (n: number) => void
}

const INITIAL_EVENTS: MatchEvent[] = [
  { id: 1, minute: 23, type: 'goal', team: 'home', player: 'C. Pulisic', description: 'Goal! Beautiful strike from outside the box.' },
  { id: 2, minute: 41, type: 'yellow_card', team: 'away', player: 'H. Herrera', description: 'Tactical foul on the break.' },
  { id: 3, minute: 58, type: 'goal', team: 'home', player: 'T. Adams', description: 'Header from a corner kick.' },
  { id: 4, minute: 61, type: 'goal', team: 'away', player: 'H. Lozano', description: 'Quick counter-attack finish.' },
  { id: 5, minute: 65, type: 'var', team: 'home', player: 'VAR Review', description: 'Goal reviewed and confirmed.' },
]

const INITIAL_MATCHES: ScheduledMatch[] = [
  {
    id: 1, home: 'USA', away: 'MEX', homeFlag: '🇺🇸', awayFlag: '🇲🇽',
    date: '2026-07-18', time: '20:00', venue: 'SoFi Stadium, LA',
    stage: 'Quarter-Final', capacity: 72000, expectedAttendance: 70000, ticketPrice: 320,
    status: 'live', score: '2-1', actualAttendance: 68421,
  },
  {
    id: 2, home: 'BRA', away: 'ARG', homeFlag: '🇧🇷', awayFlag: '🇦🇷',
    date: '2026-07-20', time: '19:00', venue: 'Rose Bowl, Pasadena',
    stage: 'Quarter-Final', capacity: 88565, expectedAttendance: 85000, ticketPrice: 380,
    status: 'scheduled',
  },
  {
    id: 3, home: 'FRA', away: 'ENG', homeFlag: '🇫🇷', awayFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    date: '2026-07-22', time: '18:00', venue: 'AT&T Stadium, Dallas',
    stage: 'Semi-Final', capacity: 80000, expectedAttendance: 78000, ticketPrice: 420,
    status: 'scheduled',
  },
  {
    id: 4, home: 'GER', away: 'JPN', homeFlag: '🇩🇪', awayFlag: '🇯🇵',
    date: '2026-07-15', time: '21:00', venue: 'MetLife Stadium, NJ',
    stage: 'Round of 16', capacity: 82500, expectedAttendance: 80000, ticketPrice: 280,
    status: 'completed', score: '2-0', actualAttendance: 81203,
  },
  {
    id: 5, home: 'ESP', away: 'POR', homeFlag: '🇪🇸', awayFlag: '🇵🇹',
    date: '2026-07-14', time: '20:00', venue: 'Levi\'s Stadium, SF',
    stage: 'Round of 16', capacity: 68500, expectedAttendance: 67000, ticketPrice: 260,
    status: 'completed', score: '1-1 (4-3 pens)', actualAttendance: 68100,
  },
]

export const useMatchStore = create<MatchStore>()(
  persist(
    (set) => ({
      matches: INITIAL_MATCHES,
      currentAttendance: 68421,
      currentCapacity: 72000,

      addMatch: (m) =>
        set((s) => ({
          matches: [...s.matches, { ...m, id: Date.now(), status: 'scheduled' }],
        })),

      removeMatch: (id) =>
        set((s) => ({ matches: s.matches.filter((m) => m.id !== id) })),

      updateMatchStatus: (id, status, score, actualAttendance) =>
        set((s) => ({
          matches: s.matches.map((m) =>
            m.id === id ? { ...m, status, score, actualAttendance } : m,
          ),
        })),

      setAttendance: (n) => set({ currentAttendance: n }),
      setCapacity: (n) => set({ currentCapacity: n }),

      live: {
        homeTeam: 'USA',
        awayTeam: 'MEX',
        homeFlag: '🇺🇸',
        awayFlag: '🇲🇽',
        homeScore: 2,
        awayScore: 1,
        minute: 67,
        isRunning: true,
        stage: 'Quarter-Final',
        venue: 'SoFi Stadium, LA',
        events: INITIAL_EVENTS,
      },

      setMinute: (minute) =>
        set((s) => ({ live: { ...s.live, minute } })),

      setRunning: (isRunning) =>
        set((s) => ({ live: { ...s.live, isRunning } })),

      jumpToHalfTime: () =>
        set((s) => ({ live: { ...s.live, minute: 45, isRunning: false } })),

      jumpToFullTime: () =>
        set((s) => ({ live: { ...s.live, minute: 90, isRunning: false } })),
    }),
    {
      name: 'stadiumos-match-store',
      // Only persist matches list and attendance; live state resets on reload
      partialize: (state) => ({
        matches: state.matches,
        currentAttendance: state.currentAttendance,
        currentCapacity: state.currentCapacity,
      }),
    },
  ),
)
