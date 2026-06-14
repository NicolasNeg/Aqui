import type { Ticket } from './types';

/**
 * Raw `tickets` row as stored in Supabase (snake_case columns).
 * Kept in one place so every page that touches the table agrees on its shape.
 */
export interface TicketRow {
  id: string;
  venue_id: string;
  code: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  access_level: string;
  table_assignment: string | null;
  notes: string | null;
  metadata?: Record<string, unknown> | null;
  checked_in_at: string | null;
  created_at: string;
}

/** Map a snake_case DB row into the camelCase domain `Ticket`. */
export function mapTicketRow(row: TicketRow): Ticket {
  return {
    id: row.id,
    venueId: row.venue_id,
    code: row.code,
    guestName: row.guest_name ?? undefined,
    guestEmail: row.guest_email ?? undefined,
    guestPhone: row.guest_phone ?? undefined,
    accessLevel: row.access_level as Ticket['accessLevel'],
    tableAssignment: row.table_assignment ?? undefined,
    notes: row.notes ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    checkedInAt: row.checked_in_at
  };
}
