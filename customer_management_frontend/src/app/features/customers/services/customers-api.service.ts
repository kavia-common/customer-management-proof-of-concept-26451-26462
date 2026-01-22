import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CreateCustomerRequest,
  Customer,
  CustomersListQuery,
  ListResponse,
  UpdateCustomerRequest,
} from '../../../core/models/customer.model';

/**
 * PUBLIC_INTERFACE
 * Angular API service for customer CRUD + search.
 *
 * This service intentionally uses relative URLs so that the API base URL is provided
 * via the API base token + interceptor (no hard-coded hosts).
 */
@Injectable({ providedIn: 'root' })
export class CustomersApiService {
  private readonly http = inject(HttpClient);

  /**
   * PUBLIC_INTERFACE
   * List customers with optional search/filter/sort params.
   *
   * Backend endpoint path is `/api/customers`.
   * This service intentionally uses relative URLs so the API base URL interceptor can prefix them.
   */
  list(query: CustomersListQuery = {}): Observable<ListResponse<Customer>> {
    const params = this.toHttpParams(query);

    return this.http.get<unknown>('/api/customers', { params }).pipe(
      map((res) => {
        // Support either { items: [...] } or raw array [...].
        if (Array.isArray(res)) {
          return { items: res as Customer[] };
        }
        const obj = res as Partial<ListResponse<Customer>> & { items?: unknown };
        if (Array.isArray(obj.items)) {
          return { items: obj.items as Customer[], total: obj.total };
        }
        return { items: [] };
      }),
    );
  }

  /**
   * PUBLIC_INTERFACE
   * Get customer by id.
   */
  getById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`/api/customers/${encodeURIComponent(String(id))}`);
  }

  /**
   * PUBLIC_INTERFACE
   * Create a customer.
   */
  create(payload: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<Customer>('/api/customers', payload);
  }

  /**
   * PUBLIC_INTERFACE
   * Update a customer by id.
   */
  update(id: number, payload: UpdateCustomerRequest): Observable<Customer> {
    return this.http.put<Customer>(
      `/api/customers/${encodeURIComponent(String(id))}`,
      payload,
    );
  }

  /**
   * PUBLIC_INTERFACE
   * Delete a customer by id.
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/customers/${encodeURIComponent(String(id))}`);
  }

  private toHttpParams(query: CustomersListQuery): HttpParams {
    let params = new HttpParams();

    const append = (k: string, v: unknown) => {
      if (v === undefined || v === null || v === '') return;
      params = params.set(k, String(v));
    };

    // Common query param names (backend can adapt; safe to ignore unknown).
    append('q', query.q);
    append('status', query.status);
    append('sortBy', query.sortBy);
    append('sortDir', query.sortDir);
    append('page', query.page);
    append('pageSize', query.pageSize);

    return params;
  }
}
