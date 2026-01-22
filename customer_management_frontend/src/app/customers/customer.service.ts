import { Injectable } from '@angular/core';
import { getApiBaseUrl } from '../core/api.config';
import type {
  CreateCustomerRequest,
  CustomerDto,
  PagedCustomersResponse,
  UpdateCustomerRequest
} from './customer.models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly baseUrl = getApiBaseUrl();

  private url(path: string): string {
    const prefix = this.baseUrl ? this.baseUrl : '';
    return `${prefix}${path}`;
  }

  private async json<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  private async throwIfNotOk(response: Response): Promise<void> {
    if (response.ok) return;

    let detail = `${response.status} ${response.statusText}`;
    try {
      const payload = await this.json<any>(response);
      if (payload?.title || payload?.detail) {
        detail = `${payload.title ?? 'Error'}: ${payload.detail ?? ''}`.trim();
      }
      if (payload?.errors) {
        const errs = Object.entries(payload.errors)
          .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
          .join(' | ');
        if (errs) detail = `${detail} (${errs})`;
      }
    } catch {
      // ignore parse failures
    }
    throw new Error(detail);
  }

  async list(page = 1, pageSize = 20, search?: string): Promise<PagedCustomersResponse> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (search?.trim()) params.set('search', search.trim());

    const res = await fetch(this.url(`/api/customers?${params.toString()}`));
    await this.throwIfNotOk(res);
    return await this.json<PagedCustomersResponse>(res);
  }

  async get(id: string): Promise<CustomerDto> {
    const res = await fetch(this.url(`/api/customers/${encodeURIComponent(id)}`));
    await this.throwIfNotOk(res);
    return await this.json<CustomerDto>(res);
  }

  async create(request: CreateCustomerRequest): Promise<CustomerDto> {
    const res = await fetch(this.url(`/api/customers`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    await this.throwIfNotOk(res);
    return await this.json<CustomerDto>(res);
  }

  async update(id: string, request: UpdateCustomerRequest): Promise<CustomerDto> {
    const res = await fetch(this.url(`/api/customers/${encodeURIComponent(id)}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    await this.throwIfNotOk(res);
    return await this.json<CustomerDto>(res);
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(this.url(`/api/customers/${encodeURIComponent(id)}`), { method: 'DELETE' });
    await this.throwIfNotOk(res);
  }
}
