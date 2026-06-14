'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBaseUrl, locationUrl } from '@/lib/url';
import { useVenue } from '@/hooks/useVenue';
import { Logo } from '@/components/Logo';
import { SectionMarker } from '@/components/SectionMarker';
import { YouAreHereCard } from '@/components/QRDisplay';
import { PrinterIcon } from '@/components/icons';

export default function QRPointsAdmin() {
  const { venueId, venue } = useVenue();

  const [baseUrl, setBaseUrl] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    setBaseUrl(getBaseUrl());
  }, []);

  useEffect(() => {
    if (venue && !selectedId) {
      const firstId = Object.keys(venue.points)[0];
      if (firstId) setSelectedId(firstId);
    }
  }, [venue, selectedId]);

  if (!venue) {
    return <div className="min-h-screen flex items-center justify-center text-warm-500">Venue no encontrado</div>;
  }

  function urlFor(pointId: string) {
    return locationUrl(baseUrl, venueId, pointId);
  }

  if (printMode) {
    return (
      <main className="min-h-screen bg-white p-8 print:p-0">
        <div className="no-print mb-6 flex items-center justify-between max-w-4xl mx-auto">
          <Logo size="md" />
          <div className="flex gap-2">
            <button onClick={() => setPrintMode(false)} className="btn btn-outline">Cerrar</button>
            <button onClick={() => window.print()} className="btn btn-primary">Imprimir</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {Object.values(venue.points).map((point) => (
            <div key={point.id} className="print-page">
              <YouAreHereCard
                value={urlFor(point.id)}
                pointName={point.name}
                venueName={venue.name}
                size={280}
              />
            </div>
          ))}
        </div>
      </main>
    );
  }

  const selected = selectedId ? venue.points[selectedId] : null;

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-warm-100 px-5 py-4 flex items-center justify-between">
        <Logo size="md" />
        <Link href={`/admin/${venueId}`} className="text-xs text-warm-500 hover:text-ink">
          ← {venue.name}
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8">
        <SectionMarker num="03" label="QRs de ubicación" />
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Imprime los <span style={{ color: '#E63946' }}>&quot;Usted está aquí&quot;</span>.
        </h1>
        <p className="text-sm text-warm-500 max-w-md mb-8">
          Genera un QR único para cada punto del lugar. Imprímelos en vinilo, cartón corrugado o acrílico.
        </p>

        {/* URL base config */}
        <div className="surface p-5 mb-6">
          <label className="text-xs label-text block mb-2">URL pública de la app</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://tu-dominio.com"
            className="w-full px-3 py-2.5 rounded-lg border border-warm-100 text-sm focus:outline-none focus:border-ink"
            style={{ background: '#FFFFFF' }}
          />
          <p className="text-xs text-warm-500 mt-2">
            Esta URL se incluye en cada QR. Si estás probando local, déjalo en localhost. En producción usa tu dominio de Vercel.
          </p>
        </div>

        {/* Point selector */}
        <div className="surface p-5 mb-6">
          <label className="text-xs label-text block mb-3">Selecciona un punto</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(venue.points).map((point) => (
              <button
                key={point.id}
                onClick={() => setSelectedId(point.id)}
                className={`p-3 rounded-lg text-left text-sm flex items-center gap-2 transition-colors ${
                  selectedId === point.id ? 'text-white' : 'hover:bg-warm-50'
                }`}
                style={{
                  background: selectedId === point.id ? '#0F1B2E' : '#FFFFFF',
                  border: `1px solid ${selectedId === point.id ? '#0F1B2E' : '#EFEEEA'}`
                }}
              >
                <span>{point.emoji || '📍'}</span>
                <span className="truncate">{point.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected QR preview */}
        {selected && (
          <div className="surface p-6 mb-6 flex flex-col items-center">
            <YouAreHereCard
              value={urlFor(selected.id)}
              pointName={selected.name}
              venueName={venue.name}
              size={220}
            />
            <div className="mt-5 text-xs text-warm-500 break-all text-center max-w-md">
              {urlFor(selected.id)}
            </div>
          </div>
        )}

        {/* Print all */}
        <button onClick={() => setPrintMode(true)} className="btn btn-primary w-full">
          <PrinterIcon size={18} />
          Ver todos para imprimir
        </button>
      </div>
    </main>
  );
}
