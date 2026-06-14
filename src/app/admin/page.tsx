'use client';

import Link from 'next/link';
import { DEMO_VENUES } from '@/data/demo-venue';
import { Logo } from '@/components/Logo';
import { SectionMarker } from '@/components/SectionMarker';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { CheckIcon } from '@/components/icons';

export default function AdminDashboard() {
  const venues = Object.values(DEMO_VENUES);
  const supabaseReady = isSupabaseConfigured();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-warm-100 px-5 py-4 flex items-center justify-between">
        <Logo size="md" />
        <Link href="/" className="text-xs text-warm-500 hover:text-ink">
          ← Ir al sitio
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8">
        <SectionMarker num="01" label="Panel de administración" />
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Tus <span style={{ color: '#E63946' }}>espacios</span>.
        </h1>
        <p className="text-sm text-warm-500 max-w-md mb-8">
          Gestiona los venues activos, genera QRs de ubicación y administra invitaciones.
        </p>

        {/* Supabase status */}
        <div
          className={`surface p-4 mb-8 flex items-start gap-3 ${supabaseReady ? '' : 'border-yellow-light'}`}
          style={supabaseReady ? {} : { background: '#FFF9E6', borderColor: '#F5C842' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: supabaseReady ? '#DCFCE7' : '#FFF4D1' }}
          >
            {supabaseReady ? (
              <CheckIcon size={16} color="#16A34A" />
            ) : (
              <span style={{ color: '#B58200', fontWeight: 700 }}>!</span>
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">
              {supabaseReady ? 'Supabase conectado' : 'Modo demo (sin backend)'}
            </div>
            <div className="text-xs text-warm-500 mt-1">
              {supabaseReady
                ? 'Tus venues, tickets y check-ins se guardan en la base de datos.'
                : 'Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local para guardar datos reales.'}
            </div>
          </div>
        </div>

        {/* Venues list */}
        <div className="space-y-3">
          {venues.map((venue) => (
            <Link
              key={venue.id}
              href={`/admin/${venue.id}`}
              className="surface p-5 flex items-center gap-4 active:bg-warm-50 transition-colors"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: venue.brandColor || '#0F1B2E' }}
              >
                <span className="text-white text-xl font-bold">
                  {venue.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink">{venue.name}</div>
                <div className="text-xs text-warm-500 mt-0.5">
                  {Object.keys(venue.points).length} puntos · {venue.paths.length} conexiones · {venue.type}
                </div>
              </div>
              <span className="text-warm-300 text-lg">›</span>
            </Link>
          ))}
        </div>

        {/* Tools panel */}
        <div className="mt-10">
          <div className="text-xs label-text mb-3">Herramientas</div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/v/demo" className="surface p-4 active:bg-warm-50">
              <div className="text-sm font-semibold mb-1">Demo del visitante</div>
              <div className="text-xs text-warm-500">Prueba el flujo completo en tu teléfono</div>
            </Link>
            <Link href="/v/boda-demo" className="surface p-4 active:bg-warm-50">
              <div className="text-sm font-semibold mb-1">Demo de boda</div>
              <div className="text-xs text-warm-500">Vista con sistema de tickets</div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
