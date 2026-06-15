'use client';

import Link from 'next/link';
import { useVenue } from '@/hooks/useVenue';
import { Logo } from '@/components/Logo';
import { SectionMarker } from '@/components/SectionMarker';
import { FloorPlan } from '@/components/FloorPlan';
import { CheckIcon, QrCodeIcon, TicketIcon } from '@/components/icons';
import { SignOutButton } from '@/components/SignOutButton';

export default function VenueAdmin() {
  const { venueId, venue } = useVenue();

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center text-warm-500">
        Venue no encontrado
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-warm-100 px-5 py-4 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <SignOutButton />
          <Link href="/admin" className="text-xs text-warm-500 hover:text-ink">
            ← Todos los venues
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8">
        <SectionMarker num="02" label={venue.type.toUpperCase()} />
        <h1 className="text-4xl font-bold tracking-tight mb-3">{venue.name}</h1>
        <p className="text-sm text-warm-500 max-w-md mb-8">
          {Object.keys(venue.points).length} puntos configurados.
          {venue.requiresTicket ? ' Sistema de tickets activado.' : ''}
        </p>

        {/* Floor plan preview */}
        <div className="surface mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-warm-100 flex items-center justify-between">
            <div className="text-xs label-text">Plano del lugar</div>
            <Link href={`/v/${venueId}`} className="text-xs text-red font-semibold">
              Ver como visitante →
            </Link>
          </div>
          <div className="bg-warm-50 h-64">
            <FloorPlan venue={venue} />
          </div>
        </div>

        {/* Action grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href={`/admin/${venueId}/qr-points`} className="surface-dark p-5 rounded-xl active:scale-[0.99] transition-transform" style={{ textDecoration: 'none' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(230, 57, 70, 0.15)' }}>
              <QrCodeIcon size={20} color="#E63946" />
            </div>
            <div className="text-sm font-semibold text-white">QRs de ubicación</div>
            <div className="text-xs text-white/60 mt-1">Genera e imprime los &quot;Usted está aquí&quot;</div>
          </Link>

          {venue.requiresTicket && (
            <Link href={`/admin/${venueId}/tickets`} className="surface-dark p-5 rounded-xl active:scale-[0.99] transition-transform" style={{ textDecoration: 'none' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(230, 57, 70, 0.15)' }}>
                <TicketIcon size={20} color="#E63946" />
              </div>
              <div className="text-sm font-semibold text-white">Invitaciones</div>
              <div className="text-xs text-white/60 mt-1">Genera tickets personales para invitados</div>
            </Link>
          )}

          <Link href={`/v/${venueId}/checkin`} className="surface p-5 rounded-xl active:scale-[0.99] transition-transform" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#DCFCE7' }}>
              <CheckIcon size={20} color="#16A34A" strokeWidth={2} />
            </div>
            <div className="text-sm font-semibold">Check-in del staff</div>
            <div className="text-xs text-warm-500 mt-1">Escanea QRs de invitados al entrar</div>
          </Link>

          <Link href={`/v/${venueId}`} className="surface p-5 rounded-xl active:scale-[0.99] transition-transform" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#DBEEF1' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
              </svg>
            </div>
            <div className="text-sm font-semibold">Demo de visitante</div>
            <div className="text-xs text-warm-500 mt-1">Abre el sitio que verán tus visitantes</div>
          </Link>
        </div>

        {/* Points list */}
        <div className="surface overflow-hidden">
          <div className="px-5 py-3 border-b border-warm-100 text-xs label-text">Puntos configurados</div>
          <div>
            {Object.values(venue.points).map((point, i, arr) => (
              <div
                key={point.id}
                className={`px-5 py-3 flex items-center gap-3 ${i < arr.length - 1 ? 'border-b border-warm-100' : ''}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{ background: (point.color || '#0F1B2E') + '22' }}
                >
                  {point.emoji || '📍'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{point.name}</div>
                  <div className="text-xs text-warm-500">
                    ID: {point.id} · {point.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
