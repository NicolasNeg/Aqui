'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { parseScannedTicketCode } from '@/lib/scan';
import { mapTicketRow } from '@/lib/tickets';
import { useVenue } from '@/hooks/useVenue';
import { QRScanner } from '@/components/QRScanner';
import { TopBar } from '@/components/TopBar';
import { SectionMarker } from '@/components/SectionMarker';
import type { Ticket } from '@/lib/types';

interface CheckInResult {
  status: 'valid' | 'already' | 'invalid' | 'wrong-venue';
  ticket?: Partial<Ticket>;
}

export default function StaffCheckIn() {
  const searchParams = useSearchParams();
  const { venueId, venue } = useVenue();
  const directCode = searchParams.get('t');

  const [scanning, setScanning] = useState(!directCode);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [stats, setStats] = useState<{ total: number; checkedIn: number } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadStats();
    if (directCode) {
      processCode(directCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  async function loadStats() {
    if (!isSupabaseConfigured()) {
      setStats({ total: 0, checkedIn: 0 });
      return;
    }
    const supabase = createClient();
    if (!supabase) return;

    const { count: total } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId);

    const { count: checkedIn } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .not('checked_in_at', 'is', null);

    setStats({ total: total || 0, checkedIn: checkedIn || 0 });
  }

  async function processCode(rawCode: string) {
    setProcessing(true);
    setScanning(false);

    const code = parseScannedTicketCode(rawCode);

    if (!isSupabaseConfigured()) {
      // Demo mode
      setTimeout(() => {
        setResult({
          status: code.length > 3 ? 'valid' : 'invalid',
          ticket: { code, guestName: 'Invitado Demo', tableAssignment: 'Mesa 7' }
        });
        setProcessing(false);
      }, 500);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setProcessing(false);
      return;
    }

    const { data: row, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !row) {
      setResult({ status: 'invalid' });
      setProcessing(false);
      return;
    }

    if (row.venue_id !== venueId) {
      setResult({ status: 'wrong-venue', ticket: mapTicketRow(row) });
      setProcessing(false);
      return;
    }

    if (row.checked_in_at) {
      setResult({ status: 'already', ticket: mapTicketRow(row) });
      setProcessing(false);
      return;
    }

    // Mark as checked in
    const now = new Date().toISOString();
    await supabase
      .from('tickets')
      .update({ checked_in_at: now })
      .eq('id', row.id);

    // Record check-in event
    await supabase.from('checkins').insert({
      ticket_id: row.id,
      device_info: navigator.userAgent
    });

    setResult({ status: 'valid', ticket: mapTicketRow({ ...row, checked_in_at: now }) });
    setProcessing(false);
    loadStats();
  }

  function nextScan() {
    setResult(null);
    setScanning(true);
  }

  if (!venue) {
    return <div className="min-h-screen flex items-center justify-center text-warm-500">Cargando…</div>;
  }

  return (
    <>
      <TopBar subtitle={`${venue.name} · Check-in`} showBack backHref={`/admin/${venueId}`} />

      <main
        className="min-h-screen pb-12 bg-warm-50"
        style={{ paddingTop: 'calc(56px + env(safe-area-inset-top))' }}
      >
        {/* Stats bar */}
        {stats && (
          <div className="mx-4 mt-4 surface-dark p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/60 uppercase tracking-widest" style={{ letterSpacing: '0.15em' }}>
                Invitados
              </div>
              <div className="text-2xl font-bold mt-1">
                {stats.checkedIn} <span className="text-white/40 text-base">/ {stats.total}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60 uppercase tracking-widest" style={{ letterSpacing: '0.15em' }}>
                Progreso
              </div>
              <div className="text-2xl font-bold mt-1" style={{ color: '#E63946' }}>
                {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
              </div>
            </div>
          </div>
        )}

        {/* Result display */}
        {result && (
          <div className="mx-4 mt-6 animate-fade-in">
            {result.status === 'valid' && (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: '#16A34A', color: '#FFFFFF' }}
              >
                <div className="text-5xl mb-3">✓</div>
                <div className="text-xl font-bold mb-1">ACCESO PERMITIDO</div>
                <div className="text-white/80 text-sm mb-4">{result.ticket?.guestName || 'Invitado'}</div>
                {result.ticket?.tableAssignment && (
                  <div className="bg-white/15 rounded-lg p-3 mb-4">
                    <div className="text-xs text-white/70 uppercase tracking-widest mb-1" style={{ letterSpacing: '0.15em' }}>
                      Asignación
                    </div>
                    <div className="font-semibold">{result.ticket.tableAssignment}</div>
                  </div>
                )}
              </div>
            )}

            {result.status === 'already' && (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: '#F59E0B', color: '#FFFFFF' }}
              >
                <div className="text-5xl mb-3">!</div>
                <div className="text-xl font-bold mb-1">YA HIZO CHECK-IN</div>
                <div className="text-white/80 text-sm">
                  Este invitado ya entró antes. Verifica identidad si es necesario.
                </div>
                {result.ticket?.guestName && (
                  <div className="mt-3 text-white font-semibold">{result.ticket.guestName}</div>
                )}
              </div>
            )}

            {result.status === 'invalid' && (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: '#E63946', color: '#FFFFFF' }}
              >
                <div className="text-5xl mb-3">✕</div>
                <div className="text-xl font-bold mb-1">CÓDIGO INVÁLIDO</div>
                <div className="text-white/80 text-sm">No encontramos este código en el sistema.</div>
              </div>
            )}

            {result.status === 'wrong-venue' && (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: '#E63946', color: '#FFFFFF' }}
              >
                <div className="text-5xl mb-3">✕</div>
                <div className="text-xl font-bold mb-1">EVENTO INCORRECTO</div>
                <div className="text-white/80 text-sm">Este código es de otro evento.</div>
              </div>
            )}

            <button onClick={nextScan} className="btn btn-primary w-full mt-4">
              Escanear siguiente
            </button>
          </div>
        )}

        {/* Scanner */}
        {scanning && !result && (
          <div className="px-5 py-6 flex flex-col items-center text-center gap-4">
            <SectionMarker num="01" label="Validar invitado" />
            <h2 className="text-xl font-bold">Apunta al QR del invitado</h2>
            <p className="text-sm text-warm-500 max-w-xs">
              Escanea el código que el invitado tiene en su celular.
            </p>
            <QRScanner onScan={processCode} />
          </div>
        )}

        {/* Processing */}
        {processing && !result && (
          <div className="px-5 py-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 border-4 border-warm-100 border-t-red rounded-full animate-spin" />
            <div className="text-sm text-warm-500 mt-4">Validando…</div>
          </div>
        )}
      </main>
    </>
  );
}
