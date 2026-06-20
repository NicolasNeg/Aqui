# Venue Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un editor visual en el admin que permita crear venues con plano SVG, puntos de interés multimedia, y rutas navegables — guardando todo en Supabase.

**Architecture:** El VenueEditor es un componente SVG client-side con 4 modos (Habitación / Punto / Conectar / Seleccionar). El admin dashboard carga venues de Supabase. Las páginas `/admin/venues/new` y `/admin/[venueId]/edit` orquestan el flujo.

**Tech Stack:** Next.js 14 App Router, Supabase (postgres + storage), SVG nativo, React hooks.

## Global Constraints

- No librerías externas nuevas — SVG nativo + eventos del mouse
- Supabase client-side: `createClient()` de `@/lib/supabase/client`
- `id` en `venues` es `text` (no UUID): usar slug + timestamp
- Coordenadas SVG en metros (mismas unidades que `FloorPlan.tsx`)
- `Building` tiene: `x, y, w, h, label` — sin `id` en la DB, se añade `id?` solo para el editor
- Verificación: manual en el browser (no hay test suite)

---

## File Map

| Acción | Archivo |
|---|---|
| Modificar | `src/lib/types.ts` |
| Modificar | `src/lib/venues.ts` |
| Modificar | `supabase/schema.sql` |
| Modificar | `src/app/admin/page.tsx` |
| Crear | `src/app/admin/venues/new/page.tsx` |
| Crear | `src/app/admin/[venueId]/edit/page.tsx` |
| Crear | `src/components/VenueEditor.tsx` |
| Modificar | `src/components/DestinationCard.tsx` |

---

## Task 1: Foundation — Types + Schema

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/venues.ts`
- Modify: `supabase/schema.sql`

**Interfaces:**
- Produces: `Point.audioUrl?: string`, `Building.id?: string`, `PointRow.audio_url`

- [ ] **Step 1: Add `audioUrl` and `id` to domain types**

In `src/lib/types.ts`, apply these two changes:

```typescript
export interface Point {
  id: string;
  name: string;
  type: PointType;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  emoji?: string;
  color?: string;
  description?: string;
  imageUrl?: string;
  audioUrl?: string;   // ← add this line
}

export interface Building {
  id?: string;    // ← add this line (local editor id, not persisted)
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}
```

- [ ] **Step 2: Update PointRow and mapPointRow in venues.ts**

In `src/lib/venues.ts`, add `audio_url` to `PointRow` and map it:

```typescript
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
  audio_url: string | null;  // ← add this line
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
    ...(row.audio_url != null ? { audioUrl: row.audio_url } : {}),  // ← add this line
  };
}
```

- [ ] **Step 3: Apply schema migrations in Supabase**

Add to the bottom of `supabase/schema.sql`:

```sql
-- ============================================================
-- MIGRATIONS (apply after initial schema)
-- ============================================================

-- Add audio support to points
ALTER TABLE points ADD COLUMN IF NOT EXISTS audio_url text;

-- Supabase Storage: venue media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-media', 'venue-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read venue-media"    ON storage.objects;
DROP POLICY IF EXISTS "Public insert venue-media"  ON storage.objects;
DROP POLICY IF EXISTS "Public update venue-media"  ON storage.objects;

CREATE POLICY "Public read venue-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'venue-media');

CREATE POLICY "Public insert venue-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'venue-media');

CREATE POLICY "Public update venue-media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'venue-media');
```

Then paste and run these SQL statements in Supabase Dashboard → SQL Editor.

- [ ] **Step 4: Verify**

In Supabase Dashboard → Table Editor → `points`: confirm the `audio_url` column exists.
In Storage → Buckets: confirm `venue-media` bucket exists with public access.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/venues.ts supabase/schema.sql
git commit -m "feat: add audioUrl to Point type and audio_url to schema + Storage bucket"
```

---

## Task 2: Admin Dashboard — Load from Supabase + New Venue Button

**Files:**
- Modify: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `mapVenueRow`, `VenueRow`, `PointRow` from `@/lib/venues`; `createClient` from `@/lib/supabase/client`
- Produces: admin page that lists Supabase venues and links to `/admin/venues/new`

- [ ] **Step 1: Replace the admin page**

