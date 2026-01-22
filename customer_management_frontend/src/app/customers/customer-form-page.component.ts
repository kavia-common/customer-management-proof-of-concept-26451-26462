import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomersService } from './customer.service';
import type { CreateCustomerRequest, CustomerDto, UpdateCustomerRequest } from './customer.models';

@Component({
  selector: 'app-customer-form-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
        <div *ngIf="success()" class="alert alert--success">{{ success() }}</div>
        <div *ngIf="error()" class="alert alert--error">{{ error() }}</div>

        <form (ngSubmit)="save(f)" #f="ngForm" class="form" novalidate>
          <div class="grid">
            <div class="field">
              <label class="field__label" for="firstName">First name</label>
              <input
                id="firstName"
                class="field__input"
                [(ngModel)]="model().firstName"
                name="firstName"
                required
                [class.input--invalid]="f.submitted && firstNameInvalid(f)"
              />
              <div class="hint hint--error" *ngIf="f.submitted && firstNameInvalid(f)">
                First name is required.
              </div>
            </div>

            <div class="field">
              <label class="field__label" for="lastName">Last name</label>
              <input
                id="lastName"
                class="field__input"
                [(ngModel)]="model().lastName"
                name="lastName"
                required
                [class.input--invalid]="f.submitted && lastNameInvalid(f)"
              />
              <div class="hint hint--error" *ngIf="f.submitted && lastNameInvalid(f)">
                Last name is required.
              </div>
            </div>

            <div class="field span2">
              <label class="field__label" for="email">Email</label>
              <input
                id="email"
                class="field__input"
                [(ngModel)]="model().email"
                name="email"
                required
                email
                type="email"
                [class.input--invalid]="f.submitted && emailInvalid(f)"
                placeholder="name@company.com"
              />
              <div class="hint hint--error" *ngIf="f.submitted && emailInvalid(f)">
                Enter a valid email address.
              </div>
            </div>

            <div class="field span2">
              <label class="field__label" for="phone">Phone</label>
              <input
                id="phone"
                class="field__input"
                [(ngModel)]="model().phone"
                name="phone"
                placeholder="Optional"
              />
            </div>
          </div>

          <div class="formActions">
            <button class="btn btn--primary" type="submit" [disabled]="loading()">
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
  `,
})
export class CustomerFormPageComponent {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  private readonly id = signal<string | null>(null);
  protected readonly isNew = computed(() => !this.id());

  protected readonly model = signal<CreateCustomerRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  protected readonly customerMeta = signal<CustomerDto | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly customers: CustomersService,
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
    this.success.set(null);

    try {
      const c = await this.customers.getById(id);
      this.customerMeta.set(c);
      this.model.set({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone ?? '',
      });
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to load customer');
    } finally {
      this.loading.set(false);
    }
  }

  firstNameInvalid(f: NgForm): boolean {
    const ctrl = f.controls['firstName'];
    return !!ctrl && ctrl.invalid;
  }

  lastNameInvalid(f: NgForm): boolean {
    const ctrl = f.controls['lastName'];
    return !!ctrl && ctrl.invalid;
  }

  emailInvalid(f: NgForm): boolean {
    const ctrl = f.controls['email'];
    return !!ctrl && ctrl.invalid;
  }

  async save(f: NgForm): Promise<void> {
    this.error.set(null);
    this.success.set(null);

    // Mark submitted to show validation messages
    if (!f.valid) {
      this.error.set('Please fix the validation errors and try again.');
      return;
    }

    this.loading.set(true);

    try {
      const id = this.id();
      if (!id) {
        await this.customers.create(this.model());
        await this.router.navigateByUrl('/customers');
      } else {
        const req: UpdateCustomerRequest = this.model();
        await this.customers.update(id, req);
        this.success.set('Changes saved.');
        // Refresh meta timestamps after save
        await this.load(id);
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to save customer');
    } finally {
      this.loading.set(false);
    }
  }

  async remove(): Promise<void> {
    const id = this.id();
    if (!id) return;

    if (!globalThis.confirm('Delete this customer?')) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

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

