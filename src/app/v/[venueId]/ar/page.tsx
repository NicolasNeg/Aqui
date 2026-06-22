'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { computeRoute, bearingBetween } from '@/lib/routing';
import { useVenue } from '@/hooks/useVenue';
import { ARArrow } from '@/components/ARArrow';
import { CameraIcon } from '@/components/icons';

export default function ARView() {
  const searchParams = useSearchParams();
  const { venueId, venue } = useVenue();
  const fromId = searchParams.get('from');
  const toId = searchParams.get('to');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [needsPermission, setNeedsPermission] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const watcherRef = useRef<number | null>(null);

  // Check if iOS requires explicit permission
  useEffect(() => {
    const DOE = DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === 'function') {
      setNeedsPermission(true);
    } else {
      requestPermissions();
    }
    return () => stopAR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestPermissions() {
    setNeedsPermission(false);

    // ponytail: orientation MUST be requested first on iOS — gesture context expires after first await
    try {
      const DOE = DeviceOrientationEvent as any;
      if (typeof DOE.requestPermission === 'function') {
        const result = await DOE.requestPermission();
        if (result !== 'granted') {
          setCameraError('Permiso de brújula denegado. Recarga para intentar de nuevo.');
          return;
        }
      }
    } catch {
      setCameraError('No se pudo solicitar permiso de brújula.');
      return;
    }

    // Camera (optional — AR arrow works without it)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCamera(true);
    } catch (err: any) {
      setCameraError(err?.message || 'Sin permiso de cámara');
    }

    setHasPermission(true);

    // GPS
    if (navigator.geolocation) {
      watcherRef.current = navigator.geolocation.watchPosition(
        (pos) => setGpsAccuracy(Math.round(pos.coords.accuracy)),
        () => setGpsAccuracy(null),
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
    }
  }

  function stopAR() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (watcherRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watcherRef.current);
      watcherRef.current = null;
    }
  }

  if (!venue || !fromId || !toId) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center text-white p-4">
        Faltan parámetros. <Link href={`/v/${venueId}`} className="ml-2 underline">Volver</Link>
      </div>
    );
  }

  const route = computeRoute(venue, fromId, toId);
  if (!route) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center text-white p-4">
        No hay ruta disponible
      </div>
    );
  }

  const destPoint = venue.points[toId];
  const targetBearing =
    route.path.length >= 2
      ? bearingBetween(venue.points[route.path[0]], venue.points[route.path[1]])
      : 0;

  return (
    <div className="fixed inset-0 bg-ink overflow-hidden">
      {/* Camera background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          background: 'linear-gradient(180deg, #334155 0%, #64748B 100%)'
        }}
      />

      {/* AR arrow overlay */}
      {hasPermission && <ARArrow targetBearing={targetBearing} />}

      {/* Top status bar */}
      <div
        className="absolute top-0 left-0 right-0 z-10 px-4 flex items-center gap-3"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          paddingBottom: '12px',
          background: 'linear-gradient(to bottom, rgba(15, 27, 46, 0.85), rgba(15, 27, 46, 0))'
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: '#34D399' }} />
          <span className="text-xs text-white font-semibold">
            {hasCamera ? 'Modo AR activo' : hasPermission ? 'Brújula activa' : 'Iniciando…'}
          </span>
        </div>
        {gpsAccuracy !== null && (
          <span className="text-xs text-white/70 ml-auto">GPS · ±{gpsAccuracy}m</span>
        )}
        <Link
          href={`/v/${venueId}/map?from=${fromId}&to=${toId}`}
          className="ml-auto text-xs text-white bg-white/10 px-3 py-1.5 rounded-lg"
        >
          Cerrar
        </Link>
      </div>

      {/* Bottom info card */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <div
          className="rounded-xl p-4 text-white backdrop-blur-md"
          style={{ background: 'rgba(15, 27, 46, 0.85)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-white/60">Siguiente</div>
              <div className="text-sm font-semibold">Sigue la flecha hacia {destPoint.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{route.estimatedMinutes}:00</div>
              <div className="text-xs text-white/60">restante</div>
            </div>
          </div>
          <div className="h-1 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: '15%', background: '#34D399' }}
            />
          </div>
        </div>
      </div>

      {/* Permission prompt */}
      {needsPermission && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink p-6 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(230, 57, 70, 0.15)' }}
          >
            <CameraIcon size={28} color="#E63946" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Permisos necesarios</h2>
          <p className="text-sm text-white/70 max-w-xs mb-6">
            Para ver las flechas flotantes en realidad aumentada, necesitamos acceso a tu cámara y a la brújula del teléfono.
          </p>
          <button onClick={requestPermissions} className="btn btn-accent">
            Conceder permisos
          </button>
          <Link
            href={`/v/${venueId}/map?from=${fromId}&to=${toId}`}
            className="text-white/60 text-sm mt-4"
          >
            Mejor usar el mapa
          </Link>
        </div>
      )}

      {/* Camera error */}
      {cameraError && !needsPermission && (
        <div className="absolute inset-x-4 top-1/3 z-10 bg-red/90 text-white p-4 rounded-xl text-center">
          <div className="text-sm font-semibold mb-1">No se pudo abrir la cámara</div>
          <div className="text-xs opacity-90">{cameraError}</div>
        </div>
      )}
    </div>
  );
}
