/**
 * StadiumHeatmap — Interactive SVG heatmap of stadium zones.
 * Extracted from OrganizerDashboard for reuse across dashboards.
 */

interface HeatmapZone {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  density: number
}

interface StadiumHeatmapProps {
  zones: HeatmapZone[]
  selectedZone?: string | null
  onZoneClick?: (zoneId: string) => void
  title?: string
}

function heatmapColor(d: number): string {
  if (d === 0) return 'rgba(6,95,70,0.25)'
  if (d >= 85) return 'rgba(239,68,68,0.45)'
  if (d >= 65) return 'rgba(245,158,11,0.35)'
  return 'rgba(16,185,129,0.25)'
}

export function StadiumHeatmap({
  zones,
  selectedZone,
  onZoneClick,
  title = 'Live Crowd Heatmap',
}: StadiumHeatmapProps) {
  return (
    <div className="stadium-card p-5">
      <h3 className="text-sm font-bold text-text-primary mb-3">{title}</h3>
      <svg viewBox="0 0 700 500" className="w-full rounded-xl bg-bg-elevated">
        <ellipse cx="350" cy="250" rx="300" ry="235" fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth="2" />
        {zones.map(z => (
          <g
            key={z.id}
            onClick={() => onZoneClick?.(z.id)}
            className={onZoneClick ? 'cursor-pointer' : ''}
          >
            <rect
              x={z.x} y={z.y} width={z.w} height={z.h} rx="8"
              fill={heatmapColor(z.density)}
              stroke={
                selectedZone === z.id
                  ? 'rgba(59,130,246,0.6)'
                  : z.density >= 85
                    ? 'rgba(239,68,68,0.4)'
                    : 'rgba(255,255,255,0.08)'
              }
              strokeWidth={selectedZone === z.id ? '2' : '1'}
            />
            <text
              x={z.x + z.w / 2} y={z.y + z.h / 2 - 6}
              textAnchor="middle" fill="rgba(255,255,255,0.7)"
              fontSize="11" fontWeight="600"
            >
              {z.label}
            </text>
            {z.density > 0 && (
              <text
                x={z.x + z.w / 2} y={z.y + z.h / 2 + 10}
                textAnchor="middle" fill="rgba(255,255,255,0.5)"
                fontSize="10"
              >
                {z.density}%
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

export type { HeatmapZone }
