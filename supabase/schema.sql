-- ============================================================
-- Aquí — Database Schema
-- ============================================================
-- Pega este archivo completo en el SQL Editor de Supabase:
-- Dashboard → SQL Editor → New query → paste → Run
--
-- Es idempotente: puedes re-ejecutarlo sin perder datos.
-- IMPORTANTE: Políticas RLS permisivas para MVP.
-- Restringir antes de escalar a producción.
-- ============================================================

-- UUID extension
create extension if not exists "uuid-ossp";


-- ============================================================
-- VENUES — lugares/eventos
-- ============================================================

create table if not exists venues (
  id              text primary key,
  name            text not null,
  type            text not null default 'event',
  brand_color     text default '#0F1B2E',
  accent_color    text default '#E63946',
  origin_lat      numeric,
  origin_lng      numeric,
  welcome_text    text,
  requires_ticket boolean default false,
  config          jsonb default '{}'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists venues_type_idx on venues(type);


-- ============================================================
-- POINTS — puntos en el plano de cada venue
-- ============================================================

create table if not exists points (
  id          text not null,
  venue_id    text not null references venues(id) on delete cascade,
  name        text not null,
  type        text default 'custom',
  x           numeric not null,
  y           numeric not null,
  lat         numeric,
  lng         numeric,
  emoji       text,
  color       text,
  description text,
  image_url   text,
  audio_url   text,
  primary key (venue_id, id)
);

create index if not exists points_venue_id_idx on points(venue_id);


-- ============================================================
-- TICKETS — invitaciones personales
-- ============================================================

create table if not exists tickets (
  id                uuid primary key default uuid_generate_v4(),
  venue_id          text not null references venues(id) on delete cascade,
  code              text unique not null,
  guest_name        text,
  guest_email       text,
  guest_phone       text,
  access_level      text not null default 'general'
                    check (access_level in ('general', 'vip', 'staff', 'press')),
  table_assignment  text,
  notes             text,
  metadata          jsonb default '{}'::jsonb,
  created_at        timestamptz default now(),
  checked_in_at     timestamptz
);

create index if not exists tickets_venue_id_idx    on tickets(venue_id);
create index if not exists tickets_code_idx        on tickets(code);
create index if not exists tickets_checked_in_idx  on tickets(checked_in_at)
  where checked_in_at is not null;


-- ============================================================
-- CHECKINS — log de cada validación de ticket
-- ============================================================

create table if not exists checkins (
  id            uuid primary key default uuid_generate_v4(),
  ticket_id     uuid not null references tickets(id) on delete cascade,
  checked_in_at timestamptz default now(),
  staff_name    text,
  device_info   text
);

create index if not exists checkins_ticket_id_idx on checkins(ticket_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table venues   enable row level security;
alter table points   enable row level security;
alter table tickets  enable row level security;
alter table checkins enable row level security;

-- Drop existing policies (idempotent)
drop policy if exists "Public read venues"     on venues;
drop policy if exists "Public insert venues"   on venues;
drop policy if exists "Public update venues"   on venues;
drop policy if exists "Public delete venues"   on venues;

drop policy if exists "Public read points"     on points;
drop policy if exists "Public insert points"   on points;
drop policy if exists "Public update points"   on points;
drop policy if exists "Public delete points"   on points;

drop policy if exists "Public read tickets"    on tickets;
drop policy if exists "Public insert tickets"  on tickets;
drop policy if exists "Public update tickets"  on tickets;
drop policy if exists "Public delete tickets"  on tickets;

drop policy if exists "Public read checkins"   on checkins;
drop policy if exists "Public insert checkins" on checkins;

-- venues
create policy "Public read venues"   on venues for select using (true);
create policy "Public insert venues" on venues for insert with check (true);
create policy "Public update venues" on venues for update using (true);
create policy "Public delete venues" on venues for delete using (true);

-- points
create policy "Public read points"   on points for select using (true);
create policy "Public insert points" on points for insert with check (true);
create policy "Public update points" on points for update using (true);
create policy "Public delete points" on points for delete using (true);

-- tickets
create policy "Public read tickets"   on tickets for select using (true);
create policy "Public insert tickets" on tickets for insert with check (true);
create policy "Public update tickets" on tickets for update using (true);
create policy "Public delete tickets" on tickets for delete using (true);

-- checkins (solo lectura + inserción — nunca se borran del log)
create policy "Public read checkins"   on checkins for select using (true);
create policy "Public insert checkins" on checkins for insert with check (true);


-- ============================================================
-- STORAGE — bucket venue-media (imágenes y audios de puntos)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'venue-media',
  'venue-media',
  true,
  10485760,  -- 10 MB por archivo
  array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/wav','audio/ogg']
)
on conflict (id) do nothing;

-- Drop existing storage policies
drop policy if exists "Public read venue-media"   on storage.objects;
drop policy if exists "Public insert venue-media" on storage.objects;
drop policy if exists "Public update venue-media" on storage.objects;
drop policy if exists "Public delete venue-media" on storage.objects;

-- Storage policies
create policy "Public read venue-media"
  on storage.objects for select
  using (bucket_id = 'venue-media');

create policy "Public insert venue-media"
  on storage.objects for insert
  with check (bucket_id = 'venue-media');

create policy "Public update venue-media"
  on storage.objects for update
  using (bucket_id = 'venue-media')
  with check (bucket_id = 'venue-media');

create policy "Public delete venue-media"
  on storage.objects for delete
  using (bucket_id = 'venue-media');


-- ============================================================
-- HELPER VIEW — resumen por venue
-- ============================================================

create or replace view venue_stats as
select
  v.id                                                               as venue_id,
  v.name                                                             as venue_name,
  count(t.id)                                                        as total_tickets,
  count(t.id) filter (where t.checked_in_at is not null)            as checked_in,
  count(t.id) filter (where t.checked_in_at is null)                as pending
from venues v
left join tickets t on t.venue_id = v.id
group by v.id, v.name;


-- ============================================================
-- MIGRATIONS — columnas añadidas en versiones anteriores del schema
-- (seguras de re-ejecutar con IF NOT EXISTS)
-- ============================================================

-- Compatibilidad: si el proyecto tenía points sin audio_url, esta línea lo añade
alter table points add column if not exists audio_url text;
