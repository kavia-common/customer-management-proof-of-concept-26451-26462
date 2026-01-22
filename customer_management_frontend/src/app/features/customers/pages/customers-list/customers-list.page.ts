import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomersApiService } from '../../services/customers-api.service';
import { ApiError } from '../../../../core/api/api-error';
import {
  CreateCustomerRequest,
  Customer,
  CustomerStatus,
  CustomersListQuery,
  UpdateCustomerRequest,
} from '../../../../core/models/customer.model';
import { CustomerFormModalComponent } from '../../components/customer-form-modal/customer-form-modal.component';

type SortField = NonNullable<CustomersListQuery['sortBy']>;
type SortDir = NonNullable<CustomersListQuery['sortDir']>;

@Component({
  selector: 'app-customers-list-page',
  standalone: true,
  imports: [RouterLink, CustomerFormModalComponent],
  templateUrl: './customers-list.page.html',
  styleUrl: './customers-list.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersListPage {
  private readonly customersApi = inject(CustomersApiService);

  /** Loading state for progressive enhancement while backend comes online. */
  readonly loading = signal<boolean>(true);

  /** If an API error occurs, we keep a user-friendly message stub for later UI. */
  readonly errorMessage = signal<string | null>(null);

  /** Customers displayed in the grid. */
  readonly customers = signal<Customer[]>([
    // Placeholder data for layout verification; replaced by API result when available.
    { id: 1, name: 'Acme Corp', email: 'ops@acme.example', status: 'Active' },
    { id: 2, name: 'Blue Harbor LLC', email: 'hello@blueharbor.example', status: 'Prospect' },
    { id: 3, name: 'Nimbus Systems', email: 'billing@nimbus.example', status: 'Active' },
  ]);

  // UI state
  readonly q = signal<string>('');
  readonly status = signal<CustomerStatus | 'All'>('All');
  readonly sortBy = signal<SortField>('name');
  readonly sortDir = signal<SortDir>('asc');

  // Modal state
  readonly modalOpen = signal<boolean>(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly modalCustomer = signal<Customer | null>(null);
  readonly modalSaving = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);

  readonly statuses: Array<CustomerStatus | 'All'> = ['All', 'Active', 'Prospect', 'Inactive'];

  readonly filteredSortedCustomers = computed(() => {
    const q = this.q().trim().toLowerCase();
    const status = this.status();
    const sortBy = this.sortBy();
    const sortDir = this.sortDir();

    let items = this.customers().slice();

    if (q) {
      items = items.filter((c) => {
        return (
          (c.name ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          String(c.id).includes(q)
        );
      });
    }

    if (status !== 'All') {
      items = items.filter((c) => c.status === status);
    }

    const dir = sortDir === 'asc' ? 1 : -1;

    items.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortBy];
      const bv = (b as Record<string, unknown>)[sortBy];

      const as = String(av ?? '').toLowerCase();
      const bs = String(bv ?? '').toLowerCase();

      if (as < bs) return -1 * dir;
      if (as > bs) return 1 * dir;
      return 0;
    });

    return items;
  });

  constructor() {
    this.refreshFromApi();
  }

  private refreshFromApi(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const query: CustomersListQuery = {
      q: this.q().trim() || undefined,
      status: this.status() === 'All' ? undefined : (this.status() as CustomerStatus),
      sortBy: this.sortBy(),
      sortDir: this.sortDir(),
    };

    this.customersApi.list(query).subscribe({
      next: (res) => {
        if (res.items?.length) {
          this.customers.set(res.items);
        }
        this.loading.set(false);
      },
      error: (err: unknown) => {
        const apiErr = err as ApiError;
        this.errorMessage.set(apiErr?.message ?? 'Unable to load customers.');
        this.loading.set(false);
      },
    });
  }

  onApplyFilters(): void {
    this.refreshFromApi();
  }

  onClearFilters(): void {
    this.q.set('');
    this.status.set('All');
    this.sortBy.set('name');
    this.sortDir.set('asc');
    this.refreshFromApi();
  }

  onToggleSort(field: SortField): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
    this.refreshFromApi();
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.modalCustomer.set(null);
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  openEditModalForCustomer(c: Customer): void {
    this.modalMode.set('edit');
    this.modalCustomer.set(c);
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    if (this.modalSaving()) return;
    this.modalOpen.set(false);
    this.modalError.set(null);
  }

  onModalSubmitted(value: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: CustomerStatus;
    notes: string;
  }): void {
    this.modalSaving.set(true);
    this.modalError.set(null);

    const name = `${value.firstName} ${value.lastName}`.trim();

    if (this.modalMode() === 'create') {
      const payload: CreateCustomerRequest = {
        name,
        email: value.email,
        status: value.status,
        notes: value.notes || null,
      };

      this.customersApi.create(payload).subscribe({
        next: () => {
          this.modalSaving.set(false);
          this.modalOpen.set(false);
          this.refreshFromApi();
        },
        error: (err: unknown) => {
          const apiErr = err as ApiError;
          this.modalSaving.set(false);
          this.modalError.set(apiErr?.message ?? 'Unable to create customer.');
        },
      });
      return;
    }

    const current = this.modalCustomer();
    if (!current) {
      this.modalSaving.set(false);
      this.modalError.set('No customer selected.');
      return;
    }

    const payload: UpdateCustomerRequest = {
      name,
      email: value.email,
      status: value.status,
      notes: value.notes || null,
    };

    this.customersApi.update(current.id, payload).subscribe({
      next: () => {
        this.modalSaving.set(false);
        this.modalOpen.set(false);
        this.refreshFromApi();
      },
      error: (err: unknown) => {
        const apiErr = err as ApiError;
        this.modalSaving.set(false);
        this.modalError.set(apiErr?.message ?? 'Unable to update customer.');
      },
    });
  }

  // PUBLIC_INTERFACE
  onSearchInput(e: unknown): void {
    /** Update search query from input event. Kept in TS to avoid template parser limitations. */
    const value =
      (e as { target?: { value?: unknown } } | null)?.target?.value ?? '';
    this.q.set(String(value));
  }

  // PUBLIC_INTERFACE
  onStatusChange(e: unknown): void {
    /** Update status filter from select change event. Kept in TS to avoid template parser limitations. */
    const value =
      (e as { target?: { value?: unknown } } | null)?.target?.value ?? 'All';
    const str = String(value || 'All');
    // Ensure only known values are set.
    const allowed = new Set(this.statuses);
    this.status.set((allowed.has(str as any) ? str : 'All') as any);
  }

  onDeleteFromList(c: Customer, e: unknown): void {
    // Prevent link navigation when clicking delete in the card.
    (e as { preventDefault?: () => void } | null)?.preventDefault?.();
    (e as { stopPropagation?: () => void } | null)?.stopPropagation?.();

    const ok = globalThis.confirm(`Delete ${c.name}? This cannot be undone.`);
    if (!ok) return;

    this.customersApi.delete(c.id).subscribe({
      next: () => this.refreshFromApi(),
      error: (err: unknown) => {
        const apiErr = err as ApiError;
        this.errorMessage.set(apiErr?.message ?? 'Unable to delete customer.');
      },
    });
  }

  trackById(_: number, c: Customer): number {
    return c.id;
  }
}
