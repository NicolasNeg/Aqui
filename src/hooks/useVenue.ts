'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDemoVenue } from '@/data/demo-venue';
import { createClient } from '@/lib/supabase/client';
import { fetchVenue } from '@/lib/venues';
import type { Venue } from '@/lib/types';

/**
 * Resolves the current venue from the `[venueId]` route segment.
 *
 * Tries Supabase first; falls back to bundled demo data when Supabase is not
 * configured or the venue isn't found in the DB.
 *
 * @param fallbackId venue id to use when the route has no `[venueId]` (default `'demo'`).
 * @returns `venueId` from the route and the loaded `venue` (`null` if not found).
 */
export function useVenue(fallbackId = 'demo'): { venueId: string; venue: Venue | null } {
  const params = useParams();
  const venueId = (params?.venueId as string) || fallbackId;

  // Lazy init keeps SSR and the first client render in sync (no loading flash).
  const [venue, setVenue] = useState<Venue | null>(() => getDemoVenue(venueId));

  useEffect(() => {
    let cancelled = false;

    const client = createClient();
    if (!client) {
      setVenue(getDemoVenue(venueId));
      return;
    }

    fetchVenue(client, venueId).then((v) => {
      if (!cancelled) setVenue(v ?? getDemoVenue(venueId));
    });

    return () => {
      cancelled = true;
    };
  }, [venueId]);

  return { venueId, venue };
}
