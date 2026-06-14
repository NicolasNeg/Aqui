'use client';

import type { Venue } from '@/lib/types';

interface FloorPlanProps {
  venue: Venue;
  currentId?: string | null;
  destId?: string | null;
  route?: string[] | null;
  className?: string;
}

/**
 * Renders the floor plan as an SVG with:
 * - Buildings as light gray rectangles with labels
 * - Walkways as thick light gray lines (the full graph)
 * - Route highlight as animated dashed line in ink color
 * - "You are here" pulsing red marker
 * - Destination teardrop pin
 */
export function FloorPlan({ venue, currentId, destId, route, className = '' }: FloorPlanProps) {
  const viewBox = `0 0 ${venue.floorWidth} ${venue.floorHeight}`;

  return (
    <svg
      viewBox={viewBox}
      className={`floor-svg w-full h-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Plano del lugar"
    >
      {/* Buildings */}
      {venue.buildings.map((b, i) => (
        <g key={`b-${i}`}>
          <rect className="building" x={b.x} y={b.y} width={b.w} height={b.h} rx={3} />
          <text
            className="room-label"
            x={b.x + b.w / 2}
            y={b.y + b.h / 2 + 4}
            textAnchor="middle"
          >
            {b.label}
          </text>
        </g>
      ))}

      {/* Walkways (background grid) */}
      {venue.paths.map(([a, b], i) => {
        const pa = venue.points[a];
        const pb = venue.points[b];
        if (!pa || !pb) return null;
        return <line key={`w-${i}`} className="walkway" x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />;
      })}

      {/* Route */}
      {route && route.length > 1 && (
        <path
          className="route"
          d={
            'M ' +
            route
              .map((id) => {
                const p = venue.points[id];
                return p ? `${p.x} ${p.y}` : '';
              })
              .filter(Boolean)
              .join(' L ')
          }
        />
      )}

      {/* POI markers (non-active points) */}
      {Object.values(venue.points).map((p) => {
        if (p.id === currentId || p.id === destId) return null;
        return (
          <g key={`poi-${p.id}`}>
            <circle className="poi" cx={p.x} cy={p.y} r={5} />
            <text
              className="poi-label"
              x={p.x}
              y={p.y - 9}
              textAnchor="middle"
            >
              {p.name}
            </text>
          </g>
        );
      })}

      {/* "You are here" — red pulsing dot */}
      {currentId && venue.points[currentId] && (
        <g>
          <circle
            className="you-pulse"
            cx={venue.points[currentId].x}
            cy={venue.points[currentId].y}
            r={14}
          />
          <circle
            className="you-dot"
            cx={venue.points[currentId].x}
            cy={venue.points[currentId].y}
            r={8}
          />
          <text
            className="poi-label"
            x={venue.points[currentId].x}
            y={venue.points[currentId].y - 14}
            textAnchor="middle"
            style={{ fontWeight: 700, fill: '#E63946' }}
          >
            TÚ
          </text>
        </g>
      )}

      {/* Destination teardrop pin */}
      {destId && venue.points[destId] && (
        <g>
          <path
            className="dest-pin"
            d={`M ${venue.points[destId].x} ${venue.points[destId].y - 18} C ${venue.points[destId].x - 10} ${venue.points[destId].y - 18} ${venue.points[destId].x - 10} ${venue.points[destId].y - 2} ${venue.points[destId].x} ${venue.points[destId].y + 6} C ${venue.points[destId].x + 10} ${venue.points[destId].y - 2} ${venue.points[destId].x + 10} ${venue.points[destId].y - 18} ${venue.points[destId].x} ${venue.points[destId].y - 18} Z`}
          />
          <circle
            cx={venue.points[destId].x}
            cy={venue.points[destId].y - 11}
            r={3.5}
            fill="#FFFFFF"
          />
          <text
            x={venue.points[destId].x}
            y={venue.points[destId].y + 18}
            textAnchor="middle"
            style={{ fontWeight: 600, fill: '#0F1B2E', fontSize: 9 }}
          >
            {venue.points[destId].name}
          </text>
        </g>
      )}
    </svg>
  );
}
