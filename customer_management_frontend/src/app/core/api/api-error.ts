import { HttpErrorResponse } from '@angular/common/http';

/**
 * PUBLIC_INTERFACE
 * Normalized API error used by services and UI.
 */
export type ApiError = {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  /** Original error for diagnostics (not for user display). */
  cause?: unknown;
};

/**
 * PUBLIC_INTERFACE
 * Convert Angular HttpErrorResponse into a normalized ApiError.
 *
 * This keeps UI handling consistent and allows later enhancement
 * (e.g., toast notifications, error reporting, correlation IDs, etc.).
 */
export function toApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse) {
    // Try to extract a meaningful message from common backend shapes.
    const backendMessage =
      typeof err.error === 'string'
        ? err.error
        : (err.error as { message?: string } | null)?.message;

    const status = err.status || undefined;

    // User-friendly message stub (expand later).
    let message = 'Something went wrong. Please try again.';
    if (status === 0) message = 'Unable to reach the server. Check your connection.';
    if (status === 404) message = 'The requested resource was not found.';
    if (status === 400) message = 'Some information looks invalid. Please review and try again.';
    if (status === 500) message = 'Server error. Please try again in a moment.';

    return {
      message,
      status,
      details: err.error,
      cause: err,
      code: undefined,
    };
  }

  return {
    message: 'Unexpected error occurred.',
    cause: err,
  };
}
