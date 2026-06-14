'use client';

import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onDark?: boolean;
  href?: string;
}

/**
 * The Aquí brand mark with red period.
 * Used consistently across all surfaces.
 */
export function Logo({ size = 'md', onDark = false, href = '/' }: LogoProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  };

  const content = (
    <span
      className={`brand-mark ${sizes[size]} ${onDark ? 'on-dark text-white' : ''}`}
      style={{ color: onDark ? '#FFFFFF' : '#0F1B2E' }}
    >
      Aqu<span className="period" style={{ color: '#E63946' }}>í.</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * Brand mark in horizontal bar form, for use in top bars.
 * Shows red dot + name.
 */
export function BrandBar({ subtitle, onDark = false }: { subtitle?: string; onDark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: '#E63946', boxShadow: '0 0 8px #E63946' }}
      />
      <span className={`font-semibold text-sm tracking-tight ${onDark ? 'text-white' : 'text-ink'}`}>
        Aquí
      </span>
      {subtitle && (
        <span
          className={`text-xs ${onDark ? 'text-white/60' : 'text-warm-500'}`}
          style={{ letterSpacing: '0.02em' }}
        >
          · {subtitle}
        </span>
      )}
    </div>
  );
}
