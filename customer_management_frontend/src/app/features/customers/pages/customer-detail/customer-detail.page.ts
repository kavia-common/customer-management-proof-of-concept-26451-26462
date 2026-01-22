import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomersApiService } from '../../services/customers-api.service';
import { Customer } from '../../../../core/models/customer.model';
import { ApiError } from '../../../../core/api/api-error';

@Component({
  selector: 'app-customer-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './customer-detail.page.html',
  styleUrl: './customer-detail.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly customersApi = inject(CustomersApiService);

  readonly id = computed(() => Number(this.route.snapshot.paramMap.get('id') ?? NaN));

  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly customer = signal<Customer | null>(null);

  constructor() {
    const id = this.id();
    if (!Number.isFinite(id)) {
      this.errorMessage.set('Invalid customer id.');
      this.loading.set(false);
      return;
    }

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
          email: 'To be loaded from API',
          status: 'Active',
          notes: 'To be loaded from API',
        });
        this.loading.set(false);
      },
    });
  }
}
