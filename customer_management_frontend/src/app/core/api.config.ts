/**
 * Central place for API base URL selection.
 *
 * IMPORTANT:
 * - Uses NG_APP_API_BASE (preferred) if available at runtime.
 * - Falls back to http://localhost:3001 (per preview ports requirement).
 *
 * Notes:
 * - In typical Angular browser builds, `process.env` is not available at runtime.
 * - We support multiple runtime injection patterns:
 *   1) `globalThis.process.env.NG_APP_API_BASE` (SSR / Node-like environments)
 *   2) `globalThis.__env.NG_APP_API_BASE` (optional window/global injected config)
 */
export function getApiBaseUrl(): string {
  const envBase = (globalThis as any)?.process?.env?.['NG_APP_API_BASE'];
  const windowBase = (globalThis as any)?.__env?.NG_APP_API_BASE;

  const base = (envBase || windowBase || '').toString().trim();
  const resolved = base || 'http://localhost:3001';

  // Normalize: remove trailing slashes so we can safely join with "/api/..."
  return resolved.replace(/\/+$/, '');
}

