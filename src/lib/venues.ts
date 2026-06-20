import type { SupabaseClient } from '@supabase/supabase-js';
import type { Venue, Point, PointType, Building } from './types';

/** Raw `venues` row as stored in Supabase (snake_case columns). */
export interface VenueRow {
  id: string;
  name: string;
  type: string;
  brand_color: string | null;
  accent_color: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  welcome_text: string | null;
  requires_ticket: boolean;
  config: VenueConfig | null;
}

/** Shape of `venues.config` JSONB — holds layout fields not worth their own columns. */
interface VenueConfig {
  floorWidth?: number;
  floorHeight?: number;
  buildings?: Building[];
  paths?: [string, string][];
  logoUrl?: string;
}

/** Raw `points` row as stored in Supabase (snake_case columns). */
export interface PointRow {
  id: string;
  venue_id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  lat: number | null;
  lng: number | null;
  emoji: string | null;
  color: string | null;
  description: string | null;
  image_url: string | null;
  audio_url: string | null;
}

function mapPointRow(row: PointRow): Point {
  return {
    id: row.id,
    name: row.name,
    type: row.type as PointType,
    x: row.x,
    y: row.y,
    ...(row.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : {}),
    ...(row.emoji != null ? { emoji: row.emoji } : {}),
    ...(row.color != null ? { color: row.color } : {}),
    ...(row.description != null ? { description: row.description } : {}),
    ...(row.image_url != null ? { imageUrl: row.image_url } : {}),
    ...(row.audio_url != null ? { audioUrl: row.audio_url } : {}),
  };
}

/** Map a `venues` DB row (+ its point rows) into a domain `Venue`. */
export function mapVenueRow(row: VenueRow, pointRows: PointRow[]): Venue {
  const config = row.config ?? {};

  const points: Record<string, Point> = {};
  for (const p of pointRows) {
    points[p.id] = mapPointRow(p);
  }

  return {
    id: row.id,
    name: row.name,
    type: row.type as Venue['type'],
    ...(row.brand_color ? { brandColor: row.brand_color } : {}),
    ...(row.accent_color ? { accentColor: row.accent_color } : {}),
    ...(row.origin_lat != null && row.origin_lng != null
      ? { origin: { lat: row.origin_lat, lng: row.origin_lng } }
      : {}),
    ...(row.welcome_text ? { welcomeText: row.welcome_text } : {}),
    ...(config.logoUrl ? { logoUrl: config.logoUrl } : {}),
    floorWidth: config.floorWidth ?? 320,
    floorHeight: config.floorHeight ?? 380,
    buildings: config.buildings ?? [],
    points,
    paths: config.paths ?? [],
    requiresTicket: row.requires_ticket,
  };
}

/**
 * Fetch a single venue (and its points) from Supabase.
 * Returns null when the venue doesn't exist or a query error occurs.
 */
export async function fetchVenue(client: SupabaseClient, id: string): Promise<Venue | null> {
  const [venueResult, pointsResult] = await Promise.all([
    client.from('venues').select('*').eq('id', id).single(),
    client.from('points').select('*').eq('venue_id', id),
  ]);

  if (venueResult.error || !venueResult.data) return null;

  return mapVenueRow(
    venueResult.data as VenueRow,
    (pointsResult.data ?? []) as PointRow[],
  );
}
