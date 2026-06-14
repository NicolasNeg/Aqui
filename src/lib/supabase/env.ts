/**
 * Shared Supabase environment resolution.
 *
 * Both the browser and server clients need the same env vars and the
 * same "is this real or still the placeholder?" check. Keeping it in one
 * place avoids drift between them.
 */

/** Placeholder value shipped in `.env.local.example` — means "not configured yet". */
const PLACEHOLDER_HOST = 'tuproyecto';

export interface SupabaseEnv {
  url: string;
  key: string;
}

/**
 * Returns the Supabase URL + anon key when they are real, or `null` when
 * they are missing or still set to the example placeholder.
 */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes(PLACEHOLDER_HOST)) {
    return null;
  }
  return { url, key };
}

/** True when Supabase is properly configured (real URL + key present). */
export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
