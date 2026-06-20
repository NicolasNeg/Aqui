'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEMO_VENUES } from '@/data/demo-venue';
import { Logo } from '@/components/Logo';
import { SectionMarker } from '@/components/SectionMarker';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import { mapVenueRow, type VenueRow, type PointRow } from '@/lib/venues';
import { CheckIcon } from '@/components/icons';
import { SignOutButton } from '@/components/SignOutButton';
import type { Venue } from '@/lib/types';

export default function AdminDashboard() {
  const router = useRouter();
  const supabaseReady = isSupabaseConfigured();
  const [venues, setVenues] = useState<Venue[]>(Object.values(DEMO_VENUES));

  useEffect(() => {
    if (!supabaseReady) return;
    const client = createClient();
    if (!client) return;
    async function load() {
      const { data: venueRows } = await client!.from('venues').select('*');
      if (!venueRows?.length) return;
      const ids = venueRows.map((v: VenueRow) => v.id);
      const { data: pointRows } = await client!.from('points').select('*').in('venue_id', ids);
      setVenues(
        venueRows.map((row: VenueRow) =>
          mapVenueRow(row, (pointRows ?? []).filter((p: PointRow) => p.venue_id === row.id))
        )
      );
    }
    load();
  }, [supabaseReady]);

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-warm-100 px-5 py-4 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <SignOutButton />
          <Link href="/" className="text-xs text-warm-500 hover:text-ink">← Ir al sitio</Link>
        </div>
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
          className="surface p-4 mb-8 flex items-start gap-3"
          style={supabaseReady ? {} : { background: '#FFF9E6', borderColor: '#F5C842' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: supabaseReady ? '#DCFCE7' : '#FFF4D1' }}
          >
            {supabaseReady
              ? <CheckIcon size={16} color="#16A34A" />
              : <span style={{ color: '#B58200', fontWeight: 700 }}>!</span>}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">
              {supabaseReady ? 'Supabase conectado' : 'Modo demo (sin backend)'}
            </div>
            <div className="text-xs text-warm-500 mt-1">
              {supabaseReady
                ? 'Tus venues, tickets y check-ins se guardan en la base de datos.'
                : 'Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.'}
            </div>
          </div>
        </div>

        {/* Venues list */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs label-text">Venues</div>
          <Link href="/admin/venues/new" className="btn btn-primary text-xs px-3 py-1.5">
            + Nuevo venue
          </Link>
        </div>

        <div className="space-y-3">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="surface p-5 flex items-center gap-4 active:bg-warm-50 transition-colors cursor-pointer"
              onClick={() => router.push(`/admin/${venue.id}`)}
              style={{ color: 'inherit' }}
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
              <Link
                href={`/admin/${venue.id}/edit`}
                onClick={e => e.stopPropagation()}
                className="text-xs text-warm-400 hover:text-ink px-2 py-1 rounded"
                style={{ textDecoration: 'none' }}
              >
                Editar
              </Link>
              <span className="text-warm-300 text-lg">›</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
