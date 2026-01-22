import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService } from './customer.service';
import type { CreateCustomerRequest, CustomerDto, UpdateCustomerRequest } from './customer.models';

@Component({
  selector: 'app-customer-form-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="layout">
      <header class="header">
        <div class="brand">
          <div class="brand__dot"></div>
          <div class="brand__title">{{ isNew() ? 'New customer' : 'Edit customer' }}</div>
        </div>

        <a class="btn" routerLink="/customers">Back</a>
      </header>

      <section class="card">
        <div *ngIf="error()" class="alert alert--error">{{ error() }}</div>

        <form (ngSubmit)="save()" #f="ngForm" class="form">
          <div class="grid">
            <div class="field">
              <label class="field__label">First name</label>
              <input class="field__input" [(ngModel)]="model().firstName" name="firstName" required />
            </div>

            <div class="field">
              <label class="field__label">Last name</label>
              <input class="field__input" [(ngModel)]="model().lastName" name="lastName" required />
            </div>

            <div class="field span2">
              <label class="field__label">Email</label>
              <input class="field__input" [(ngModel)]="model().email" name="email" required type="email" />
            </div>

            <div class="field span2">
              <label class="field__label">Phone</label>
              <input class="field__input" [(ngModel)]="model().phone" name="phone" />
            </div>
          </div>

          <div class="formActions">
            <button class="btn btn--primary" type="submit" [disabled]="loading() || !f.valid">
              {{ isNew() ? 'Create' : 'Save changes' }}
            </button>

            <button
              *ngIf="!isNew()"
              class="btn btn--danger"
              type="button"
              (click)="remove()"
              [disabled]="loading()"
            >
              Delete
            </button>
          </div>
        </form>

        <div *ngIf="customerMeta()" class="meta">
          <div><strong>Created:</strong> {{ customerMeta()!.createdAt | date: 'medium' }}</div>
          <div><strong>Updated:</strong> {{ customerMeta()!.updatedAt | date: 'medium' }}</div>
        </div>
      </section>
    </div>
  `
})
export class CustomerFormPageComponent {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly id = signal<string | null>(null);

  protected readonly isNew = computed(() => !this.id());

  protected readonly model = signal<CreateCustomerRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  protected readonly customerMeta = signal<CustomerDto | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly customers: CustomerService
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.id.set(id);
      void this.load(id);
    }
  }

  private async load(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const c = await this.customers.get(id);
      this.customerMeta.set(c);
      this.model.set({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone ?? ''
      });
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to load customer');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const id = this.id();
      if (!id) {
        await this.customers.create(this.model());
      } else {
        const req: UpdateCustomerRequest = this.model();
        await this.customers.update(id, req);
      }
      await this.router.navigateByUrl('/customers');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to save customer');
    } finally {
      this.loading.set(false);
    }
  }

  async remove(): Promise<void> {
    const id = this.id();
    if (!id) return;

    if (!confirm('Delete this customer?')) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      await this.customers.delete(id);
      await this.router.navigateByUrl('/customers');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to delete customer');
    } finally {
      this.loading.set(false);
    }
  }
}
