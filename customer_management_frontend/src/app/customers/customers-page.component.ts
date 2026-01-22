import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService } from './customer.service';
import type { CustomerDto, PagedCustomersResponse } from './customer.models';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
                [(ngModel)]="searchModel"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Name or email"
              />
            </div>
          </div>

          <div class="toolbar__right">
            <div class="field" style="min-width: 140px;">
              <label class="field__label" for="pageSize">Page size</label>
              <select
                id="pageSize"
                class="field__input"
                [ngModel]="pageSize()"
                (ngModelChange)="setPageSize($event)"
              >
                <option [ngValue]="10">10</option>
                <option [ngValue]="20">20</option>
                <option [ngValue]="50">50</option>
              </select>
            </div>

            <button class="btn" (click)="refresh()" [disabled]="loading()">Refresh</button>
          </div>
        </div>

        <div *ngIf="success()" class="alert alert--success">{{ success() }}</div>
        <div *ngIf="error()" class="alert alert--error">{{ error() }}</div>

        <div class="tableWrap" *ngIf="!loading(); else loadingTpl">
          <table class="table" aria-label="Customers table">
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
            <div class="pager__meta">
              Page {{ page() }} of {{ totalPages() }} · {{ totalCount() }} total
            </div>
            <button class="btn" (click)="next()" [disabled]="loading() || page() >= totalPages()">Next</button>
          </div>
        </div>

        <ng-template #loadingTpl>
          <div class="loading">Loading…</div>
        </ng-template>
      </section>
    </div>
  `,
})
export class CustomersPageComponent {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);

  // UI model for search input (debounced into `searchEffective`)
  searchModel = '';
  protected readonly searchEffective = signal('');

  private searchTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

  protected readonly data = signal<PagedCustomersResponse | null>(null);

  protected readonly items = computed<CustomerDto[]>(() => this.data()?.items ?? []);
  protected readonly totalPages = computed<number>(() => this.data()?.totalPages ?? 1);
  protected readonly totalCount = computed<number>(() => this.data()?.totalCount ?? 0);

  constructor(private readonly customers: CustomersService) {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const res = await this.customers.list(this.page(), this.pageSize(), this.searchEffective());
      this.data.set(res);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to load customers');
    } finally {
      this.loading.set(false);
    }
  }

  onSearchChange(value: string): void {
    this.searchModel = value;

    if (this.searchTimer) globalThis.clearTimeout(this.searchTimer);

    // Simple debounce to avoid spamming API
    this.searchTimer = globalThis.setTimeout(() => {
      this.searchEffective.set((value ?? '').trim());
      this.page.set(1);
      void this.refresh();
    }, 250);
  }

  setPageSize(size: number): void {
    const safe = Number(size) || 20;
    this.pageSize.set(safe);
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
    if (!globalThis.confirm(`Delete ${c.firstName} ${c.lastName}?`)) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      await this.customers.delete(c.id);

      // If we just removed the last item on the page, try backing up one page.
      const remaining = Math.max(0, this.items().length - 1);
      if (remaining === 0 && this.page() > 1) {
        this.page.set(this.page() - 1);
      }

      await this.refresh();
      this.success.set('Customer deleted.');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to delete customer');
    } finally {
      this.loading.set(false);
    }
  }
}

