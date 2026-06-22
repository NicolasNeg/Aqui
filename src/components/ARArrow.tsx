'use client';

import { useEffect, useState } from 'react';

interface ARArrowProps {
  /** Bearing to next waypoint in degrees (0 = North). */
  targetBearing: number;
  /** Optional: show calibration prompt on iOS */
  showCalibrationHint?: boolean;
}

/**
 * Floating 3D arrow that rotates based on device compass heading
 * to always point toward the next waypoint.
 *
 * The arrow rotation is: targetBearing - deviceHeading.
 * When you turn your phone toward the target, the arrow points "up" (forward).
 */
export function ARArrow({ targetBearing }: ARArrowProps) {
  const [heading, setHeading] = useState<number>(0);
  const [hasOrientation, setHasOrientation] = useState(false);

  useEffect(() => {
    let gotAbsolute = false;

    function handleOrientation(e: DeviceOrientationEvent) {
      // Prefer absolute compass; ignore relative deviceorientation once we have absolute
      if (e.type === 'deviceorientation' && gotAbsolute) return;
      if (e.type === 'deviceorientationabsolute') gotAbsolute = true;

      // iOS: webkitCompassHeading is true heading (0-360, CW from north)
      const webkitHeading = (e as any).webkitCompassHeading;
      let h: number;
      if (typeof webkitHeading === 'number') {
        h = webkitHeading;
      } else if (e.alpha !== null) {
        // deviceorientationabsolute: alpha is true compass heading (0=north, CW)
        h = 360 - e.alpha;
      } else {
        return;
      }
      setHeading(h);
      setHasOrientation(true);
    }

    const DOE = DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === 'function') {
      // iOS: permission already requested by parent page — just attach listener
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      // Android: listen to both; absolute takes precedence via gotAbsolute flag
      window.addEventListener('deviceorientationabsolute' as any, handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute' as any, handleOrientation, true);
    };
  }, []);

  // Compute arrow rotation
  const rotation = targetBearing - heading;

  return (
    <div
      className="absolute top-1/2 left-1/2 w-44 h-44 transition-transform"
      style={{
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transitionDuration: '300ms',
        transitionTimingFunction: 'ease-out'
      }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full animate-arrow-bob"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(15, 76, 92, 0.5))' }}
      >
        <defs>
          <linearGradient id="ar-arrow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#0F4C5C" />
          </linearGradient>
          <linearGradient id="ar-arrow-side" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F4C5C" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
        </defs>
        <g transform="translate(100, 100)">
          {/* Shadow */}
          <ellipse cx="0" cy="65" rx="50" ry="8" fill="#000" opacity="0.3" />
          {/* Back face for depth */}
          <polygon
            points="-50,25 50,25 50,-15 75,-15 0,-65 -75,-15 -50,-15"
            fill="url(#ar-arrow-side)"
            opacity="0.7"
            transform="translate(6, 6)"
          />
          {/* Front face */}
          <polygon
            points="-50,25 50,25 50,-15 75,-15 0,-65 -75,-15 -50,-15"
            fill="url(#ar-arrow-grad)"
            stroke="#0F1B2E"
            strokeWidth="2"
          />
          {/* Glossy highlight */}
          <polygon
            points="-50,25 -50,-15 -75,-15 0,-65"
            fill="#FFFFFF"
            opacity="0.18"
          />
        </g>
      </svg>

      {!hasOrientation && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-white text-xs bg-black/60 px-3 py-1 rounded-full">
          Esperando brújula…
        </div>
      )}
    </div>
  );
}
