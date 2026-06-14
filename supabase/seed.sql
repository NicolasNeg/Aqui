-- ============================================================
-- Aquí — Seed data
-- ============================================================
-- Datos de ejemplo para probar el sistema con Supabase.
-- Ejecuta DESPUÉS de schema.sql
-- ============================================================

-- Venue: Plaza Aquí (demo genérico)
insert into venues (id, name, type, brand_color, accent_color, welcome_text, requires_ticket)
values (
  'demo',
  'Plaza Aquí',
  'event',
  '#0F1B2E',
  '#E63946',
  'Bienvenido a la demo de Aquí. Explora el sistema completo desde aquí.',
  false
)
on conflict (id) do update set
  name         = excluded.name,
  brand_color  = excluded.brand_color,
  accent_color = excluded.accent_color;


-- Venue: Boda Juan & María
insert into venues (id, name, type, brand_color, accent_color, welcome_text, requires_ticket)
values (
  'boda-demo',
  'Boda Juan & María',
  'wedding',
  '#2D1B4E',
  '#D4A574',
  'Bienvenido a la celebración. Encuentra todo desde aquí.',
  true
)
on conflict (id) do update set
  name            = excluded.name,
  requires_ticket = true;


-- Tickets de demostración (3 invitados de boda)
insert into tickets (venue_id, code, guest_name, guest_email, access_level, table_assignment, notes)
values
  ('boda-demo', 'DEMO-001', 'María González',     'maria@ejemplo.com', 'general', 'Mesa 7',  'Vegetariana'),
  ('boda-demo', 'DEMO-002', 'Carlos Hernández',   'carlos@ejemplo.com', 'vip',     'Mesa 1',  'Padrino'),
  ('boda-demo', 'DEMO-VIP', 'Ana López',          'ana@ejemplo.com',    'general', 'Mesa 12', null)
on conflict (code) do nothing;
