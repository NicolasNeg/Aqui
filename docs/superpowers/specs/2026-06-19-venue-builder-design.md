# Venue Builder — Design Spec
**Date:** 2026-06-19
**Status:** Approved

## Goal

Allow any client to create a venue (indoor space) from the admin panel with a visual floor plan editor, place points of interest with multimedia, connect them into a navigable graph, and save everything to Supabase — so QR codes can be generated immediately for any location.

**Out of scope (Phase 2):** multi-tenant auth, per-client logins, GPS/outdoor venues, drag-to-reposition elements.

---

## Route Structure

```
/admin                        → list venues (Supabase) + "New venue" button
/admin/venues/new             → Step 1: basic info form → on submit redirects to /admin/[venueId]/edit
/admin/[venueId]/edit         → Step 2: floor plan editor (create and edit use same page)
/admin/[venueId]/qr-points    → existing — unchanged
/admin/[venueId]/tickets      → existing — unchanged
```

---

## Admin Dashboard Fix

`src/app/admin/page.tsx` currently hardcodes `Object.values(DEMO_VENUES)`. Fix: when Supabase is configured, fetch venues from the `venues` table and render those instead. Fall back to `DEMO_VENUES` in demo mode. Add a "+ Nuevo venue" button that links to `/admin/venues/new`.

---

## Step 1 — Basic Info Form (`/admin/venues/new`)

Fields:

| Field | Input | Notes |
|---|---|---|
| Nombre | text | required |
| Tipo | select | wedding, hotel, restaurant, office, event, other |
| Color de marca | color picker | defaults to `#0F1B2E` |
| Color de acento | color picker | defaults to `#E63946` |
| Ancho del espacio (m) | number | sets SVG canvas width |
| Alto del espacio (m) | number | sets SVG canvas height |

On submit: creates row in `venues` table with empty `config` JSONB (`{buildings:[], paths:[]}`) and redirects to `/admin/{newVenueId}/edit`.

---

## Step 2 — Floor Plan Editor (`/admin/venues/new/editor`)

### Canvas

An SVG element sized to `floorWidth × floorHeight` (scaled to fit viewport). Coordinate system matches the existing `FloorPlan.tsx` renderer — same units used by the visitor map and routing engine.

Zoom: mouse wheel applies `transform: scale()` via CSS on the SVG wrapper. No external library.

### Toolbar Modes

Four mutually exclusive modes, toggled via a top toolbar:

| Mode | Icon label | Behavior |
|---|---|---|
| **Habitación** | ▭ | Click+drag on empty canvas → draws rectangle live → on mouseup opens inline name input → saves as building |
| **Punto** | 📍 | Click on canvas → opens mini inline form (name, type, emoji) → places pin at click coords |
| **Conectar** | ↔ | Click point A → highlights in red → click point B → adds `[A, B]` to paths; click same point again to cancel |
| **Seleccionar** | ↖ | Click room or point → opens side panel with edit fields + delete button |

### Side Panel (Seleccionar mode)

For **rooms**: name, position/size (read-only display), delete button.

For **points**:
```
Nombre        [text input]
Tipo          [select: entrada | salida | baño | mesa | escenario | otro]
Emoji         [single char input]
Descripción   [textarea]
Foto          [file input → uploads to Supabase Storage]
Audio         [file input → uploads to Supabase Storage]
              [Guardar] [Borrar]
```

### Save Behavior

A "Guardar venue" button at the top right:
- Writes `config` JSONB (`floorWidth`, `floorHeight`, `buildings`, `paths`) back to the `venues` row.
- Upserts all points to the `points` table (`venue_id`, `name`, `type`, `x`, `y`, `emoji`, `description`, `image_url`, `audio_url`).
- Deletes points removed during the session (editor keeps a `deletedPointIds: Set<string>` in local state; on save, issues DELETE for each id in that set).
- On success: shows a toast "Guardado" and enables the "Ver QRs" link.

Auto-save is not implemented in Phase 1 — explicit save only.

---

## Supabase Storage

Bucket: `venue-media` (public read, authenticated write).

File paths:
- Photos: `venue-media/{venueId}/{pointId}/photo.{ext}`
- Audio: `venue-media/{venueId}/{pointId}/audio.{ext}`

Upload happens immediately when a file is selected in the side panel (not deferred to save). The returned public URL is stored in the point's local state and written to Supabase on "Guardar venue".

---

## Schema Change

Add `audio_url text` column to the `points` table:

```sql
ALTER TABLE points ADD COLUMN IF NOT EXISTS audio_url text;
```

Add to `supabase/schema.sql` and apply via Supabase SQL editor.

---

## Visitor-Facing Changes

`src/components/DestinationCard.tsx` — if the point has `imageUrl`, render the image. If it has `audioUrl`, render a play/pause button using the HTML `<audio>` element (no library).

`src/lib/types.ts` — add `audioUrl?: string` to the `Point` type.

---

## Component Breakdown

| File | Responsibility |
|---|---|
| `src/app/admin/venues/new/page.tsx` | Step 1 form, creates venue row, redirects to `/admin/[venueId]/edit` |
| `src/app/admin/[venueId]/edit/page.tsx` | Loads venue by `venueId`, renders `VenueEditor` (used for both create and edit) |
| `src/components/VenueEditor.tsx` | Canvas SVG + toolbar + side panel — all editor state lives here |
| `src/app/admin/page.tsx` | Add Supabase venue fetch + "+ Nuevo venue" button |
| `src/components/DestinationCard.tsx` | Add photo + audio playback |
| `src/lib/types.ts` | Add `audioUrl?: string` to `Point` |
| `supabase/schema.sql` | Add `audio_url` column |

---

## Auth

Middleware already protects `/admin/*`. Phase 1: single admin user manages all venues. Multi-tenant (per-client logins + RLS `owner_id`) is Phase 2.

---

## Out of Scope (Phase 2)

- Multi-tenant auth (per-client accounts, `owner_id` RLS)
- Drag-to-reposition rooms and points after placement
- Outdoor / GPS-based venues
- Multi-floor venues
- Visual route preview in the editor
