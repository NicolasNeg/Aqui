/**
 * Resolve the public base URL of the app.
 *
 * Prefers the configured `NEXT_PUBLIC_APP_URL` (so printed QRs point at the
 * real domain), and falls back to the current origin in the browser.
 * Returns '' during SSR when neither is available.
 */
export function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/** URL a visitor opens after scanning a location QR: `/v/{venue}?loc={point}`. */
export function locationUrl(baseUrl: string, venueId: string, pointId: string): string {
  return `${baseUrl}/v/${venueId}?loc=${pointId}`;
}

/** URL of a guest's personal ticket: `/v/{venue}/t/{code}`. */
export function ticketUrl(baseUrl: string, venueId: string, code: string): string {
  return `${baseUrl}/v/${venueId}/t/${code}`;
}
