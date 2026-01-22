function readEnv(name: string): string | undefined {
  return (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })
    ?.process?.env?.[name];
}

function normalizeBaseUrl(url: string): string {
  // Trim whitespace and trailing slashes for safe concatenation in interceptor/service.
  return url.trim().replace(/\/+$/, '');
}

export const environment = {
  /**
   * Base URL for REST API calls from the Angular app.
   * Read from NG_APP_API_BASE (preferred) or NG_APP_BACKEND_URL.
   *
   * Expected in preview:
   * - Frontend: :3000
   * - Backend:  :3001
   */
  apiBase: normalizeBaseUrl(
    readEnv('NG_APP_API_BASE') ??
      readEnv('NG_APP_BACKEND_URL') ??
      'http://localhost:3001',
  ),
};
