import type { Venue } from '@/lib/types';

/**
 * Demo venue used when Supabase is not configured or for the public preview.
 * Represents a small mixed-use plaza with 8 points and walking paths.
 *
 * Coordinates are in floor-plan units (≈ meters from origin).
 * The whole layout fits in a 320x380 grid.
 */
export const DEMO_VENUE: Venue = {
  id: 'demo',
  name: 'Plaza Aquí',
  type: 'event',
  welcomeText: 'Bienvenido a la demo de Aquí. Explora el sistema completo desde aquí.',
  brandColor: '#0F1B2E',
  accentColor: '#E63946',
  floorWidth: 320,
  floorHeight: 380,
  requiresTicket: false,
  buildings: [
    { x: 20, y: 50, w: 80, h: 80, label: 'Ala A' },
    { x: 220, y: 50, w: 80, h: 100, label: 'Ala B' },
    { x: 20, y: 160, w: 60, h: 60, label: 'Servicios' },
    { x: 240, y: 160, w: 60, h: 60, label: 'Médico' },
    { x: 110, y: 160, w: 100, h: 80, label: 'Eventos' },
    { x: 20, y: 270, w: 80, h: 70, label: 'Parking' },
    { x: 220, y: 270, w: 80, h: 70, label: 'Plaza Sur' }
  ],
  points: {
    A1: { id: 'A1', name: 'Entrada Norte', type: 'entrance', x: 160, y: 30, emoji: '🚪', color: '#E63946' },
    A2: { id: 'A2', name: 'Entrada Sur', type: 'entrance', x: 160, y: 350, emoji: '🚪', color: '#E63946' },
    B1: { id: 'B1', name: 'Cafetería', type: 'food', x: 70, y: 90, emoji: '☕', color: '#F59E0B' },
    B2: { id: 'B2', name: 'Tienda principal', type: 'shop', x: 250, y: 110, emoji: '🛒', color: '#10B981' },
    C1: { id: 'C1', name: 'Sanitarios', type: 'restroom', x: 50, y: 200, emoji: '🚻', color: '#06B6D4' },
    C2: { id: 'C2', name: 'Enfermería', type: 'medical', x: 270, y: 200, emoji: '🏥', color: '#EF4444' },
    D1: { id: 'D1', name: 'Estacionamiento', type: 'parking', x: 60, y: 310, emoji: '🅿️', color: '#6366F1' },
    E1: { id: 'E1', name: 'Salón de eventos', type: 'venue', x: 160, y: 200, emoji: '🎭', color: '#A855F7' }
  },
  paths: [
    ['A1', 'B1'], ['A1', 'B2'], ['A1', 'E1'],
    ['B1', 'C1'], ['B1', 'E1'],
    ['B2', 'C2'], ['B2', 'E1'],
    ['C1', 'D1'], ['C1', 'E1'],
    ['C2', 'E1'],
    ['E1', 'A2'], ['E1', 'D1'],
    ['D1', 'A2']
  ]
};

/**
 * Wedding venue demo — shows the ticketing/access control flow.
 */
export const WEDDING_DEMO: Venue = {
  id: 'boda-demo',
  name: 'Boda Juan & María',
  type: 'wedding',
  welcomeText: 'Bienvenido a la celebración. Encuentra todo desde aquí.',
  brandColor: '#2D1B4E',
  accentColor: '#D4A574',
  floorWidth: 320,
  floorHeight: 380,
  requiresTicket: true,
  buildings: [
    { x: 40, y: 30, w: 240, h: 80, label: 'Jardín principal' },
    { x: 40, y: 140, w: 100, h: 100, label: 'Capilla' },
    { x: 180, y: 140, w: 100, h: 100, label: 'Recepción' },
    { x: 40, y: 270, w: 240, h: 80, label: 'Pista de baile' }
  ],
  points: {
    P1: { id: 'P1', name: 'Recepción de invitados', type: 'entrance', x: 160, y: 70, emoji: '💌', color: '#D4A574' },
    P2: { id: 'P2', name: 'Capilla / Ceremonia', type: 'venue', x: 90, y: 190, emoji: '⛪', color: '#2D1B4E' },
    P3: { id: 'P3', name: 'Cóctel y aperitivos', type: 'food', x: 230, y: 190, emoji: '🥂', color: '#D4A574' },
    P4: { id: 'P4', name: 'Salón principal', type: 'venue', x: 160, y: 310, emoji: '🎊', color: '#2D1B4E' },
    P5: { id: 'P5', name: 'Sanitarios', type: 'restroom', x: 280, y: 70, emoji: '🚻', color: '#06B6D4' },
    P6: { id: 'P6', name: 'Mesa de regalos', type: 'info', x: 50, y: 70, emoji: '🎁', color: '#D4A574' }
  },
  paths: [
    ['P1', 'P2'], ['P1', 'P3'], ['P1', 'P5'], ['P1', 'P6'],
    ['P2', 'P4'], ['P3', 'P4'], ['P2', 'P3']
  ]
};

/**
 * All demo venues available in this build.
 */
export const DEMO_VENUES: Record<string, Venue> = {
  demo: DEMO_VENUE,
  'boda-demo': WEDDING_DEMO
};

export function getDemoVenue(id: string): Venue | null {
  return DEMO_VENUES[id] || null;
}
