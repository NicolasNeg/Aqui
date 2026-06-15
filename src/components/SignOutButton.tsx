'use client';

import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();

  if (!isSupabaseConfigured()) return null;

  async function handleSignOut() {
    const client = createClient();
    if (client) await client.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button onClick={handleSignOut} className="text-xs text-warm-500 hover:text-ink">
      Cerrar sesión
    </button>
  );
}
