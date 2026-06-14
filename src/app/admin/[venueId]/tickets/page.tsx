'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { getBaseUrl, ticketUrl as buildTicketUrl } from '@/lib/url';
import { useVenue } from '@/hooks/useVenue';
import { Logo } from '@/components/Logo';
import { SectionMarker } from '@/components/SectionMarker';
import { QRDisplay } from '@/components/QRDisplay';
import type { TicketRow } from '@/lib/tickets';

function generateCode(): string {
  // 8-character code: e.g. "K7M-9PXR"
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 3) code += '-';
    else code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function TicketsAdmin() {
  const { venueId, venue } = useVenue();

  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    access_level: 'general',
    table_assignment: '',
    notes: ''
  });
  const [generatedTicket, setGeneratedTicket] = useState<TicketRow | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    setBaseUrl(getBaseUrl());
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  async function loadTickets() {
    setLoading(true);
    if (!supabaseReady) {
      setTickets([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) return;

    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false });

    setTickets(data || []);
    setLoading(false);
  }

  async function createTicket() {
    const code = generateCode();
    const payload = {
      venue_id: venueId,
      code,
      ...newTicket
    };

    if (supabaseReady) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase.from('tickets').insert(payload).select().single();
        if (data) {
          setGeneratedTicket(data);
          loadTickets();
        } else {
          alert('Error creando ticket: ' + (error?.message || ''));
          return;
        }
      }
    } else {
      // Demo mode: just show the QR locally
      setGeneratedTicket({
        id: 'demo-' + Date.now(),
        venue_id: venueId,
        code,
        guest_name: newTicket.guest_name || null,
        guest_email: newTicket.guest_email || null,
        guest_phone: newTicket.guest_phone || null,
        access_level: newTicket.access_level,
        table_assignment: newTicket.table_assignment || null,
        notes: newTicket.notes || null,
        checked_in_at: null,
        created_at: new Date().toISOString()
      });
    }

    setNewTicket({
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      access_level: 'general',
      table_assignment: '',
      notes: ''
    });
    setShowForm(false);
  }

  function ticketUrl(code: string) {
    return buildTicketUrl(baseUrl, venueId, code);
  }

  if (!venue) {
    return <div className="min-h-screen flex items-center justify-center text-warm-500">Venue no encontrado</div>;
  }

  return (
    <main className="min-h-screen bg-white pb-20">
      <header className="border-b border-warm-100 px-5 py-4 flex items-center justify-between">
        <Logo size="md" />
        <Link href={`/admin/${venueId}`} className="text-xs text-warm-500 hover:text-ink">
          ← {venue.name}
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8">
        <SectionMarker num="04" label="Invitaciones y tickets" />
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          QRs <span style={{ color: '#E63946' }}>personales</span>.
        </h1>
        <p className="text-sm text-warm-500 max-w-md mb-8">
          Cada invitado tiene su QR único e intransferible. Envíalos por WhatsApp, email o impresos.
        </p>

        {!supabaseReady && (
          <div className="surface p-4 mb-6" style={{ background: '#FFF9E6', borderColor: '#F5C842' }}>
            <div className="text-sm font-semibold mb-1">Modo demo</div>
            <div className="text-xs text-warm-700">
              Conecta Supabase para guardar tickets reales y validarlos al entrar.
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="surface p-4">
            <div className="text-xs label-text">Total</div>
            <div className="text-2xl font-bold mt-1">{tickets.length}</div>
          </div>
          <div className="surface p-4">
            <div className="text-xs label-text">Check-in</div>
            <div className="text-2xl font-bold mt-1" style={{ color: '#16A34A' }}>
              {tickets.filter((t) => t.checked_in_at).length}
            </div>
          </div>
          <div className="surface p-4">
            <div className="text-xs label-text">Pendientes</div>
            <div className="text-2xl font-bold mt-1" style={{ color: '#E63946' }}>
              {tickets.filter((t) => !t.checked_in_at).length}
            </div>
          </div>
        </div>

        {!showForm && !generatedTicket && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary w-full mb-6">
            <span>+ Crear invitación</span>
          </button>
        )}

        {/* Create form */}
        {showForm && (
          <div className="surface p-5 mb-6">
            <h3 className="font-bold mb-4">Nueva invitación</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs label-text">Nombre del invitado</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-warm-100 text-sm"
                  value={newTicket.guest_name}
                  onChange={(e) => setNewTicket({ ...newTicket, guest_name: e.target.value })}
                  placeholder="Ej. María González"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs label-text">Email</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-warm-100 text-sm"
                    value={newTicket.guest_email}
                    onChange={(e) => setNewTicket({ ...newTicket, guest_email: e.target.value })}
                    placeholder="opcional"
                  />
                </div>
                <div>
                  <label className="text-xs label-text">Teléfono</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-warm-100 text-sm"
                    value={newTicket.guest_phone}
                    onChange={(e) => setNewTicket({ ...newTicket, guest_phone: e.target.value })}
                    placeholder="opcional"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs label-text">Nivel de acceso</label>
                  <select
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-warm-100 text-sm bg-white"
                    value={newTicket.access_level}
                    onChange={(e) => setNewTicket({ ...newTicket, access_level: e.target.value })}
                  >
                    <option value="general">General</option>
                    <option value="vip">VIP</option>
                    <option value="press">Prensa</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs label-text">Mesa / Asiento</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-warm-100 text-sm"
                    value={newTicket.table_assignment}
                    onChange={(e) => setNewTicket({ ...newTicket, table_assignment: e.target.value })}
                    placeholder="opcional"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs label-text">Notas (alergias, instrucciones)</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-warm-100 text-sm resize-none"
                  rows={2}
                  value={newTicket.notes}
                  onChange={(e) => setNewTicket({ ...newTicket, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={createTicket} className="btn btn-primary flex-1">
                Generar QR de invitación
              </button>
              <button onClick={() => setShowForm(false)} className="btn btn-outline">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Generated ticket result */}
        {generatedTicket && (
          <div className="surface-dark rounded-2xl p-6 mb-6 text-center">
            <div className="text-xs label-text mb-2" style={{ color: '#E63946' }}>
              Invitación generada
            </div>
            <h3 className="text-xl font-bold text-white mb-1">
              {generatedTicket.guest_name || 'Invitado'}
            </h3>
            <div className="text-white/60 text-sm mb-5">
              {generatedTicket.access_level.toUpperCase()}
              {generatedTicket.table_assignment && ` · ${generatedTicket.table_assignment}`}
            </div>

            <div className="bg-white rounded-xl p-4 inline-block">
              <QRDisplay value={ticketUrl(generatedTicket.code)} size={200} />
            </div>

            <div className="mt-4 text-white text-2xl font-bold tracking-widest">
              {generatedTicket.code}
            </div>
            <div className="text-white/60 text-xs mt-1 break-all px-4">
              {ticketUrl(generatedTicket.code)}
            </div>

            <div className="flex gap-2 mt-6 justify-center">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Te invito a ${venue.name}. Escanea este QR para ver toda la info: ${ticketUrl(generatedTicket.code)}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-accent"
              >
                Enviar por WhatsApp
              </a>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(ticketUrl(generatedTicket.code));
                  alert('Link copiado');
                }}
                className="btn"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              >
                Copiar link
              </button>
            </div>

            <button onClick={() => setGeneratedTicket(null)} className="text-white/60 text-xs mt-5 underline">
              Crear otra invitación
            </button>
          </div>
        )}

        {/* Tickets list */}
        <div className="surface overflow-hidden">
          <div className="px-5 py-3 border-b border-warm-100 text-xs label-text">
            Invitaciones existentes ({tickets.length})
          </div>
          {loading ? (
            <div className="p-8 text-center text-warm-500 text-sm">Cargando…</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-warm-500 text-sm">Aún no hay invitaciones</div>
          ) : (
            <div>
              {tickets.map((t, i) => (
                <Link
                  key={t.id}
                  href={`/v/${venueId}/t/${t.code}`}
                  target="_blank"
                  className={`px-5 py-3 flex items-center gap-3 active:bg-warm-50 ${
                    i < tickets.length - 1 ? 'border-b border-warm-100' : ''
                  }`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: t.checked_in_at ? '#DCFCE7' : '#FBE3E5', color: t.checked_in_at ? '#16A34A' : '#E63946' }}
                  >
                    {t.checked_in_at ? '✓' : '○'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{t.guest_name || 'Sin nombre'}</div>
                    <div className="text-xs text-warm-500 truncate">
                      {t.code} · {t.access_level}
                      {t.table_assignment && ` · ${t.table_assignment}`}
                    </div>
                  </div>
                  <span className="text-warm-300">›</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
