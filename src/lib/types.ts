/**
 * Aquí — Domain types
 */

export type PointType =
  | 'entrance'
  | 'food'
  | 'shop'
  | 'service'
  | 'parking'
  | 'venue'
  | 'info'
  | 'restroom'
  | 'medical'
  | 'custom';

export interface Point {
  id: string;
  name: string;
  type: PointType;
  /** Floor-plan x coordinate (≈ meters from origin) */
  x: number;
  /** Floor-plan y coordinate */
  y: number;
  /** Optional real-world GPS coordinates for outdoor venues */
  lat?: number;
  lng?: number;
  emoji?: string;
  color?: string;
  description?: string;
  imageUrl?: string;
}

export interface Building {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface Venue {
  id: string;
  name: string;
  type:
    | 'wedding'
    | 'festival'
    | 'museum'
    | 'hotel'
    | 'mall'
    | 'school'
    | 'hospital'
    | 'office'
    | 'park'
    | 'event'
    | 'other';
  /** Real-world center (used for outdoor GPS navigation) */
  origin?: { lat: number; lng: number };
  /** Custom brand colors per venue */
  brandColor?: string;
  accentColor?: string;
  /** Logo URL */
  logoUrl?: string;
  /** Hero text shown on visitor entry */
  welcomeText?: string;
  /** Floor plan dimensions */
  floorWidth: number;
  floorHeight: number;
  buildings: Building[];
  points: Record<string, Point>;
  /** Adjacency list: [from, to] pairs that form the walkable graph */
  paths: [string, string][];
  /** Whether tickets/access control is enabled */
  requiresTicket?: boolean;
}

export interface Ticket {
  id: string;
  venueId: string;
  code: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  accessLevel: 'general' | 'vip' | 'staff' | 'press';
  tableAssignment?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  checkedInAt?: string | null;
}

export interface CheckIn {
  id: string;
  ticketId: string;
  checkedInAt: string;
  staffName?: string;
  deviceInfo?: string;
}

export interface RouteResult {
  path: string[];
  distance: number;
  estimatedMinutes: number;
}
