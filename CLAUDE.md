# CLAUDE.md — Contexto del proyecto "Aquí"

> Este archivo lo lee Claude Code automáticamente. Resume qué es el proyecto,
> cómo está organizado, las reglas para no ensuciarlo, y el roadmap hasta MVP.

## Qué es

**Aquí** es un sistema de **navegación + información + control de acceso por QR**
para cualquier espacio (bodas, festivales, museos, hoteles, malls…). El visitante
escanea un QR físico "Usted está aquí", ve dónde está, elige destino, y lo guía
con un **mapa SVG con ruta animada** y una **vista AR con flecha 3D** (brújula del
teléfono). Los admins generan QRs de ubicación imprimibles y **tickets personales**
por invitado, con **check-in/validación** de acceso. Sin apps, sin instalar.

## Stack

- **Next.js 14** (App Router, React 18, todo en `'use client'` por ahora)
- **TypeScript** estricto · **Tailwind CSS** (tokens de marca en `tailwind.config.ts` + `globals.css`)
- **Supabase** (Postgres) — **opcional**: sin él, la app corre en **modo demo** con datos hardcoded
- `html5-qrcode` (escaneo) · `qrcode` (generación) · DeviceOrientation/MediaStream (AR)

## Comandos

```bash
npm run dev        # desarrollo en http://localhost:3000
npm run build      # build de producción (corre lint + typecheck)
npm run lint       # ESLint (next/core-web-vitals)
npx tsc --noEmit   # solo chequeo de tipos
```

**Antes de cada commit, deja esto en verde:** `npm run lint && npx tsc --noEmit && npm run build`.

## Mapa del código (dónde vive cada cosa)

```
src/
├─ app/            Rutas (App Router). Cada carpeta = una ruta.
│  ├─ page.tsx                       Landing comercial
│  ├─ v/[venueId]/                   VISITANTE: page (escanear/destinos),
│  │                                 map, ar, checkin, t/[ticketCode] (ticket)
│  └─ admin/                         ADMIN: dashboard, [venueId] (detalle),
│                                    qr-points (imprimibles), tickets (invitaciones)
├─ components/     UI presentacional (datos por props). icons.tsx = SVGs compartidos.
├─ hooks/          useVenue.ts → carga el venue de la ruta [venueId]
├─ lib/            Lógica pura SIN React:
│  ├─ types.ts        Tipos del dominio (Venue, Point, Ticket, RouteResult…)
│  ├─ routing.ts      Grafo BFS + bearings + distancia + ETA
│  ├─ scan.ts         Parseo del texto de un QR escaneado (ubicación / ticket)
│  ├─ url.ts          getBaseUrl + URLs públicas (ubicación, ticket)
│  ├─ tickets.ts      TicketRow (fila DB) + mapTicketRow (→ dominio camelCase)
│  └─ supabase/       env.ts (¿configurado?) · client.ts (browser) · server.ts (SSR)
└─ data/demo-venue.ts  Venues demo hardcoded (Plaza Aquí + Boda)
supabase/            schema.sql (tablas + RLS) · seed.sql (datos demo)
```

### Regla de oro (para escalar sin desorden)
Si algo (texto, SVG, cálculo, fetch) se repite en **2+ páginas**, muévelo a
`lib/` (lógica), `hooks/` (estado React) o `components/` (UI). Esa regla es la que
ya bajó la duplicación; mantenla.

## Conceptos clave del dominio

- **Venue**: espacio con `points` (Record por id), `buildings` (rects del plano) y
  `paths` (lista de aristas `[from,to]` que forman el grafo caminable).
- **Routing** (`lib/routing.ts`): `computeRoute(venue, from, to)` → BFS por saltos,
  distancia euclidiana entre puntos (≈ metros), ETA a ~70 m/min. `bearingBetween` y
  `describeTurn` alimentan la flecha AR y las instrucciones del mapa.
- **Modo demo vs Supabase**: `isSupabaseConfigured()` decide. Si NO hay Supabase,
  todo cae a datos demo (tickets falsos, stats en 0). El patrón de fallback está
  centralizado en `hooks/useVenue.ts` (hoy solo demo — ver roadmap P0).
