import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { toApiError } from '../api/api-error';

/**
 * PUBLIC_INTERFACE
 * Interceptor that normalizes API errors, logs them, and rethrows a normalized ApiError.
 *
 * UI can later replace console logging with a toast/snackbar service.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    catchError((err: unknown) => {
      const apiErr = toApiError(err);

      // Centralized logging stub (replace with app-wide logger/toast later).
      // Keep this for now to make backend integration troubleshooting easier.
      console.error('[API ERROR]', {
        url: req.url,
        method: req.method,
        status: apiErr.status,
        message: apiErr.message,
        details: apiErr.details,
        cause: apiErr.cause,
      });

      return throwError(() => apiErr);
    }),
  );
};
