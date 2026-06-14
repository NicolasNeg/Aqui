'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDemoVenue } from '@/data/demo-venue';
import type { Venue } from '@/lib/types';

/**
 * Resolves the current venue from the `[venueId]` route segment.
 *
 * Centralises the load logic that every visitor/admin page used to repeat.
 * Today it reads from the bundled demo data; when Supabase-backed venues
 * land, this is the single place to add the fetch + fallback.
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
    // TODO: fetch from Supabase first, fall back to demo data.
    setVenue(getDemoVenue(venueId));
  }, [venueId]);

  return { venueId, venue };
}
