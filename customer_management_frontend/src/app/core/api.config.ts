/**
 * Central place for API base URL selection.
 *
 * Uses NG_APP_API_BASE if available (preferred).
 * Falls back to relative "/".
 */
export function getApiBaseUrl(): string {
  const envBase = (globalThis as any)?.process?.env?.['NG_APP_API_BASE'];
  // In Angular (Vite/webpack), process.env may not exist; use a runtime global fallback.
  // Also allow window.__env if provided by hosting.
  const windowBase = (globalThis as any)?.__env?.NG_APP_API_BASE;

  const base = (envBase || windowBase || '').toString().trim();
  if (base) {
    return base.replace(/\/+$/, '');
  }
  return '';
}
