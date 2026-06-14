import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from './env';

export { isSupabaseConfigured } from './env';

/**
 * Supabase client for server components / route handlers.
 */
export function createClient() {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server component: can't set cookies. This is OK for our use case.
        }
      }
    }
  });
}