- **Dos tipos de QR**:
  - *Ubicación*: `…/v/{venueId}?loc={pointId}` → `parseScannedLocation()`
  - *Ticket*: `…/v/{venueId}/t/{code}` → `parseScannedTicketCode()`
- **Check-in**: el staff escanea el QR del invitado → valida (válido / ya entró /
  inválido / evento equivocado) y marca `checked_in_at` + registra en `checkins`.

## Gotchas (cosas que muerden)

- **`NEXT_PUBLIC_*` se hornea en build.** Si cambias env vars en Vercel, hay que
  **redeploy**. Sin `NEXT_PUBLIC_APP_URL`, `getBaseUrl()` usa `window.location.origin`.
- **Cámara y AR requieren HTTPS** (Vercel sí, `localhost` a veces no). En iOS, el AR
  pide permiso de orientación explícito (ya manejado en `ar/page.tsx`).
- **RLS permisiva**: `schema.sql` deja lectura/escritura pública para que el MVP
  funcione sin auth. **Restringir antes de producción** (ver roadmap P0).
- **Venues hardcoded** en `data/demo-venue.ts`. La tabla `venues`/`points` existe en
  el schema pero el código aún no la consume.
- **Faltan iconos PWA**: `public/manifest.json` referencia `icon-192.png` y
  `icon-512.png` que no existen en `public/`.

## Estado actual

- ✅ Builda en verde (tsc + lint + `next build`, 11 rutas).
- ✅ En GitHub: ramas `main` y `claude/confident-cray-nq0gwn` (mismo commit).
- ✅ Ya refactorizado: hooks/useVenue, lib/{scan,url,tickets}, supabase/env,
  components/icons; bug de check-in (snake/camel) corregido; código muerto limpiado.

## Roadmap hasta MVP pulido (priorizado)

### P0 — núcleo / antes de un cliente real
- [ ] **Venues desde Supabase** con fallback a demo. Implementar el `TODO` en
      `hooks/useVenue.ts` (leer de tablas `venues` + `points`; si falla o no hay
      Supabase, usar `getDemoVenue`). Mapear filas snake_case → dominio como en
      `lib/tickets.ts`.
- [ ] **Auth en `/admin`** (Supabase Auth). Hoy cualquiera entra.
- [ ] **Restringir RLS** en `supabase/schema.sql` (que cada dueño vea solo su venue).
- [ ] **Estados de error/vacío consistentes**: hoy si el venue no existe, varias
      páginas quedan en "Cargando…" para siempre. Unificar un componente de error.

### P1 — experiencia
- [ ] **Editor visual de puntos** (drag-and-drop sobre `components/FloorPlan.tsx`),
      guardando a Supabase. Es la feature grande del roadmap.
- [ ] **Imágenes/audio por punto** (Supabase Storage). `Point` ya tiene
      `imageUrl`/`description`; falta UI y página de detalle de punto.
- [ ] **i18n** (multi-idioma) — el landing lo promete.
- [ ] **PWA**: agregar `public/icon-192.png` y `icon-512.png`; service worker offline.

### P2 — negocio
- [ ] Stripe (suscripciones) · onboarding self-service · white-label (dominio+logo;
      `brandColor`/`accentColor` ya existen) · analytics de escaneos (heatmap).

### Deuda técnica / pulido rápido
- [ ] **Tests** (no hay): Vitest sobre `lib/{routing,scan,url,tickets}` (lógica pura,
      fácil de cubrir). Sería el primer quick win.
- [ ] Validar formularios en `admin/.../tickets` (email/teléfono).
- [ ] `ARArrow` tiene prop `showCalibrationHint` sin usar.
- [ ] `metadataBase` en `app/layout.tsx` para Open Graph.

## Convenciones de estilo
- Comentarios y nombres en inglés (como el código actual); contenido de UI en español.
- Reusa los tokens de marca (`text-red`, `bg-ink`, vars CSS) en vez de hex sueltos
  cuando sea natural — pero **no rompas el diseño**, está calibrado al pitch.
- Componentes nuevos de íconos → `components/icons.tsx`.
