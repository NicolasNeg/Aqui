'use client';

import { useRouter } from 'next/navigation';
import { BrandBar } from './Logo';
import { ArrowLeftIcon } from './icons';

interface TopBarProps {
  subtitle?: string;
  status?: string;
  onDark?: boolean;
  showBack?: boolean;
  backHref?: string;
}

export function TopBar({ subtitle, status, onDark = false, showBack = false, backHref }: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4"
      style={{
        height: 'calc(56px + env(safe-area-inset-top))',
        paddingTop: 'env(safe-area-inset-top)',
        background: onDark ? '#0F1B2E' : '#FFFFFF',
        borderBottom: onDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #EFEEEA',
        color: onDark ? '#FFFFFF' : '#0F1B2E'
      }}
    >
      {showBack && (
        <button
          onClick={handleBack}
          aria-label="Atrás"
          className="w-9 h-9 -ml-2 rounded-lg flex items-center justify-center"
          style={{ background: onDark ? 'rgba(255,255,255,0.08)' : 'transparent' }}
        >
          <ArrowLeftIcon size={18} />
        </button>
      )}

      <BrandBar subtitle={subtitle} onDark={onDark} />

      {status && (
        <span
          className="ml-auto text-xs"
          style={{
            color: onDark ? 'rgba(255,255,255,0.6)' : '#6B6962',
            letterSpacing: '0.02em'
          }}
        >
          {status}
        </span>
      )}
    </header>
  );
}
