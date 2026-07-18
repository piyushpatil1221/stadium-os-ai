/**
 * useStadiumWebSocket — Real-time WebSocket hook for StadiumOS AI.
 *
 * Connects to the backend WebSocket hub with JWT authentication,
 * auto-reconnects with exponential backoff, and exposes typed
 * event streams for crowd updates, incidents, and alerts.
 */
import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CrowdZoneUpdate {
  zone: string
  density: number
  status: 'normal' | 'busy' | 'critical'
}

export interface WSCrowdUpdate {
  type: 'crowd_update'
  timestamp: string
  zones: CrowdZoneUpdate[]
}

export interface WSIncidentUpdate {
  type: 'incident_update'
  data: Record<string, unknown>
}

export interface WSAlert {
  type: 'alert'
  data: Record<string, unknown>
}

export interface WSConnected {
  type: 'connected'
  user_id: string
  role: string
  active_connections: number
}

export type WSMessage = WSCrowdUpdate | WSIncidentUpdate | WSAlert | WSConnected | { type: 'pong' }

// ─── Hook ───────────────────────────────────────────────────────────────────

interface UseStadiumWSOptions {
  /** Called on each crowd density update (every ~5s) */
  onCrowdUpdate?: (zones: CrowdZoneUpdate[]) => void
  /** Called when a new incident is pushed */
  onIncidentUpdate?: (data: Record<string, unknown>) => void
  /** Called when a stadium-wide alert fires */
  onAlert?: (data: Record<string, unknown>) => void
  /** Whether to connect (default: true) */
  enabled?: boolean
}

export function useStadiumWebSocket(options: UseStadiumWSOptions = {}) {
  const { onCrowdUpdate, onIncidentUpdate, onAlert, enabled = true } = options

  const [isConnected, setIsConnected] = useState(false)
  const [crowdZones, setCrowdZones] = useState<CrowdZoneUpdate[]>([])
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>()

  // Stable refs for callbacks so we don't reconnect on every render
  const onCrowdRef = useRef(onCrowdUpdate)
  onCrowdRef.current = onCrowdUpdate
  const onIncidentRef = useRef(onIncidentUpdate)
  onIncidentRef.current = onIncidentUpdate
  const onAlertRef = useRef(onAlert)
  onAlertRef.current = onAlert

  const connect = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Determine WS URL from current page location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_WS_URL || `${protocol}//localhost:8000`
    const url = `${host}/api/v1/ws?token=${token}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      retryCountRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)
        setLastMessage(msg)

        switch (msg.type) {
          case 'crowd_update':
            setCrowdZones(msg.zones)
            onCrowdRef.current?.(msg.zones)
            break
          case 'incident_update':
            onIncidentRef.current?.(msg.data)
            break
          case 'alert':
            onAlertRef.current?.(msg.data)
            break
        }
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      wsRef.current = null

      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * 2 ** retryCountRef.current, 30_000)
      retryCountRef.current += 1
      retryTimerRef.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    connect()

    return () => {
      clearTimeout(retryTimerRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [enabled, connect])

  // Ping every 25s to keep the connection alive behind proxies
  useEffect(() => {
    if (!isConnected) return
    const interval = setInterval(() => {
      wsRef.current?.send(JSON.stringify({ type: 'ping' }))
    }, 25_000)
    return () => clearInterval(interval)
  }, [isConnected])

  return { isConnected, crowdZones, lastMessage }
}
