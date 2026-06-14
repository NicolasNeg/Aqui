'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { computeRoute } from '@/lib/routing';
import { parseScannedLocation } from '@/lib/scan';
import { useVenue } from '@/hooks/useVenue';
import { QRScanner } from '@/components/QRScanner';
import { TopBar } from '@/components/TopBar';
import { DestinationCard } from '@/components/DestinationCard';
import { SectionMarker } from '@/components/SectionMarker';
import { CameraIcon, CheckIcon, QrCodeIcon } from '@/components/icons';
import type { Point } from '@/lib/types';

export default function VisitorEntry() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { venueId, venue } = useVenue();
  const locParam = searchParams.get('loc');

  const [currentId, setCurrentId] = useState<string | null>(locParam);
  const [showScanner, setShowScanner] = useState(false);

  // Sync URL changes to state
  useEffect(() => {
    if (locParam) setCurrentId(locParam);
  }, [locParam]);

  function handleScan(text: string) {
    const detectedId = parseScannedLocation(text);
    if (detectedId && venue?.points[detectedId]) {
      setShowScanner(false);
      setCurrentId(detectedId);
      router.replace(`/v/${venueId}?loc=${detectedId}`);
    }
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-warm-500 text-sm">Cargando…</div>
      </div>
    );
  }

  const currentPoint: Point | null = currentId ? venue.points[currentId] : null;

  // Build destinations sorted by distance
  const destinations =
    currentPoint &&
    Object.keys(venue.points)
      .filter((id) => id !== currentId)
      .map((id) => {
        const route = computeRoute(venue, currentId!, id);
        return {
          point: venue.points[id],
          distance: route?.distance ?? 9999,
          minutes: route?.estimatedMinutes ?? 99
        };
      })
      .sort((a, b) => a.distance - b.distance);

  return (
    <>
      <TopBar
        subtitle={venue.name}
        status={currentPoint ? `En ${currentPoint.name}` : 'Listo'}
      />

      <main
        className="min-h-screen pb-20"
        style={{ paddingTop: 'calc(56px + env(safe-area-inset-top))' }}
      >
        {/* ============== SCAN STATE ============== */}
        {!currentPoint && !showScanner && (
          <div className="px-5 py-8 flex flex-col items-center text-center gap-4 animate-fade-in">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: '#DBEAFE' }}
            >
              <QrCodeIcon size={28} color="#0F4C5C" />
            </div>

            <SectionMarker num="01" label="Bienvenido a Aquí" />

            <h1 className="text-2xl font-bold tracking-tight max-w-xs">
              Escanea el QR <span style={{ color: '#E63946' }}>&quot;Usted está aquí&quot;</span>
            </h1>
            <p className="text-sm text-warm-500 max-w-xs">
              Busca el código físico instalado en el lugar. O usa un atajo de prueba para explorar la demo.
            </p>

            <button
              onClick={() => setShowScanner(true)}
              className="btn btn-primary mt-2"
            >
              <CameraIcon size={18} />
              Activar cámara
            </button>

            {/* Demo shortcuts */}
            <div className="mt-8 w-full max-w-sm">
              <div className="text-xs label-text mb-3 text-left">Atajos de prueba</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(venue.points).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentId(p.id);
                      router.replace(`/v/${venueId}?loc=${p.id}`);
                    }}
                    className="text-left flex items-center gap-2 p-3 surface text-sm active:bg-warm-50"
                  >
                    <span className="text-base">{p.emoji || '📍'}</span>
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============== SCANNER STATE ============== */}
        {!currentPoint && showScanner && (
          <div className="px-5 py-8 flex flex-col items-center text-center gap-4 animate-fade-in">
            <SectionMarker num="01" label="Escaneando" />
            <h2 className="text-xl font-bold">Apunta a un QR</h2>
            <QRScanner onScan={handleScan} />
            <button onClick={() => setShowScanner(false)} className="btn btn-ghost text-sm">
              Cancelar
            </button>
          </div>
        )}

        {/* ============== ARRIVED STATE — DESTINATIONS ============== */}
        {currentPoint && destinations && (
          <div className="animate-fade-in">
            {/* Banner */}
            <div className="mx-4 mt-4 mb-2 p-3.5 rounded-xl flex items-center gap-3"
              style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#16A34A' }}
              >
                <CheckIcon size={16} color="#FFFFFF" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#15803D', letterSpacing: '0.12em' }}>
                  Ubicación detectada
                </div>
                <div className="text-sm font-bold mt-0.5" style={{ color: '#14532D' }}>
                  {currentPoint.name}
                </div>
              </div>
            </div>

            {/* Section marker */}
            <div className="px-5 pt-4">
              <SectionMarker num="02" label="¿A dónde quieres ir?" />
            </div>

            {/* Destinations list */}
            <div className="px-4 pb-6 space-y-2">
              {destinations.map(({ point, distance, minutes }) => (
                <DestinationCard
                  key={point.id}
                  point={point}
                  distance={distance}
                  minutes={minutes}
                  href={`/v/${venueId}/map?from=${currentId}&to=${point.id}`}
                />
              ))}
            </div>

            {/* Re-scan button */}
            <div className="px-4 pb-8">
              <button
                onClick={() => {
                  setCurrentId(null);
                  router.replace(`/v/${venueId}`);
                }}
                className="btn btn-outline w-full text-sm"
              >
                Cambiar ubicación
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
