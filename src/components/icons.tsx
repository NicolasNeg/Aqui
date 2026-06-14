import type { CSSProperties, ReactNode } from 'react';

/**
 * Shared line icons (24×24, stroke-based) used across the app.
 *
 * Each icon was previously inlined as raw <svg> in multiple pages. They all
 * share the same wrapper, so callers only pass `size` / `color` / `strokeWidth`.
 */

export interface IconProps {
  /** Width & height in px (icons are square). */
  size?: number;
  /** Stroke color. Defaults to `currentColor` so it inherits text color. */
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

function Svg({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className,
  style,
  children
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </Svg>
  );
}

export function QrCodeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h7v7h-7z" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg strokeWidth={3} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="10" r="3" />
      <path d="M12 2a8 8 0 0 0-8 8c0 4.5 8 12 8 12s8-7.5 8-12a8 8 0 0 0-8-8z" />
    </Svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </Svg>
  );
}

export function PrinterIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
      <path d="M13 5v2M13 17v2M13 11v2" />
    </Svg>
  );
}

/** Directional turn arrow used in the map's turn-by-turn instruction. */
export function TurnIcon({
  direction,
  ...props
}: IconProps & { direction: 'up' | 'down' | 'left' | 'right' }) {
  const paths = {
    up: { line: 'M12 19V5', arrow: 'M5 12l7-7 7 7' },
    down: { line: 'M12 5v14', arrow: 'M5 12l7 7 7-7' },
    right: { line: 'M5 12h14', arrow: 'M12 5l7 7-7 7' },
    left: { line: 'M19 12H5', arrow: 'M12 5l-7 7 7 7' }
  }[direction];
  return (
    <Svg strokeWidth={2.5} {...props}>
      <path d={paths.line} />
      <path d={paths.arrow} />
    </Svg>
  );
}
