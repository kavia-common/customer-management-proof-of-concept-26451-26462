import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomersApiService } from '../../services/customers-api.service';
import { Customer } from '../../../../core/models/customer.model';
import { ApiError } from '../../../../core/api/api-error';

@Component({
  selector: 'app-customers-list-page',
  standalone: true,
  imports: [RouterLink],
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

  constructor() {
    // Try to load from backend; fall back to placeholder if unavailable.
    this.customersApi.list({}).subscribe({
      next: (res) => {
        this.customers.set(res.items);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        const apiErr = err as ApiError;
        this.errorMessage.set(apiErr?.message ?? 'Unable to load customers.');
        this.loading.set(false);
      },
    });
  }
}
