'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { computeRoute, describeTurn } from '@/lib/routing';
import { useVenue } from '@/hooks/useVenue';
import { FloorPlan } from '@/components/FloorPlan';
import { TopBar } from '@/components/TopBar';
import { LayersIcon, PinIcon, TurnIcon } from '@/components/icons';

export default function MapView() {
  const searchParams = useSearchParams();
  const { venueId, venue } = useVenue();
  const fromId = searchParams.get('from');
  const toId = searchParams.get('to');

  if (!venue || !fromId || !toId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-warm-500 text-sm text-center">
          Faltan parámetros de origen y destino.
          <br />
          <Link href={`/v/${venueId}`} className="text-red mt-2 inline-block">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const route = computeRoute(venue, fromId, toId);

  if (!route) {
    return (
      <>
        <TopBar subtitle={venue.name} showBack backHref={`/v/${venueId}?loc=${fromId}`} />
        <main className="pt-20 px-5 text-center text-warm-500">
          No hay ruta posible entre estos puntos.
        </main>
      </>
    );
  }

  const destPoint = venue.points[toId];
  const turnInfo = route.path.length >= 2
    ? describeTurn(venue.points[route.path[0]], venue.points[route.path[1]])
    : null;

  const segmentDistance =
    route.path.length >= 2
      ? Math.round(
        Math.hypot(
          venue.points[route.path[1]].x - venue.points[route.path[0]].x,
          venue.points[route.path[1]].y - venue.points[route.path[0]].y
        )
      )
      : 0;

  return (
    <>
      <TopBar
        subtitle={venue.name}
        status={`${route.estimatedMinutes} min`}
        showBack
        backHref={`/v/${venueId}?loc=${fromId}`}
      />

      <main
        className="min-h-screen flex flex-col"
        style={{ paddingTop: 'calc(56px + env(safe-area-inset-top))' }}
      >
        {/* Route info bar */}
        <div className="px-4 py-3 bg-white border-b border-warm-100 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#DBEEF1' }}
          >
            <PinIcon size={16} color="#0F4C5C" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-warm-500">Ruta hacia</div>
            <div className="text-sm font-semibold truncate">{destPoint.name}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold" style={{ color: '#0F4C5C' }}>
              {route.estimatedMinutes} min
            </div>
            <div className="text-xs text-warm-500">{route.distance} m</div>
          </div>
        </div>

        {/* Floor plan */}
        <div className="flex-1 bg-warm-50 min-h-[300px] relative">
          <FloorPlan
            venue={venue}
            currentId={fromId}
            destId={toId}
            route={route.path}
          />
        </div>

        {/* Turn instruction */}
        {turnInfo && (
          <div className="px-4 py-3 bg-white border-t border-warm-100 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#DBEEF1' }}
            >
              <TurnIcon direction={turnInfo.arrow} size={22} color="#0F4C5C" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">{turnInfo.text}</div>
              <div className="text-xs text-warm-500">
                En {segmentDistance} m hacia {venue.points[route.path[1]].name}
              </div>
            </div>
          </div>
        )}

        {/* AR button */}
        <div className="px-4 pb-6 pt-3 bg-white">
          <Link
            href={`/v/${venueId}/ar?from=${fromId}&to=${toId}`}
            className="btn btn-primary w-full"
            style={{ background: '#0F4C5C' }}
          >
            <LayersIcon size={18} />
            Activar Realidad Aumentada
          </Link>
        </div>
      </main>
    </>
  );
}
