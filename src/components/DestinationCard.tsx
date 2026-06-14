'use client';

import Link from 'next/link';
import type { Point } from '@/lib/types';

interface DestinationCardProps {
  point: Point;
  distance: number;
  minutes: number;
  href: string;
}

export function DestinationCard({ point, distance, minutes, href }: DestinationCardProps) {
  return (
    <Link
      href={href}
      className="surface flex items-center gap-3 p-3.5 active:bg-warm-50 active:scale-[0.99] transition-transform"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xl"
        style={{ background: (point.color || '#0F1B2E') + '22' }}
      >
        {point.emoji || '📍'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink truncate">{point.name}</div>
        <div className="text-xs text-warm-500 mt-0.5">
          {distance} m · {minutes} min caminando
        </div>
      </div>
      <span className="text-warm-300 text-lg">›</span>
    </Link>
  );
}
