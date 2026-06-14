'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { mapTicketRow } from '@/lib/tickets';
import { useVenue } from '@/hooks/useVenue';
import { TopBar } from '@/components/TopBar';
import { SectionMarker } from '@/components/SectionMarker';
import { QRDisplay } from '@/components/QRDisplay';
import type { Ticket } from '@/lib/types';

export default function TicketView() {
  const params = useParams();
  const ticketCode = params?.ticketCode as string;
  const { venueId, venue } = useVenue();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      // Try to load real ticket from Supabase
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        if (supabase) {
          const { data, error: err } = await supabase
            .from('tickets')
            .select('*')
            .eq('venue_id', venueId)
            .eq('code', ticketCode)
            .single();

          if (data) {
            setTicket(mapTicketRow(data));
          } else if (err) {
            setError('Ticket no encontrado');
          }
        }
      } else {
        // Demo mode: fake a ticket
        setTicket({
          id: 'demo',
          venueId,
          code: ticketCode,
          guestName: 'Invitado Demo',
          accessLevel: 'general',
          tableAssignment: 'Mesa 7',
          createdAt: new Date().toISOString(),
          checkedInAt: null
        });
      }
      setLoading(false);
    }
    load();
  }, [venueId, ticketCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-warm-500">Cargando…</div>
    );
  }

  if (!venue) {
    return <div className="min-h-screen flex items-center justify-center text-warm-500">Venue no encontrado</div>;
  }

  if (error || !ticket) {
    return (
      <>
        <TopBar subtitle={venue.name} showBack />
        <main className="pt-20 px-5 text-center text-warm-500">
          {error || 'Ticket inválido'}
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar subtitle={venue.name} showBack backHref={`/v/${venueId}`} />

      <main
        className="min-h-screen pb-12"
        style={{ paddingTop: 'calc(56px + env(safe-area-inset-top))' }}
      >
        {/* Hero */}
        <div className="px-5 py-6 text-center">
          <SectionMarker num="01" label="Tu invitación" />
          <h1 className="text-3xl font-bold tracking-tight mt-2">
            {ticket.guestName || 'Bienvenido'}
          </h1>
          <p className="text-sm text-warm-500 mt-2">
            Tu acceso a <span className="font-semibold text-ink">{venue.name}</span>
          </p>
        </div>

        {/* Ticket card */}
        <div className="mx-4 surface-dark rounded-2xl p-6 text-center">
          <div className="text-xs font-bold tracking-widest mb-2 uppercase" style={{ color: '#E63946', letterSpacing: '0.2em' }}>
            Acceso · {ticket.accessLevel.toUpperCase()}
          </div>

          <div className="bg-white rounded-xl p-4 inline-block">
            <QRDisplay value={ticket.code} size={180} />
          </div>

          <div className="mt-4 text-white/80 text-xs uppercase tracking-widest" style={{ letterSpacing: '0.15em' }}>
            Código de invitación
          </div>
          <div className="mt-1 text-white text-xl font-bold tracking-widest">{ticket.code}</div>

          {ticket.tableAssignment && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-white/60 text-xs uppercase tracking-widest" style={{ letterSpacing: '0.15em' }}>
                Asignación
              </div>
              <div className="text-white font-semibold mt-1">{ticket.tableAssignment}</div>
            </div>
          )}

          {ticket.checkedInAt ? (
            <div
              className="mt-4 inline-block px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: '#16A34A', color: '#FFFFFF' }}
            >
              ✓ Check-in confirmado
            </div>
          ) : (
            <div className="mt-4 text-white/60 text-xs">Aún no has hecho check-in</div>
          )}
        </div>

        {/* Event info */}
        <div className="mx-4 mt-6 surface p-5">
          <div className="text-xs label-text mb-3">Información del evento</div>
          <h3 className="text-lg font-bold mb-2">{venue.name}</h3>
          <p className="text-sm text-warm-500 mb-4">{venue.welcomeText}</p>

          <div className="space-y-3">
            {Object.values(venue.points).slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: '#F7F7F5' }}>
                  {p.emoji || '📍'}
                </span>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action: navigate to venue */}
        <div className="px-4 mt-6">
          <Link href={`/v/${venueId}`} className="btn btn-accent w-full">
            Abrir mapa del lugar
          </Link>
        </div>

        {/* Notes */}
        {ticket.notes && (
          <div className="mx-4 mt-4 surface-warm p-4">
            <div className="text-xs label-text mb-2">Notas</div>
            <p className="text-sm text-warm-700">{ticket.notes}</p>
          </div>
        )}
      </main>
    </>
  );
}
