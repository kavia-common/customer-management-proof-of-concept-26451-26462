export const environment = {
  /**
   * Base URL for REST API calls from the Angular app.
   * Read from NG_APP_API_BASE (preferred) or NG_APP_BACKEND_URL.
   */
  apiBase:
    (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })
      ?.process?.env?.['NG_APP_API_BASE'] ??
    (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })
      ?.process?.env?.['NG_APP_BACKEND_URL'] ??
    'http://localhost:3001',
};