Replace the full content of `src/app/admin/page.tsx` with:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DEMO_VENUES } from '@/data/demo-venue';
import { Logo } from '@/components/Logo';
import { SectionMarker } from '@/components/SectionMarker';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import { mapVenueRow, type VenueRow, type PointRow } from '@/lib/venues';
import { CheckIcon } from '@/components/icons';
import { SignOutButton } from '@/components/SignOutButton';
import type { Venue } from '@/lib/types';

export default function AdminDashboard() {
  const supabaseReady = isSupabaseConfigured();
  const [venues, setVenues] = useState<Venue[]>(Object.values(DEMO_VENUES));

  useEffect(() => {
    if (!supabaseReady) return;
    const client = createClient();
    if (!client) return;
    async function load() {
      const { data: venueRows } = await client!.from('venues').select('*');
      if (!venueRows?.length) return;
      const ids = venueRows.map((v: VenueRow) => v.id);
      const { data: pointRows } = await client!.from('points').select('*').in('venue_id', ids);
      setVenues(
        venueRows.map((row: VenueRow) =>
          mapVenueRow(row, (pointRows ?? []).filter((p: PointRow) => p.venue_id === row.id))
        )
      );
    }
    load();
  }, [supabaseReady]);

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-warm-100 px-5 py-4 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <SignOutButton />
          <Link href="/" className="text-xs text-warm-500 hover:text-ink">← Ir al sitio</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8">
        <SectionMarker num="01" label="Panel de administración" />
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Tus <span style={{ color: '#E63946' }}>espacios</span>.
        </h1>
        <p className="text-sm text-warm-500 max-w-md mb-8">
          Gestiona los venues activos, genera QRs de ubicación y administra invitaciones.
        </p>

        {/* Supabase status */}
        <div
          className="surface p-4 mb-8 flex items-start gap-3"
          style={supabaseReady ? {} : { background: '#FFF9E6', borderColor: '#F5C842' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: supabaseReady ? '#DCFCE7' : '#FFF4D1' }}
          >
            {supabaseReady
              ? <CheckIcon size={16} color="#16A34A" />
              : <span style={{ color: '#B58200', fontWeight: 700 }}>!</span>}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">
              {supabaseReady ? 'Supabase conectado' : 'Modo demo (sin backend)'}
            </div>
            <div className="text-xs text-warm-500 mt-1">
              {supabaseReady
                ? 'Tus venues, tickets y check-ins se guardan en la base de datos.'
                : 'Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.'}
            </div>
          </div>
        </div>

        {/* Venues list */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs label-text">Venues</div>
          <Link href="/admin/venues/new" className="btn btn-primary text-xs px-3 py-1.5">
            + Nuevo venue
          </Link>
        </div>

        <div className="space-y-3">
          {venues.map((venue) => (
            <Link
              key={venue.id}
              href={`/admin/${venue.id}`}
              className="surface p-5 flex items-center gap-4 active:bg-warm-50 transition-colors"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: venue.brandColor || '#0F1B2E' }}
              >
                <span className="text-white text-xl font-bold">
                  {venue.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink">{venue.name}</div>
                <div className="text-xs text-warm-500 mt-0.5">
                  {Object.keys(venue.points).length} puntos · {venue.paths.length} conexiones · {venue.type}
                </div>
              </div>
              <Link
                href={`/admin/${venue.id}/edit`}
                onClick={e => e.stopPropagation()}
                className="text-xs text-warm-400 hover:text-ink px-2 py-1 rounded"
              >
                Editar
              </Link>
              <span className="text-warm-300 text-lg">›</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run `npm run dev`. Abre `/admin`. Confirma:
- Se listan los venues de Supabase (no los hardcoded de DEMO_VENUES)
- Aparece el botón "+ Nuevo venue" que lleva a `/admin/venues/new` (404 por ahora, está bien)
- El link "Editar" aparece en cada venue

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: admin dashboard loads venues from Supabase + new venue button"
```

---

## Task 3: Create Venue Form — `/admin/venues/new`

**Files:**
- Create: `src/app/admin/venues/new/page.tsx`

**Interfaces:**
- Consumes: `createClient` de `@/lib/supabase/client`
- Produces: venue row en Supabase, redirect a `/admin/[venueId]/edit`

- [ ] **Step 1: Create the page**

Create `src/app/admin/venues/new/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify**

Abre `/admin/venues/new`. Llena el formulario y envía. Confirma:
- Se crea el registro en Supabase `venues` (verificar en Table Editor)
- Redirige a `/admin/[id]/edit` (404 por ahora, está bien)
- El id generado es legible (slug + timestamp)

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/venues/new/page.tsx
git commit -m "feat: create venue form at /admin/venues/new"
```

---

## Task 4: VenueEditor Component

**Files:**
- Create: `src/components/VenueEditor.tsx`

**Interfaces:**
- Consumes: `Venue`, `Building`, `Point`, `PointType` de `@/lib/types`; `createClient` de `@/lib/supabase/client`
- Produces: `<VenueEditor venue={Venue} />` — editor completo con canvas SVG, toolbar de 4 modos, side panel, y botón guardar

- [ ] **Step 1: Create VenueEditor.tsx**

Create `src/components/VenueEditor.tsx` with the complete implementation:

```tsx
'use client';

import { useState, useRef } from 'react';
import type { Venue, Building, PointType } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

// ── Local types ──────────────────────────────────────────────────

type Mode = 'room' | 'point' | 'connect' | 'select';

interface EditorRoom {
  _id: string;
  x: number; y: number;
  w: number; h: number;
  label: string;
}

interface EditorPoint {
  id: string;
  name: string;
  type: PointType;
  x: number; y: number;
  emoji: string;
  description: string;
  imageUrl: string;
  audioUrl: string;
}

interface DrawState {
  startX: number; startY: number;
  currentX: number; currentY: number;
}

// ── Helpers ──────────────────────────────────────────────────────

function svgCoords(e: React.MouseEvent, svg: SVGSVGElement) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
  return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
}

async function uploadToStorage(
  file: File,
  venueId: string,
  pointId: string,
  kind: 'photo' | 'audio'
): Promise<string | null> {
  const client = createClient();
  if (!client) return null;
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${venueId}/${pointId}/${kind}.${ext}`;
  const { error } = await client.storage.from('venue-media').upload(path, file, { upsert: true });
  if (error) return null;
  return client.storage.from('venue-media').getPublicUrl(path).data.publicUrl;
}

const POINT_TYPES: { value: PointType; label: string; emoji: string }[] = [
  { value: 'entrance', label: 'Entrada',        emoji: '🚪' },
  { value: 'restroom', label: 'Baño',           emoji: '🚻' },
  { value: 'food',     label: 'Comida',         emoji: '🍽️' },
  { value: 'service',  label: 'Servicio',       emoji: '🛎️' },
  { value: 'info',     label: 'Información',    emoji: 'ℹ️' },
  { value: 'medical',  label: 'Médico',         emoji: '🏥' },
  { value: 'parking',  label: 'Estacionamiento',emoji: '🅿️' },
  { value: 'venue',    label: 'Salón',          emoji: '🏛️' },
  { value: 'shop',     label: 'Tienda',         emoji: '🛍️' },
  { value: 'custom',   label: 'Otro',           emoji: '📍' },
];

// ── Main component ───────────────────────────────────────────────

export function VenueEditor({ venue }: { venue: Venue }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<Mode>('room');
  const [zoom, setZoom] = useState(1);

  // Rooms
  const [rooms, setRooms] = useState<EditorRoom[]>(() =>
    venue.buildings.map((b, i) => ({ _id: `room-${i}`, x: b.x, y: b.y, w: b.w, h: b.h, label: b.label }))
  );
  const [drawState, setDrawState] = useState<DrawState | null>(null);
  const [pendingRoom, setPendingRoom] = useState<DrawState | null>(null);
  const [roomName, setRoomName] = useState('');

  // Points
  const [points, setPoints] = useState<EditorPoint[]>(() =>
    Object.values(venue.points).map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      x: p.x, y: p.y,
      emoji: p.emoji ?? '',
      description: p.description ?? '',
      imageUrl: p.imageUrl ?? '',
      audioUrl: p.audioUrl ?? '',
    }))
  );
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [pendingType, setPendingType] = useState<PointType>('entrance');

  // Paths
  const [paths, setPaths] = useState<[string, string][]>([...venue.paths]);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  // Selection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const deletedPointIds = useRef(new Set<string>());
  const [uploading, setUploading] = useState(false);

  // Save
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // ── Canvas events ────────────────────────────────────────────────

  function onCanvasMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current) return;
    // Only react to direct SVG clicks (not clicks on children)
    if (e.target !== svgRef.current && (e.target as SVGElement).tagName === 'rect' && mode !== 'room') return;

    if (mode === 'room') {
      const { x, y } = svgCoords(e, svgRef.current);
      setDrawState({ startX: x, startY: y, currentX: x, currentY: y });
    }
    if (mode === 'point' && e.target === svgRef.current) {
      const { x, y } = svgCoords(e, svgRef.current);
      setPendingPoint({ x, y });
      setPendingName('');
      setPendingType('entrance');
    }
  }

  function onCanvasMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !drawState) return;
    const { x, y } = svgCoords(e, svgRef.current);
    setDrawState(d => d ? { ...d, currentX: x, currentY: y } : null);
  }

  function onCanvasMouseUp() {
    if (!drawState) return;
    const x = Math.min(drawState.startX, drawState.currentX);
    const y = Math.min(drawState.startY, drawState.currentY);
    const w = Math.abs(drawState.currentX - drawState.startX);
    const h = Math.abs(drawState.currentY - drawState.startY);
    setDrawState(null);
    if (w > 3 && h > 3) {
      setPendingRoom({ startX: x, startY: y, currentX: x + w, currentY: y + h });
      setRoomName('');
    }
  }

  // ── Confirm pending room ─────────────────────────────────────────

  function confirmRoom() {
    if (!pendingRoom || !roomName.trim()) return;
    setRooms(rs => [...rs, {
      _id: `room-${Date.now()}`,
      x: pendingRoom.startX,
      y: pendingRoom.startY,
      w: pendingRoom.currentX - pendingRoom.startX,
      h: pendingRoom.currentY - pendingRoom.startY,
      label: roomName.trim(),
    }]);
    setPendingRoom(null);
  }

  // ── Confirm pending point ────────────────────────────────────────

  function confirmPoint() {
    if (!pendingPoint || !pendingName.trim()) return;
    const typeInfo = POINT_TYPES.find(t => t.value === pendingType);
    setPoints(ps => [...ps, {
      id: `pt-${Date.now()}`,
      name: pendingName.trim(),
      type: pendingType,
      x: pendingPoint.x,
      y: pendingPoint.y,
      emoji: typeInfo?.emoji ?? '📍',
      description: '',
      imageUrl: '',
      audioUrl: '',
    }]);
    setPendingPoint(null);
  }

  // ── Point click ──────────────────────────────────────────────────

  function onPointClick(e: React.MouseEvent, pointId: string) {
    e.stopPropagation();
    if (mode === 'connect') {
      if (!connectingFrom) {
        setConnectingFrom(pointId);
      } else if (connectingFrom === pointId) {
        setConnectingFrom(null);
      } else {
        const a = connectingFrom, b = pointId;
        const exists = paths.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
        if (!exists) setPaths(ps => [...ps, [a, b]]);
        setConnectingFrom(null);
      }
    } else if (mode === 'select') {
      setSelectedId(pointId);
    }
  }

  function onRoomClick(e: React.MouseEvent, roomId: string) {
    e.stopPropagation();
    if (mode === 'select') setSelectedId(roomId);
  }

  // ── Delete selected ──────────────────────────────────────────────

  function deleteSelected() {
    if (!selectedId) return;
    const isPoint = points.some(p => p.id === selectedId);
    if (isPoint) {
      if (!selectedId.startsWith('pt-')) deletedPointIds.current.add(selectedId);
      setPoints(ps => ps.filter(p => p.id !== selectedId));
      setPaths(ps => ps.filter(([a, b]) => a !== selectedId && b !== selectedId));
    } else {
      setRooms(rs => rs.filter(r => r._id !== selectedId));
    }
    setSelectedId(null);
  }

  // ── Update selected point field ──────────────────────────────────

  function updatePoint(field: keyof EditorPoint, value: string) {
    setPoints(ps => ps.map(p => p.id === selectedId ? { ...p, [field]: value } : p));
  }

  // ── Upload media ─────────────────────────────────────────────────

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, kind: 'photo' | 'audio') {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    setUploading(true);
    const url = await uploadToStorage(file, venue.id, selectedId, kind);
    if (url) updatePoint(kind === 'photo' ? 'imageUrl' : 'audioUrl', url);
    setUploading(false);
    e.target.value = '';
  }

  // ── Save ─────────────────────────────────────────────────────────

  async function save() {
    const client = createClient();
    if (!client) { setSaveMsg('Sin conexión a Supabase'); return; }
    setSaving(true);
    setSaveMsg('');
    try {
      const buildings: Building[] = rooms.map(({ _id: _, ...b }) => b);
      const { error: venueErr } = await client.from('venues').update({
        config: { floorWidth: venue.floorWidth, floorHeight: venue.floorHeight, buildings, paths },
        updated_at: new Date().toISOString(),
      }).eq('id', venue.id);
      if (venueErr) throw venueErr;

      if (points.length) {
        const { error: pointsErr } = await client.from('points').upsert(
          points.map(p => ({
            id: p.id,
            venue_id: venue.id,
            name: p.name,
            type: p.type,
            x: p.x,
            y: p.y,
            emoji: p.emoji || null,
            description: p.description || null,
            image_url: p.imageUrl || null,
            audio_url: p.audioUrl || null,
          })),
          { onConflict: 'venue_id,id' }
        );
        if (pointsErr) throw pointsErr;
      }

      for (const id of deletedPointIds.current) {
        await client.from('points').delete().eq('venue_id', venue.id).eq('id', id);
      }
      deletedPointIds.current.clear();
      setSaveMsg('Guardado ✓');
    } catch (err: unknown) {
      setSaveMsg(`Error: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Wheel zoom ───────────────────────────────────────────────────

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(4, z - e.deltaY * 0.001)));
  }

  // ── Derived ──────────────────────────────────────────────────────

  const selectedPoint = selectedId ? points.find(p => p.id === selectedId) ?? null : null;
  const selectedRoom = selectedId ? rooms.find(r => r._id === selectedId) ?? null : null;

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left: canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="border-b border-warm-100 px-4 py-2 flex items-center gap-1 flex-wrap">
          {([
            ['room',    '▭', 'Habitación'],
            ['point',   '📍', 'Punto'],
            ['connect', '↔',  'Conectar'],
            ['select',  '↖',  'Seleccionar'],
          ] as const).map(([m, icon, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setConnectingFrom(null); setSelectedId(null); setPendingPoint(null); setPendingRoom(null); }}
              className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors"
              style={{
                background: mode === m ? '#0F1B2E' : 'transparent',
                color: mode === m ? 'white' : '#0F1B2E',
              }}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-warm-400">{Math.round(zoom * 100)}%</span>
            {saveMsg && <span className="text-xs text-warm-500">{saveMsg}</span>}
            <button
              onClick={save}
              disabled={saving}
              className="btn btn-primary text-sm"
            >
              {saving ? 'Guardando…' : 'Guardar venue'}
            </button>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="flex-1 overflow-auto bg-warm-50 relative" onWheel={onWheel}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', display: 'inline-block' }}>
            <svg
              ref={svgRef}
              width={venue.floorWidth * 4}
              height={venue.floorHeight * 4}
              viewBox={`0 0 ${venue.floorWidth} ${venue.floorHeight}`}
              className="block select-none"
              style={{
                cursor: mode === 'room' ? 'crosshair' : mode === 'point' ? 'cell' : 'default',
                background: '#FAFAF8',
                border: '1px solid #EFEEEA',
              }}
              onMouseDown={onCanvasMouseDown}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onCanvasMouseUp}
            >
              {/* Grid */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E8E6E1" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Rooms */}
              {rooms.map(r => (
                <g key={r._id} onClick={e => onRoomClick(e, r._id)} style={{ cursor: mode === 'select' ? 'pointer' : 'default' }}>
                  <rect
                    x={r.x} y={r.y} width={r.w} height={r.h}
                    fill="#E8E6E1"
                    stroke={selectedId === r._id ? '#E63946' : '#C8C5BE'}
                    strokeWidth={selectedId === r._id ? 1 : 0.5}
                    rx={1}
                  />
                  <text
                    x={r.x + r.w / 2} y={r.y + r.h / 2}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.max(3, Math.min(r.w, r.h) * 0.16)}
                    fill="#666"
                    style={{ pointerEvents: 'none' }}
                  >
                    {r.label}
                  </text>
                </g>
              ))}

              {/* Drawing preview */}
              {drawState && (
                <rect
                  x={Math.min(drawState.startX, drawState.currentX)}
                  y={Math.min(drawState.startY, drawState.currentY)}
                  width={Math.abs(drawState.currentX - drawState.startX)}
                  height={Math.abs(drawState.currentY - drawState.startY)}
                  fill="#E8E6E1" fillOpacity={0.5}
                  stroke="#0F1B2E" strokeWidth={0.8} strokeDasharray="3,2"
                  rx={1}
                />
              )}

              {/* Paths */}
              {paths.map(([a, b], i) => {
                const pa = points.find(p => p.id === a);
                const pb = points.find(p => p.id === b);
                if (!pa || !pb) return null;
                return (
                  <line key={i}
                    x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke="#C8C5BE" strokeWidth={0.8} strokeDasharray="2,2"
                  />
                );
              })}

              {/* Connect target rings */}
              {mode === 'connect' && connectingFrom && points.map(p => {
                if (p.id === connectingFrom) return null;
                return (
                  <circle key={`ring-${p.id}`}
                    cx={p.x} cy={p.y} r={7}
                    fill="none" stroke="#E63946" strokeWidth={0.8} opacity={0.4}
                  />
                );
              })}

              {/* Points */}
              {points.map(p => (
                <g key={p.id} onClick={e => onPointClick(e, p.id)}
                  style={{ cursor: mode === 'select' || mode === 'connect' ? 'pointer' : 'default' }}>
                  <circle
                    cx={p.x} cy={p.y} r={4}
                    fill={connectingFrom === p.id || selectedId === p.id ? '#E63946' : '#0F1B2E'}
                    stroke="white" strokeWidth={0.8}
                  />
                  <text
                    x={p.x} y={p.y - 6}
                    textAnchor="middle" fontSize={3.5} fill="#0F1B2E"
                    style={{ pointerEvents: 'none' }}
                  >
                    {p.emoji || p.name.slice(0, 1)}
                  </text>
                  <text
                    x={p.x} y={p.y + 8}
                    textAnchor="middle" fontSize={2.5} fill="#888"
                    style={{ pointerEvents: 'none' }}
                  >
                    {p.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Pending room name popup */}
          {pendingRoom && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="surface p-4 shadow-lg w-64 pointer-events-auto">
                <div className="text-sm font-semibold mb-2">Nombre del espacio</div>
                <input
                  autoFocus
                  type="text"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmRoom(); if (e.key === 'Escape') setPendingRoom(null); }}
                  placeholder="ej. Salón principal"
                  className="w-full px-3 py-2 border border-warm-100 rounded-lg text-sm mb-3 focus:outline-none focus:border-ink"
                />
                <div className="flex gap-2">
                  <button onClick={confirmRoom} className="btn btn-primary flex-1 text-sm">Crear</button>
                  <button onClick={() => setPendingRoom(null)} className="btn btn-outline flex-1 text-sm">Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Pending point mini form */}
          {pendingPoint && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="surface p-4 shadow-lg w-64 pointer-events-auto">
                <div className="text-sm font-semibold mb-2">Nuevo punto</div>
                <input
                  autoFocus
                  type="text"
                  value={pendingName}
                  onChange={e => setPendingName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmPoint(); if (e.key === 'Escape') setPendingPoint(null); }}
                  placeholder="ej. Entrada principal"
                  className="w-full px-3 py-2 border border-warm-100 rounded-lg text-sm mb-2 focus:outline-none focus:border-ink"
                />
                <select
                  value={pendingType}
                  onChange={e => setPendingType(e.target.value as PointType)}
                  className="w-full px-3 py-2 border border-warm-100 rounded-lg text-sm mb-3 focus:outline-none focus:border-ink"
                >
                  {POINT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={confirmPoint} className="btn btn-primary flex-1 text-sm">Colocar</button>
                  <button onClick={() => setPendingPoint(null)} className="btn btn-outline flex-1 text-sm">Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: side panel (only in select mode when something is selected) */}
      {mode === 'select' && (selectedPoint || selectedRoom) && (
        <div className="w-72 border-l border-warm-100 overflow-y-auto shrink-0">
          <div className="p-4">
            {selectedPoint ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs label-text">Punto seleccionado</div>
                  <button onClick={deleteSelected} className="text-xs text-red-500 hover:text-red-700">Borrar</button>
                </div>

                <div>
                  <label className="text-xs text-warm-500 block mb-1">Nombre</label>
                  <input type="text" value={selectedPoint.name}
                    onChange={e => updatePoint('name', e.target.value)}
                    className="w-full px-2.5 py-2 border border-warm-100 rounded-lg text-sm focus:outline-none focus:border-ink" />
                </div>

                <div>
                  <label className="text-xs text-warm-500 block mb-1">Tipo</label>
                  <select value={selectedPoint.type}
                    onChange={e => updatePoint('type', e.target.value)}
                    className="w-full px-2.5 py-2 border border-warm-100 rounded-lg text-sm focus:outline-none focus:border-ink">
                    {POINT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-warm-500 block mb-1">Emoji</label>
                  <input type="text" value={selectedPoint.emoji} maxLength={2}
                    onChange={e => updatePoint('emoji', e.target.value)}
                    className="w-full px-2.5 py-2 border border-warm-100 rounded-lg text-sm focus:outline-none focus:border-ink" />
                </div>

                <div>
                  <label className="text-xs text-warm-500 block mb-1">Descripción</label>
                  <textarea value={selectedPoint.description}
                    onChange={e => updatePoint('description', e.target.value)}
                    rows={3}
                    className="w-full px-2.5 py-2 border border-warm-100 rounded-lg text-sm focus:outline-none focus:border-ink resize-none" />
                </div>

                <div>
                  <label className="text-xs text-warm-500 block mb-1">Foto</label>
                  {selectedPoint.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedPoint.imageUrl} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                  )}
                  <input type="file" accept="image/*" disabled={uploading}
                    onChange={e => handleFileUpload(e, 'photo')}
                    className="w-full text-xs text-warm-500" />
                </div>

                <div>
                  <label className="text-xs text-warm-500 block mb-1">Audio</label>
                  {selectedPoint.audioUrl && (
                    <audio controls src={selectedPoint.audioUrl} className="w-full mb-2" />
                  )}
                  <input type="file" accept="audio/*" disabled={uploading}
                    onChange={e => handleFileUpload(e, 'audio')}
                    className="w-full text-xs text-warm-500" />
                </div>

                {uploading && <p className="text-xs text-warm-400">Subiendo archivo…</p>}

                <div className="text-xs text-warm-400">
                  Posición: ({selectedPoint.x}, {selectedPoint.y})
                </div>
              </div>
            ) : selectedRoom ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs label-text">Habitación seleccionada</div>
                  <button onClick={deleteSelected} className="text-xs text-red-500 hover:text-red-700">Borrar</button>
                </div>
                <div className="text-sm font-semibold">{selectedRoom.label}</div>
                <div className="text-xs text-warm-400">
                  {Math.round(selectedRoom.w)} × {Math.round(selectedRoom.h)} m
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Fix TypeScript issue with `restaurant` type**

`Venue['type']` does not include `'restaurant'` in `types.ts`. Add it:

In `src/lib/types.ts`, update the venue type union:

```typescript
  type:
    | 'wedding'
    | 'festival'
    | 'museum'
    | 'hotel'
    | 'restaurant'   // ← add this
    | 'mall'
    | 'school'
    | 'hospital'
    | 'office'
    | 'park'
    | 'event'
    | 'other';
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Fix any errors reported (likely unused imports or type mismatches).

- [ ] **Step 4: Commit**

```bash
git add src/components/VenueEditor.tsx src/lib/types.ts
git commit -m "feat: VenueEditor component with SVG canvas, 4 modes, side panel, and Supabase save"
```

---

## Task 5: Edit Page — `/admin/[venueId]/edit`

**Files:**
- Create: `src/app/admin/[venueId]/edit/page.tsx`

**Interfaces:**
- Consumes: `VenueEditor` de `@/components/VenueEditor`; `fetchVenue` de `@/lib/venues`; `createClient` de `@/lib/supabase/client`
- Produces: página `/admin/[venueId]/edit` que carga el venue y renderiza el editor

- [ ] **Step 1: Create the edit page**

Create `src/app/admin/[venueId]/edit/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify end-to-end flow**

1. Abre `/admin/venues/new`, crea un venue (ej. "Mi Hotel", Hotel, 150×120)
2. Confirma que redirige a `/admin/[id]/edit`
3. Cambia a modo **Habitación** → dibuja 2-3 rectángulos → nombra cada uno
4. Cambia a modo **Punto** → coloca 3-4 puntos en el plano
5. Cambia a modo **Conectar** → conecta los puntos
6. Cambia a modo **Seleccionar** → click en un punto → edita nombre y emoji en el panel
7. Click **Guardar venue**
8. Confirma en Supabase Table Editor que:
   - `venues` tiene el `config` JSONB actualizado con `buildings` y `paths`
   - `points` tiene los puntos con sus datos
9. Recarga la página — el editor debe mostrar los datos guardados
10. Ve a `/v/[venueId]` — el mapa debe mostrar el venue recién creado

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/[venueId]/edit/page.tsx
git commit -m "feat: venue edit page at /admin/[venueId]/edit"
```

---

## Task 6: DestinationCard — Photo + Audio

**Files:**
- Modify: `src/components/DestinationCard.tsx`

**Interfaces:**
- Consumes: `Point.imageUrl`, `Point.audioUrl`, `Point.description` (todos opcionales)
- Produces: `DestinationCard` con imagen y reproductor de audio inline cuando el punto los tiene

- [ ] **Step 1: Update DestinationCard**

Replace `src/components/DestinationCard.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import type { Point } from '@/lib/types';

interface DestinationCardProps {
  point: Point;
  distance: number;
  minutes: number;
  href: string;
}

export function DestinationCard({ point, distance, minutes, href }: DestinationCardProps) {
  return (
    <div className="surface overflow-hidden">
      {point.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={point.imageUrl} alt={point.name} className="w-full h-32 object-cover" />
      )}
      <Link
        href={href}
        className="flex items-center gap-3 p-3.5 active:bg-warm-50 active:scale-[0.99] transition-transform"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xl"
          style={{ background: (point.color || '#0F1B2E') + '22' }}
        >
          {point.emoji || '📍'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink truncate">{point.name}</div>
          {point.description && (
            <div className="text-xs text-warm-500 mt-0.5 truncate">{point.description}</div>
          )}
          <div className="text-xs text-warm-400 mt-0.5">{distance} m · {minutes} min caminando</div>
        </div>
        <span className="text-warm-300 text-lg">›</span>
      </Link>
      {point.audioUrl && (
        <div className="px-3.5 pb-3">
          <audio controls src={point.audioUrl} className="w-full h-8" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

1. Crea un punto con foto y audio desde el editor
2. Abre `/v/[venueId]` — la `DestinationCard` debe mostrar la foto arriba y el player de audio abajo
3. Confirma que el link "navegar" sigue funcionando (el componente ahora es `<div>` wrapper con `<Link>` interno)

- [ ] **Step 3: Commit**

```bash
git add src/components/DestinationCard.tsx
git commit -m "feat: DestinationCard shows photo and audio player when point has media"
```

---

## Task 7: Link desde venue admin detail

**Files:**
- Modify: `src/app/admin/[venueId]/page.tsx`

**Interfaces:**
- Produces: botón "Editar plano" en la página de detalle del venue

- [ ] **Step 1: Add edit link to venue detail page**

In `src/app/admin/[venueId]/page.tsx`, add this import at the top (it's already importing from `@/components/icons` — add `PencilIcon` if it exists, otherwise use an inline SVG):

Add a new card to the action grid after the "Demo de visitante" card (after line 93, before the closing `</div>` of the grid at line 94):

```tsx
          <Link href={`/admin/${venueId}/edit`} className="surface p-5 rounded-xl active:scale-[0.99] transition-transform" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#F5F0FF' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div className="text-sm font-semibold">Editar plano</div>
            <div className="text-xs text-warm-500 mt-1">Diseña habitaciones, puntos y rutas</div>
          </Link>
```

The full grid block after the edit should look like:

```tsx
        {/* Action grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href={`/admin/${venueId}/qr-points`} ...>...</Link>
          {venue.requiresTicket && (<Link href={`/admin/${venueId}/tickets`} ...>...</Link>)}
          <Link href={`/v/${venueId}/checkin`} ...>...</Link>
          <Link href={`/v/${venueId}`} ...>...</Link>
          <Link href={`/admin/${venueId}/edit`} ...>  {/* ← new card */}
            ...
          </Link>
        </div>
```

- [ ] **Step 2: Verify**

Abre `/admin/[venueId]` — debe aparecer un link/botón "Editar plano" que lleva al editor.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/[venueId]/page.tsx
git commit -m "feat: add edit floor plan link to venue detail page"
```

---

## Task 8: Deploy a Vercel

- [ ] **Step 1: Build check**

```bash
npm run build
```

Corrige cualquier error de TypeScript o build antes de continuar.

- [ ] **Step 2: Push**

```bash
git push origin main
```

- [ ] **Step 3: Verify en producción**

1. Espera que Vercel complete el deploy
2. Abre `https://aqui-five-chi.vercel.app/admin`
3. Crea un venue real con el nombre y dimensiones del cliente
4. Diseña el plano, coloca puntos
5. Guarda y ve a `/admin/[venueId]/qr-points` — los QRs ya apuntan a la URL de Vercel
6. Escanea un QR con el teléfono — debe abrir el mapa del venue recién creado
