# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint via next lint
```

There is no test suite. Verification is manual via the browser.

## Environment

Copy `.env.local.example` to `.env.local`. Supabase vars are optional — without them the app runs entirely in demo mode with hardcoded data. Set `NEXT_PUBLIC_APP_URL` to whatever domain QR codes should point at (defaults to `window.location.origin` in the browser).

## Architecture

**Aquí** is a Next.js 14 App Router app that lets venue visitors scan a "You are here" QR code and get turn-by-turn navigation to any point of interest, without installing an app.

### Route trees

| Prefix | Audience |
|---|---|
| `/v/[venueId]/*` | Visitor-facing (mobile, no auth) |
| `/admin/*` | Venue admin (Supabase auth when configured; open in demo mode) |

Visitor sub-routes: `page.tsx` (scan / destination list) → `map/page.tsx` (SVG floor plan + route) → `ar/page.tsx` (camera + compass arrow). Ticketed venues add `t/[ticketCode]/page.tsx` (guest QR view) and `checkin/page.tsx` (staff scanner).

### Data flow

All pages load venue data through `useVenue` (`src/hooks/useVenue.ts`). The hook tries Supabase first via `fetchVenue` (`src/lib/venues.ts`), then falls back to bundled demo data in `src/data/demo-venue.ts`. Lazy init keeps SSR and the first client render in sync (no loading flash).

### Venue model (`src/lib/types.ts`)

A `Venue` has:
- `points: Record<string, Point>` — named locations with floor-plan `x/y` coordinates (≈ meters) and optional GPS `lat/lng`
- `paths: [string, string][]` — undirected adjacency list forming the walkable graph
- `buildings: Building[]` — rectangles drawn on the SVG floor plan
- `requiresTicket` — gates whether the ticket/check-in flow is active

### Routing (`src/lib/routing.ts`)

`computeRoute(venue, fromId, toId)` runs BFS on `venue.paths` and returns `{ path, distance, estimatedMinutes }`. Distance is Euclidean in floor-plan units (≈ meters). ETA assumes 70 m/min walking pace. `bearingBetween` and `describeTurn` power the AR and turn-instruction UI.

### QR encoding (`src/lib/scan.ts`)

Two QR types coexist:
- **Location QR** — encodes a full URL `https://…/v/{venue}?loc={pointId}` or a bare point id. Parsed by `parseScannedLocation`.
- **Ticket QR** — encodes `/v/{venue}/t/{code}` or a bare code. Parsed by `parseScannedTicketCode`.

Both parsers accept either a full URL or a bare identifier, so printed QRs and manual entry both work.

### Supabase integration

`src/lib/supabase/env.ts` — `isSupabaseConfigured()` is the single source of truth for whether a real DB is wired up (checks for placeholder host `tuproyecto`). `client.ts` / `server.ts` export the browser and server Supabase clients.

`src/lib/venues.ts` — `fetchVenue(client, id)` fetches a venue row + its point rows and maps them to the domain `Venue` type. `VenueConfig` is a JSONB blob on the venues table that holds `floorWidth`, `floorHeight`, `buildings`, `paths`, and `logoUrl`.

`src/lib/tickets.ts` — `TicketRow` DB shape and `mapTicketRow` to convert snake_case rows to camelCase domain `Ticket` objects.

`src/middleware.ts` — protects `/admin/*` routes. Passes through when Supabase is not configured. When configured, redirects unauthenticated requests to `/admin/login` and bounces authenticated users away from the login page.

### Adding a new venue

Add a new `Venue` object to `src/data/demo-venue.ts` and register it in the `DEMO_VENUES` record. It becomes available at `/v/{id}` immediately. Floor-plan coordinates should fit within `floorWidth × floorHeight`. Paths must form a connected graph for routing to work.

### Design system

Tailwind design tokens are in `tailwind.config.ts` (brand colors, warm neutrals). Global CSS utility classes (`btn`, `surface`, `label-text`, etc.) are in `src/app/globals.css`. The color palette centers on ink (`#0F1B2E`), red (`#E63946`), and cream (`#F9F6F0`).
