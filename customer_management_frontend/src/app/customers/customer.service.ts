import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getApiBaseUrl } from '../core/api.config';
import type {
  CreateCustomerRequest,
  CustomerDto,
  PagedCustomersResponse,
  UpdateCustomerRequest,
} from './customer.models';

type ProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
};

/**
 * Converts various backend error shapes (ProblemDetails, validation errors, etc.)
 * into a human-friendly message suitable for inline UI display.
 */
function formatApiError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const statusLine = err.status ? `${err.status} ${err.statusText}`.trim() : 'Request failed';

    const payload = err.error as any;
    // Angular may provide string, object, Blob, etc.
    if (typeof payload === 'string' && payload.trim()) {
      return `${statusLine}: ${payload}`.trim();
    }

    const pd = payload as ProblemDetails | undefined;
    if (pd && (pd.title || pd.detail || pd.errors)) {
      let msg = `${pd.title ?? 'Error'}${pd.detail ? `: ${pd.detail}` : ''}`.trim();

      if (pd.errors) {
        const errs = Object.entries(pd.errors)
          .map(([k, v]) => `${k}: ${(v ?? []).join(', ')}`)
          .join(' | ');
        if (errs) msg = `${msg} (${errs})`;
      }

      return msg;
    }

    return statusLine;
  }

  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as any).message);
  }

  return 'Unexpected error';
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly apiBase = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  private url(path: string): string {
    // path should start with "/api/..."
    return `${this.apiBase}${path}`;
  }

  // PUBLIC_INTERFACE
  async list(page = 1, pageSize = 20, q?: string): Promise<PagedCustomersResponse> {
    /** List customers with pagination and optional search. */
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (q?.trim()) params = params.set('q', q.trim());

    try {
      return await firstValueFrom(
        this.http.get<PagedCustomersResponse>(this.url('/api/customers'), { params }),
      );
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  }

  // PUBLIC_INTERFACE
  async getById(id: string): Promise<CustomerDto> {
    /** Fetch a single customer by id. */
    try {
      return await firstValueFrom(
        this.http.get<CustomerDto>(this.url(`/api/customers/${encodeURIComponent(id)}`)),
      );
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  }

  // PUBLIC_INTERFACE
  async create(request: CreateCustomerRequest): Promise<CustomerDto> {
    /** Create a new customer. */
    try {
      return await firstValueFrom(this.http.post<CustomerDto>(this.url('/api/customers'), request));
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  }

  // PUBLIC_INTERFACE
  async update(id: string, request: UpdateCustomerRequest): Promise<CustomerDto> {
    /** Update an existing customer. */
    try {
      return await firstValueFrom(
        this.http.put<CustomerDto>(this.url(`/api/customers/${encodeURIComponent(id)}`), request),
      );
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  }

  // PUBLIC_INTERFACE
  async delete(id: string): Promise<void> {
    /** Delete a customer. */
    try {
      await firstValueFrom(this.http.delete<void>(this.url(`/api/customers/${encodeURIComponent(id)}`)));
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  }
}

