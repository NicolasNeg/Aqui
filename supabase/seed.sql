-- ============================================================
-- Aquí — Seed data
-- ============================================================
-- Datos de ejemplo para probar el sistema con Supabase.
-- Ejecuta DESPUÉS de schema.sql
-- ============================================================


-- ============================================================
-- VENUES
-- ============================================================

insert into venues (id, name, type, brand_color, accent_color, welcome_text, requires_ticket, config)
values (
  'demo',
  'Plaza Aquí',
  'event',
  '#0F1B2E',
  '#E63946',
  'Bienvenido a la demo de Aquí. Explora el sistema completo desde aquí.',
  false,
  '{
    "floorWidth": 320,
    "floorHeight": 380,
    "buildings": [
      { "x": 20,  "y": 50,  "w": 80,  "h": 80,  "label": "Ala A" },
      { "x": 220, "y": 50,  "w": 80,  "h": 100, "label": "Ala B" },
      { "x": 20,  "y": 160, "w": 60,  "h": 60,  "label": "Servicios" },
      { "x": 240, "y": 160, "w": 60,  "h": 60,  "label": "Médico" },
      { "x": 110, "y": 160, "w": 100, "h": 80,  "label": "Eventos" },
      { "x": 20,  "y": 270, "w": 80,  "h": 70,  "label": "Parking" },
      { "x": 220, "y": 270, "w": 80,  "h": 70,  "label": "Plaza Sur" }
    ],
    "paths": [
      ["A1","B1"],["A1","B2"],["A1","E1"],
      ["B1","C1"],["B1","E1"],
      ["B2","C2"],["B2","E1"],
      ["C1","D1"],["C1","E1"],
      ["C2","E1"],
      ["E1","A2"],["E1","D1"],
      ["D1","A2"]
    ]
  }'::jsonb
)
on conflict (id) do update set
  name            = excluded.name,
  brand_color     = excluded.brand_color,
  accent_color    = excluded.accent_color,
  welcome_text    = excluded.welcome_text,
  config          = excluded.config;


insert into venues (id, name, type, brand_color, accent_color, welcome_text, requires_ticket, config)
values (
  'boda-demo',
  'Boda Juan & María',
  'wedding',
  '#2D1B4E',
  '#D4A574',
  'Bienvenido a la celebración. Encuentra todo desde aquí.',
  true,
  '{
    "floorWidth": 320,
    "floorHeight": 380,
    "buildings": [
      { "x": 40,  "y": 30,  "w": 240, "h": 80,  "label": "Jardín principal" },
      { "x": 40,  "y": 140, "w": 100, "h": 100, "label": "Capilla" },
      { "x": 180, "y": 140, "w": 100, "h": 100, "label": "Recepción" },
      { "x": 40,  "y": 270, "w": 240, "h": 80,  "label": "Pista de baile" }
    ],
    "paths": [
      ["P1","P2"],["P1","P3"],["P1","P5"],["P1","P6"],
      ["P2","P4"],["P3","P4"],["P2","P3"]
    ]
  }'::jsonb
)
on conflict (id) do update set
  name            = excluded.name,
  requires_ticket = excluded.requires_ticket,
  config          = excluded.config;


-- ============================================================
-- POINTS — Plaza Aquí (demo)
-- ============================================================

insert into points (id, venue_id, name, type, x, y, emoji, color)
values
  ('A1', 'demo', 'Entrada Norte',     'entrance', 160, 30,  '🚪', '#E63946'),
  ('A2', 'demo', 'Entrada Sur',       'entrance', 160, 350, '🚪', '#E63946'),
  ('B1', 'demo', 'Cafetería',         'food',     70,  90,  '☕', '#F59E0B'),
  ('B2', 'demo', 'Tienda principal',  'shop',     250, 110, '🛒', '#10B981'),
  ('C1', 'demo', 'Sanitarios',        'restroom', 50,  200, '🚻', '#06B6D4'),
  ('C2', 'demo', 'Enfermería',        'medical',  270, 200, '🏥', '#EF4444'),
  ('D1', 'demo', 'Estacionamiento',   'parking',  60,  310, '🅿️', '#6366F1'),
  ('E1', 'demo', 'Salón de eventos',  'venue',    160, 200, '🎭', '#A855F7')
on conflict (venue_id, id) do update set
  name  = excluded.name,
  x     = excluded.x,
  y     = excluded.y,
  emoji = excluded.emoji,
  color = excluded.color;


-- ============================================================
-- POINTS — Boda Juan & María
-- ============================================================

insert into points (id, venue_id, name, type, x, y, emoji, color)
values
  ('P1', 'boda-demo', 'Recepción de invitados', 'entrance', 160, 70,  '💌', '#D4A574'),
  ('P2', 'boda-demo', 'Capilla / Ceremonia',    'venue',    90,  190, '⛪', '#2D1B4E'),
  ('P3', 'boda-demo', 'Cóctel y aperitivos',    'food',     230, 190, '🥂', '#D4A574'),
  ('P4', 'boda-demo', 'Salón principal',         'venue',    160, 310, '🎊', '#2D1B4E'),
  ('P5', 'boda-demo', 'Sanitarios',              'restroom', 280, 70,  '🚻', '#06B6D4'),
  ('P6', 'boda-demo', 'Mesa de regalos',         'info',     50,  70,  '🎁', '#D4A574')
on conflict (venue_id, id) do update set
  name  = excluded.name,
  x     = excluded.x,
  y     = excluded.y,
  emoji = excluded.emoji,
  color = excluded.color;


-- ============================================================
-- TICKETS — invitados de demostración (boda)
-- ============================================================

insert into tickets (venue_id, code, guest_name, guest_email, access_level, table_assignment, notes)
values
  ('boda-demo', 'DEMO-001', 'María González',   'maria@ejemplo.com',  'general', 'Mesa 7',  'Vegetariana'),
  ('boda-demo', 'DEMO-002', 'Carlos Hernández', 'carlos@ejemplo.com', 'vip',     'Mesa 1',  'Padrino'),
  ('boda-demo', 'DEMO-VIP', 'Ana López',        'ana@ejemplo.com',    'general', 'Mesa 12', null)
on conflict (code) do nothing;
