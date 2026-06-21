'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { VenueEditor } from '@/components/VenueEditor';
import { fetchVenue } from '@/lib/venues';
import { getDemoVenue } from '@/data/demo-venue';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';
import type { Venue } from '@/lib/types';

export default function EditVenuePage() {
  const { venueId } = useParams<{ venueId: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const client = createClient();
      const fromDb = client ? await fetchVenue(client, venueId) : null;
      setVenue(fromDb ?? getDemoVenue(venueId));
      setLoading(false);
    }
    load();
  }, [venueId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-warm-500 text-sm">
        Cargando venue…
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-warm-500">Venue no encontrado.</p>
        <Link href="/admin" className="btn btn-outline text-sm">← Volver al admin</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-warm-100 px-5 py-3 flex items-center justify-between shrink-0">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ink">{venue.name}</span>
          <Link href={`/admin/${venueId}/qr-points`} className="text-xs text-warm-500 hover:text-ink">
            Ver QRs →
          </Link>
          <Link href="/admin" className="text-xs text-warm-500 hover:text-ink">Admin</Link>
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <VenueEditor venue={venue} />
      </div>
    </div>
  );
}
