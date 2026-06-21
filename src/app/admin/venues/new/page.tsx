'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { SectionMarker } from '@/components/SectionMarker';
import { createClient } from '@/lib/supabase/client';
import type { Venue } from '@/lib/types';

const VENUE_TYPES: { value: Venue['type']; label: string }[] = [
  { value: 'wedding', label: 'Boda' },
  { value: 'event', label: 'Evento' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'office', label: 'Oficina' },
  { value: 'museum', label: 'Museo' },
  { value: 'mall', label: 'Centro comercial' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'school', label: 'Escuela' },
  { value: 'park', label: 'Parque' },
  { value: 'other', label: 'Otro' },
];

function toId(name: string): string {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40) + '-' + Date.now().toString(36);
}

export default function NewVenuePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<Venue['type']>('event');
  const [brandColor, setBrandColor] = useState('#0F1B2E');
  const [accentColor, setAccentColor] = useState('#E63946');
  const [floorWidth, setFloorWidth] = useState(100);
  const [floorHeight, setFloorHeight] = useState(80);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    const client = createClient();
    if (!client) { setError('Supabase no configurado'); setSaving(false); return; }
    const id = toId(name);
    const { error: err } = await client.from('venues').insert({
      id,
      name: name.trim(),
      type,
      brand_color: brandColor,
      accent_color: accentColor,
      requires_ticket: false,
      config: {
        floorWidth,
        floorHeight,
        buildings: [],
        paths: [],
      },
    });
    if (err) { setError(err.message); setSaving(false); return; }
    router.push(`/admin/${id}/edit`);
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-warm-100 px-5 py-4 flex items-center justify-between">
        <Logo size="md" />
        <Link href="/admin" className="text-xs text-warm-500 hover:text-ink">← Admin</Link>
      </header>

      <div className="max-w-xl mx-auto px-5 py-8">
        <SectionMarker num="01" label="Nuevo venue" />
        <h1 className="text-3xl font-bold tracking-tight mb-8">
          Configura el <span style={{ color: '#E63946' }}>espacio</span>.
        </h1>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-xs label-text block mb-1.5">Nombre del lugar</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej. Hotel Camino Real"
              required
              className="w-full px-3 py-2.5 border border-warm-100 rounded-lg text-sm focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="text-xs label-text block mb-1.5">Tipo</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as Venue['type'])}
              className="w-full px-3 py-2.5 border border-warm-100 rounded-lg text-sm focus:outline-none focus:border-ink"
            >
              {VENUE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs label-text block mb-1.5">Color de marca</label>
              <div className="flex items-center gap-2">
                <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-warm-100" />
                <span className="text-sm text-warm-500">{brandColor}</span>
              </div>
            </div>
            <div>
              <label className="text-xs label-text block mb-1.5">Color de acento</label>
              <div className="flex items-center gap-2">
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-warm-100" />
                <span className="text-sm text-warm-500">{accentColor}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs label-text block mb-1.5">Ancho del espacio (m)</label>
              <input type="number" value={floorWidth} onChange={e => setFloorWidth(Number(e.target.value))}
                min={10} max={2000}
                className="w-full px-3 py-2.5 border border-warm-100 rounded-lg text-sm focus:outline-none focus:border-ink" />
            </div>
            <div>
              <label className="text-xs label-text block mb-1.5">Alto del espacio (m)</label>
              <input type="number" value={floorHeight} onChange={e => setFloorHeight(Number(e.target.value))}
                min={10} max={2000}
                className="w-full px-3 py-2.5 border border-warm-100 rounded-lg text-sm focus:outline-none focus:border-ink" />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={saving || !name.trim()} className="btn btn-primary w-full">
            {saving ? 'Creando…' : 'Crear venue y diseñar plano →'}
          </button>
        </form>
      </div>
    </main>
  );
}
