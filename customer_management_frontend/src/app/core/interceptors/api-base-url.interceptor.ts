import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';

/**
 * PUBLIC_INTERFACE
 * Interceptor that prefixes relative request URLs with the configured API base URL.
 *
 * - If request.url is absolute (http/https), it is left untouched.
 * - If request.url starts with '/', it becomes `${API_BASE_URL}${request.url}`.
 * - If request.url is a relative path without a leading '/', it becomes `${API_BASE_URL}/${request.url}`.
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const apiBase = inject(API_BASE_URL);

  // Avoid breaking absolute URLs.
  const isAbsolute = /^https?:\/\//i.test(req.url);
  if (isAbsolute || !apiBase) {
    return next(req);
  }

  const normalizedBase = apiBase.replace(/\/+$/, '');
  const normalizedPath = req.url.startsWith('/') ? req.url : `/${req.url}`;
  const url = `${normalizedBase}${normalizedPath}`;

  return next(req.clone({ url }));
};
