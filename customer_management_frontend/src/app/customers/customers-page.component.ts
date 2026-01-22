import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomerService } from './customer.service';
import type { CustomerDto, PagedCustomersResponse } from './customer.models';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="layout">
      <header class="header">
        <div class="brand">
          <div class="brand__dot"></div>
          <div class="brand__title">Customer Management</div>
        </div>

        <a class="btn btn--primary" routerLink="/customers/new">New customer</a>
      </header>

      <section class="card">
        <div class="toolbar">
          <div class="toolbar__left">
            <div class="field">
              <label class="field__label" for="search">Search</label>
              <input
                id="search"
                class="field__input"
                [value]="search()"
                (input)="onSearch(($any($event.target)).value)"
                placeholder="Name or email"
              />
            </div>
          </div>
          <div class="toolbar__right">
            <button class="btn" (click)="refresh()" [disabled]="loading()">Refresh</button>
          </div>
        </div>

        <div *ngIf="error()" class="alert alert--error">{{ error() }}</div>

        <div class="tableWrap" *ngIf="!loading(); else loadingTpl">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th class="hideSm">Email</th>
                <th class="hideSm">Phone</th>
                <th class="hideSm">Updated</th>
                <th class="actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr *ngFor="let c of items()">
                <td>
                  <div class="nameCell">
                    <div class="nameCell__title">{{ c.firstName }} {{ c.lastName }}</div>
                    <div class="nameCell__sub showSm">{{ c.email }}</div>
                  </div>
                </td>
                <td class="hideSm">{{ c.email }}</td>
                <td class="hideSm">{{ c.phone || '—' }}</td>
                <td class="hideSm">{{ c.updatedAt | date: 'medium' }}</td>
                <td class="actions">
                  <a class="link" [routerLink]="['/customers', c.id]">Edit</a>
                  <button class="link link--danger" (click)="remove(c)" [disabled]="loading()">Delete</button>
                </td>
              </tr>

              <tr *ngIf="items().length === 0">
                <td colspan="5" class="empty">No customers found.</td>
              </tr>
            </tbody>
          </table>

          <div class="pager">
            <button class="btn" (click)="prev()" [disabled]="loading() || page() <= 1">Prev</button>
            <div class="pager__meta">Page {{ page() }} of {{ totalPages() }}</div>
            <button class="btn" (click)="next()" [disabled]="loading() || page() >= totalPages()">Next</button>
          </div>
        </div>

        <ng-template #loadingTpl>
          <div class="loading">Loading…</div>
        </ng-template>
      </section>
    </div>
  `
})
export class CustomersPageComponent {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly search = signal('');

  protected readonly data = signal<PagedCustomersResponse | null>(null);

  protected readonly items = computed<CustomerDto[]>(() => this.data()?.items ?? []);
  protected readonly totalPages = computed<number>(() => this.data()?.totalPages ?? 1);

  constructor(private readonly customers: CustomerService) {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.customers.list(this.page(), this.pageSize(), this.search());
      this.data.set(res);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to load customers');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
    void this.refresh();
  }

  prev(): void {
    this.page.set(Math.max(1, this.page() - 1));
    void this.refresh();
  }

  next(): void {
    this.page.set(this.page() + 1);
    void this.refresh();
  }

  async remove(c: CustomerDto): Promise<void> {
    if (!confirm(`Delete ${c.firstName} ${c.lastName}?`)) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      await this.customers.delete(c.id);
      await this.refresh();
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to delete customer');
    } finally {
      this.loading.set(false);
    }
  }
}
