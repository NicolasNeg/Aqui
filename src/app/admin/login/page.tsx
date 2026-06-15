'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const client = createClient();
    if (!client) {
      setError('Supabase no está configurado.');
      setLoading(false);
      return;
    }

    const { error: authError } = await client.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('Correo o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="surface p-6">
      <h1 className="text-base font-bold mb-5">Acceso al panel</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-text block mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink"
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <div>
          <label className="label-text block mb-1.5">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-xs font-medium" style={{ color: 'var(--red)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: 'var(--ink)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="lg" onDark href="/admin/login" />
        </div>
        <Suspense fallback={<div className="surface p-6 text-sm text-warm-500">Cargando…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
