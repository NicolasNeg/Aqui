# CLAUDE.md — Contexto del proyecto "Aquí"

> Este archivo lo lee Claude Code automáticamente. Resume qué es el proyecto,
> cómo está organizado, las reglas para no ensuciarlo, y el roadmap hasta MVP.

## Qué es

**Aquí** es un sistema de **navegación + información + control de acceso por QR**
para cualquier espacio (bodas, festivales, museos, hoteles, malls…). El visitante
escanea un QR físico "Usted está aquí", ve dónde está, elige destino, y lo guía
con un **mapa SVG con ruta animada** y una **vista AR con flecha 3D** (brújula del
teléfono). Los admins **crean venues con un editor visual de planos**, generan QRs
imprimibles y **tickets personales** por invitado con **check-in/validación** de
acceso. Sin apps, sin instalar.

## Stack

- **Next.js 14** (App Router, React 18, todo en `'use client'` por ahora)
- **TypeScript** estricto · **Tailwind CSS** (tokens de marca en `tailwind.config.ts` + `globals.css`)
- **Supabase** (Postgres + Storage) — **opcional**: sin él, la app corre en **modo demo** con datos hardcoded
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
│  └─ admin/                         ADMIN: dashboard, venues/new (crear),
│                                    [venueId] (detalle), [venueId]/edit (editor),
│                                    qr-points (imprimibles), tickets (invitaciones)
├─ components/     UI presentacional (datos por props). icons.tsx = SVGs compartidos.
│  └─ VenueEditor.tsx   Editor SVG de planos: 4 modos (habitación/punto/conectar/seleccionar)
├─ hooks/          useVenue.ts → carga el venue (Supabase primero, fallback demo)
├─ lib/            Lógica pura SIN React:
│  ├─ types.ts        Tipos del dominio (Venue, Point, Building, Ticket, RouteResult…)
│  ├─ venues.ts       VenueRow/PointRow + mapVenueRow + fetchVenue (desde Supabase)
│  ├─ routing.ts      Grafo BFS + bearings + distancia + ETA
│  ├─ scan.ts         Parseo del texto de un QR escaneado (ubicación / ticket)
│  ├─ url.ts          getBaseUrl + URLs públicas (ubicación, ticket)
│  ├─ tickets.ts      TicketRow (fila DB) + mapTicketRow (→ dominio camelCase)
│  └─ supabase/       env.ts (¿configurado?) · client.ts (browser) · server.ts (SSR)
└─ data/demo-venue.ts  Venues demo hardcoded (Plaza Aquí + Boda) — fallback sin Supabase
supabase/            schema.sql (tablas + RLS + bucket venue-media) · seed.sql (datos demo)
```

### Regla de oro (para escalar sin desorden)
Si algo (texto, SVG, cálculo, fetch) se repite en **2+ páginas**, muévelo a
`lib/` (lógica), `hooks/` (estado React) o `components/` (UI). Esa regla es la que
ya bajó la duplicación; mantenla.

## Conceptos clave del dominio

- **Venue**: espacio con `points` (Record por id), `buildings` (rects del plano — `Building.id?` es solo local en el editor, no se persiste) y `paths` (lista de aristas `[from,to]`). El layout va en `venues.config` JSONB; los puntos van en la tabla `points`.
- **Routing** (`lib/routing.ts`): `computeRoute(venue, from, to)` → BFS por saltos, distancia euclidiana entre puntos (≈ metros), ETA a ~70 m/min. `bearingBetween` y `describeTurn` alimentan la flecha AR y las instrucciones del mapa.
- **Modo demo vs Supabase**: `isSupabaseConfigured()` decide. `useVenue` intenta `fetchVenue` desde Supabase; si falla o no hay conexión, cae a `getDemoVenue`. El admin dashboard también carga de Supabase con fallback a `DEMO_VENUES`.
- **VenueEditor**: SVG canvas nativo (sin librerías), 4 modos de edición. Guarda en Supabase con upsert de `venues.config` + upsert/delete de `points`. Media sube al bucket `venue-media` en Storage.
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
- **Storage `venue-media` público**: INSERT/UPDATE sin auth. Antes de escalar, agregar restricciones de tamaño y rate limiting.
- **Migración SQL manual**: el final de `supabase/schema.sql` incluye `ALTER TABLE points ADD COLUMN audio_url` y el bucket `venue-media`. Aplicar en Supabase Dashboard → SQL Editor si no se hizo aún.
- **`createClient()` puede retornar `null`**: siempre null-check antes de usarlo.
- **Faltan iconos PWA**: `public/manifest.json` referencia `icon-192.png` y
  `icon-512.png` que no existen en `public/`.

## Estado actual

- ✅ Builda en verde (tsc + lint + `next build`, 13 rutas).
- ✅ Supabase conectado: venues, points, tickets, checkins, Storage (`venue-media`).
- ✅ `useVenue` y admin dashboard cargan de Supabase con fallback a demo.
- ✅ Editor visual de venues: `/admin/venues/new` → `/admin/[venueId]/edit` (SVG canvas, 4 modos, media upload).
- ✅ DestinationCard muestra foto y player de audio cuando el punto tiene media.
- ✅ Auth en `/admin` vía middleware (Supabase Auth cuando está configurado).

## Roadmap (priorizado)

### P0 — antes de producción real
- [ ] **Restringir RLS**: columna `owner_id` en `venues` + políticas por dueño.
- [ ] **Multi-tenant auth**: login de clientes, cada uno ve solo sus venues.
- [ ] **Limpieza de media**: al borrar un punto, borrar sus archivos en Storage.
- [ ] **Editar nombre de habitación** en el editor (hoy read-only en side panel).
- [ ] **Estados de error/vacío consistentes**: unificar componente de error.

### P1 — experiencia
- [ ] **Outdoor / GPS**: venues al aire libre con lat/lng en puntos.
- [ ] **Multi-piso**: soporte para varios niveles.
- [ ] **i18n** (multi-idioma) — el landing lo promete.
- [ ] **PWA**: `icon-192.png` y `icon-512.png`; service worker offline.

### P2 — negocio
- [ ] Stripe (suscripciones) · onboarding self-service · white-label · analytics.

### Bugs conocidos — AR / Brújula / GPS
- [ ] **Tilt compensation en Android**: `ARArrow` usa `360 - e.alpha` que solo es correcto con el teléfono plano. A ~70° de inclinación (AR real) el heading deriva 10-30°. Necesita compensación con `beta`/`gamma` de `DeviceOrientationEvent` o usar `AbsoluteOrientationSensor` de la Generic Sensor API.
- [ ] **Race condition `gotAbsolute`**: en Android, `deviceorientation` puede llegar antes que `deviceorientationabsolute` y mostrar un heading relativo brevemente. Solución: registrar `deviceorientation` solo si `deviceorientationabsolute` no llega en los primeros 500ms.
- [ ] **Sin retry de cámara en Android**: si el usuario deniega la cámara en Android (no-iOS), no hay botón para volver a pedirla. El flujo muestra el error pero no ofrece reintentar sin recargar la página. Archivo: `src/app/v/[venueId]/ar/page.tsx`.
- [ ] **Strict Mode stream leak**: en desarrollo (React 18 Strict Mode), el doble-effect invocation deja un `MediaStream` huérfano activo (luz de cámara encendida). Afecta solo `npm run dev`, no producción.

### Deuda técnica
- [ ] **Tests**: Vitest sobre `lib/{routing,scan,url,tickets}` (lógica pura).
- [ ] Validar formularios en `admin/.../tickets` (email/teléfono).
- [ ] `ARArrow` tiene prop `showCalibrationHint` sin usar.
- [ ] `metadataBase` en `app/layout.tsx` para Open Graph.

## Convenciones de estilo
- Comentarios y nombres en inglés (como el código actual); contenido de UI en español.
- Reusa los tokens de marca (`text-red`, `bg-ink`, vars CSS) en vez de hex sueltos
  cuando sea natural — pero **no rompas el diseño**, está calibrado al pitch.
- Componentes nuevos de íconos → `components/icons.tsx`.
