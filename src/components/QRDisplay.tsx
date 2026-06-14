'use client';

import { useEffect, useRef, useState } from 'react';

interface QRDisplayProps {
  value: string;
  size?: number;
  /** Background fill color */
  bg?: string;
  /** Foreground (dot) color */
  fg?: string;
  /** Optional center logo overlay */
  logoText?: string;
}

/**
 * Renders a QR code as a canvas, optionally with a small text label
 * overlaid in the center.
 */
export function QRDisplay({
  value,
  size = 200,
  bg = '#FFFFFF',
  fg = '#0F1B2E',
  logoText
}: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function draw() {
      if (!canvasRef.current) return;
      try {
        const QRCode = (await import('qrcode')).default;
        if (cancelled) return;
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 1,
          color: { dark: fg, light: bg },
          errorCorrectionLevel: 'H'
        });
      } catch (err: any) {
        setError(err?.message || 'Error generando QR');
      }
    }
    draw();
    return () => { cancelled = true; };
  }, [value, size, bg, fg]);

  return (
    <div
      className="relative inline-block rounded-lg overflow-hidden"
      style={{ width: size, height: size, background: bg }}
    >
      <canvas ref={canvasRef} style={{ width: size, height: size, display: 'block' }} />
      {logoText && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            background: bg,
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: Math.max(10, size * 0.05),
            fontWeight: 700,
            color: fg,
            letterSpacing: '0.05em'
          }}
        >
          {logoText}
        </div>
      )}
      {error && <div className="text-xs text-red-600 absolute inset-0 flex items-center justify-center p-2 text-center bg-red-50">{error}</div>}
    </div>
  );
}

/**
 * "Usted está aquí" printable card with the QR code, ready for printing.
 */
export function YouAreHereCard({
  value,
  pointName,
  venueName,
  size = 240
}: {
  value: string;
  pointName: string;
  venueName?: string;
  size?: number;
}) {
  return (
    <div
      className="bg-white border-2 border-dashed rounded-xl p-6 text-center"
      style={{ borderColor: '#C9C7C0' }}
    >
      <div
        className="text-xs font-bold tracking-widest uppercase mb-1"
        style={{ color: '#E63946', letterSpacing: '0.22em' }}
      >
        Usted está aquí
      </div>
      <div className="text-sm font-semibold mb-4" style={{ color: '#0F1B2E' }}>
        {pointName}
      </div>
      <div className="inline-block">
        <QRDisplay value={value} size={size} />
      </div>
      <div className="mt-4 text-xs" style={{ color: '#6B6962' }}>
        Apunta tu cámara para navegar
      </div>
      {venueName && (
        <div
          className="mt-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#0F1B2E', letterSpacing: '0.15em' }}
        >
          {venueName} · <span style={{ color: '#E63946' }}>Aquí.</span>
        </div>
      )}
    </div>
  );
}
