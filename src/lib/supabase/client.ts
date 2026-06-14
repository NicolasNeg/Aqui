import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';

export { isSupabaseConfigured } from './env';

/**
 * Supabase client for browser/client components.
 *
 * Returns null if env vars are not configured — the app should
 * gracefully fall back to demo mode in that case.
 */
export function createClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.key);
}
