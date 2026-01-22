import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * PUBLIC_INTERFACE
 * Injection token for the backend API base URL (e.g., http://localhost:3001).
 *
 * Services should inject this token instead of importing `environment` directly.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBase,
});
