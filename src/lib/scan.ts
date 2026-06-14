/**
 * Helpers for interpreting the raw text decoded from a scanned QR code.
 *
 * Aquí QRs encode either a full URL (e.g. `https://app/v/demo?loc=A1`) or,
 * for convenience, a bare identifier. These helpers normalise both shapes
 * so the pages don't each re-implement the parsing.
 */

/** Try to parse `text` as a URL, returning null if it isn't one. */
function tryParseUrl(text: string): URL | null {
  try {
    return new URL(text.trim());
  } catch {
    return null;
  }
}

/**
 * Extract a location point id from a scanned "Usted está aquí" QR.
 * Accepts a full `?loc=` URL or a bare point id.
 */
export function parseScannedLocation(text: string): string | null {
  const url = tryParseUrl(text);
  if (url) return url.searchParams.get('loc');
  const bare = text.trim();
  return bare.length > 0 ? bare : null;
}

/**
 * Extract a ticket code from a scanned guest QR.
 * Accepts `/v/{id}/t/{code}` paths, `?t=` query params, or a bare code.
 */
export function parseScannedTicketCode(text: string): string {
  const raw = text.trim();
  const url = tryParseUrl(raw);
  if (!url) return raw;

  const pathMatch = url.pathname.match(/\/t\/([^/]+)/);
  if (pathMatch) return pathMatch[1];

  return url.searchParams.get('t') ?? raw;
}
