import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';

/**
 * PUBLIC_INTERFACE
 * Tracks backend reachability to support a lightweight in-app status indicator.
 *
 * The check uses an absolute URL derived from API_BASE_URL so it does NOT depend on
 * the API base URL interceptor (which is intended only for relative API calls).
 *
 * Strategy:
 * - Prefer a configured health endpoint if present (NG_APP_HEALTHCHECK_PATH).
 * - Fall back to probing `/api/customers` (HEAD preferred, GET as fallback) to validate CRUD API reachability.
 */
@Injectable({ providedIn: 'root' })
export class BackendStatusService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);

  /** Health path optionally configured via env (defaults to /healthz). */
  private readonly healthPath =
    (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })
      ?.process?.env?.['NG_APP_HEALTHCHECK_PATH'] ?? '/healthz';

  /** Internal status: 'unknown' | 'ok' | 'down' */
  private readonly _status = signal<'unknown' | 'ok' | 'down'>('unknown');
  private readonly _lastCheckedAt = signal<number | null>(null);

  /** Internal detail message for debugging/user hint. */
  private readonly _detail = signal<string | null>(null);

  readonly status = computed(() => this._status());
  readonly lastCheckedAt = computed(() => this._lastCheckedAt());
  readonly detail = computed(() => this._detail());

  /**
   * PUBLIC_INTERFACE
   * Run a backend reachability check and update signals.
   *
   * Call this on app/page init and after errors if desired.
   */
  refresh(): void {
    const base = (this.apiBase || '').replace(/\/+$/, '');
    if (!base) {
      this._status.set('down');
      this._detail.set('API base URL is not configured.');
      this._lastCheckedAt.set(Date.now());
      return;
    }

    // 1) Try health endpoint first (fast, minimal).
    const healthUrl = `${base}${this.normalizePath(this.healthPath)}`;

    this.http
      .get(healthUrl, { responseType: 'text' })
      .pipe(
        map(() => ({ ok: true as const, method: 'healthz' as const })),
        catchError(() => of({ ok: false as const, method: 'healthz' as const })),
      )
      .subscribe((healthRes) => {
        if (healthRes.ok) {
          this._status.set('ok');
          this._detail.set(null);
          this._lastCheckedAt.set(Date.now());
          return;
        }

        // 2) Fall back to probing the customers API (covers the requested /api/customers in preview).
        const customersUrl = `${base}/api/customers`;

        // HEAD is best, but some backends don't support HEAD; treat failure as "try GET".
        this.http
          .head(customersUrl, { observe: 'response' })
          .pipe(
            map(() => ({ ok: true as const, via: 'head' as const })),
            catchError(() => of({ ok: false as const, via: 'head' as const })),
          )
          .subscribe((headRes) => {
            if (headRes.ok) {
              this._status.set('ok');
              this._detail.set(null);
              this._lastCheckedAt.set(Date.now());
              return;
            }

            this.http
              .get(customersUrl, { observe: 'response' })
              .pipe(
                map(() => ({ ok: true as const, via: 'get' as const })),
                catchError((err: unknown) => {
                  const maybeStatus =
                    (err as { status?: number } | null)?.status ?? undefined;
                  const msg =
                    maybeStatus === 0
                      ? 'No response from backend.'
                      : `Backend returned an error (${String(maybeStatus ?? 'unknown')}).`;

                  return of({ ok: false as const, via: 'get' as const, msg });
                }),
              )
              .subscribe((getRes) => {
                if (getRes.ok) {
                  this._status.set('ok');
                  this._detail.set(null);
                } else {
                  this._status.set('down');
                  this._detail.set(getRes.msg ?? 'Backend is unreachable.');
                }
                this._lastCheckedAt.set(Date.now());
              });
          });
      });
  }

  private normalizePath(path: string): string {
    if (!path) return '';
    return path.startsWith('/') ? path : `/${path}`;
  }
}
