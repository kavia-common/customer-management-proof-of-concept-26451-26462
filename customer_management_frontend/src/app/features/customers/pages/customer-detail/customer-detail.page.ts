import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomersApiService } from '../../services/customers-api.service';
import { Customer, CustomerStatus, UpdateCustomerRequest } from '../../../../core/models/customer.model';
import { ApiError } from '../../../../core/api/api-error';
import { CustomerFormModalComponent } from '../../components/customer-form-modal/customer-form-modal.component';

@Component({
  selector: 'app-customer-detail-page',
  standalone: true,
  imports: [RouterLink, CustomerFormModalComponent],
  templateUrl: './customer-detail.page.html',
  styleUrl: './customer-detail.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customersApi = inject(CustomersApiService);

  readonly id = computed(() => Number(this.route.snapshot.paramMap.get('id') ?? NaN));

  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly customer = signal<Customer | null>(null);

  // Modal state
  readonly modalOpen = signal<boolean>(false);
  readonly modalSaving = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);

  constructor() {
    const id = this.id();
    if (!Number.isFinite(id)) {
      this.errorMessage.set('Invalid customer id.');
      this.loading.set(false);
      return;
    }

    this.refresh();
  }

  refresh(): void {
    const id = this.id();
    if (!Number.isFinite(id)) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.customersApi.getById(id).subscribe({
      next: (c) => {
        this.customer.set(c);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        const apiErr = err as ApiError;
        this.errorMessage.set(apiErr?.message ?? 'Unable to load customer.');
        // Keep minimal placeholder so the page remains usable.
        this.customer.set({
          id,
          name: `Customer #${id}`,
          email: '',
          status: 'Active',
          notes: null,
        });
        this.loading.set(false);
      },
    });
  }

  openEdit(): void {
    if (!this.customer()) return;
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
    const current = this.customer();
    if (!current) return;

    this.modalSaving.set(true);
    this.modalError.set(null);

    const name = `${value.firstName} ${value.lastName}`.trim();

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
        this.refresh();
      },
      error: (err: unknown) => {
        const apiErr = err as ApiError;
        this.modalSaving.set(false);
        this.modalError.set(apiErr?.message ?? 'Unable to update customer.');
      },
    });
  }

  onDelete(): void {
    const current = this.customer();
    if (!current) return;

    const ok = globalThis.confirm(`Delete ${current.name}? This cannot be undone.`);
    if (!ok) return;

    this.customersApi.delete(current.id).subscribe({
      next: () => {
        void this.router.navigate(['/customers']);
      },
      error: (err: unknown) => {
        const apiErr = err as ApiError;
        this.errorMessage.set(apiErr?.message ?? 'Unable to delete customer.');
      },
    });
  }
}
