interface SectionMarkerProps {
  num: string;
  label: string;
}

/**
 * The wayfinding-style section marker.
 * Looks like: "→ 03  NAVEGACIÓN"
 *
 * This is the signature element of the Aquí brand,
 * used consistently across the marketing site and the app.
 */
export function SectionMarker({ num, label }: SectionMarkerProps) {
  return (
    <div className="sec-marker">
      <span className="arrow">→</span>
      <span className="num">{num}</span>
      <span className="label">{label}</span>
    </div>
  );
}
