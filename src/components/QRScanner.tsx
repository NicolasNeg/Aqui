'use client';

import { useEffect, useRef, useState } from 'react';

interface QRScannerProps {
  onScan: (text: string) => void;
  onError?: (error: string) => void;
}

/**
 * Live QR scanner using device camera.
 * Lazy-loads html5-qrcode only on the client.
 */
export function QRScanner({ onScan, onError }: QRScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    async function start() {
      if (!containerRef.current) return;
      setStatus('starting');

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;

        const elemId = 'aqui-qr-reader';
        containerRef.current.id = elemId;

        const scanner = new Html5Qrcode(elemId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            onScan(decodedText);
          },
          () => {
            // Ignore individual frame decoding errors silently
          }
        );

        if (mounted) setStatus('scanning');
      } catch (err: any) {
        if (mounted) {
          setStatus('error');
          const msg = err?.message || 'No se pudo iniciar la cámara';
          setErrorMsg(msg);
          onError?.(msg);
        }
      }
    }

    start();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).then(() => {
          scannerRef.current?.clear?.();
        });
      }
    };
  }, [onScan, onError]);

  return (
    <div className="w-full max-w-[280px] relative">
      <div
        ref={containerRef}
        className="w-full aspect-square rounded-2xl overflow-hidden bg-ink"
      />

      {/* Corner brackets */}
      <div className="absolute inset-4 pointer-events-none">
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl" style={{ borderColor: '#E63946' }} />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr" style={{ borderColor: '#E63946' }} />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl" style={{ borderColor: '#E63946' }} />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br" style={{ borderColor: '#E63946' }} />
      </div>

      {status === 'starting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/80 rounded-2xl">
          <span className="text-white text-xs label-text" style={{ color: '#FFFFFF' }}>
            Iniciando cámara…
          </span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink rounded-2xl p-4">
          <span className="text-white text-xs text-center mb-2" style={{ color: '#FFFFFF' }}>
            Permiso de cámara necesario
          </span>
          <span className="text-white/60 text-xs text-center">{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
