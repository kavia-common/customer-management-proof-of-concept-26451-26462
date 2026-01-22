import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Customer, CustomerStatus } from '../../../../core/models/customer.model';

type CustomerFormValue = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  notes: string;
};

const EMAIL_REGEX =
  // Simple, practical email check (not exhaustive RFC)
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_REGEX =
  // Accept +, digits, spaces, (), -, .
  /^[+]?[\d\s().-]{7,}$/;

@Component({
  selector: 'app-customer-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-form-modal.component.html',
  styleUrl: './customer-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormModalComponent {
  /**
   * PUBLIC_INTERFACE
   * Whether the modal is open (rendered).
   */
  @Input({ required: true }) open = false;

  /**
   * PUBLIC_INTERFACE
   * "create" for new customers, "edit" to update an existing customer.
   */
  @Input({ required: true }) mode: 'create' | 'edit' = 'create';

  /**
   * PUBLIC_INTERFACE
   * Existing customer data to prefill the form for edit mode.
   */
  @Input() customer: Customer | null = null;

  /**
   * PUBLIC_INTERFACE
   * When true, disables form controls and shows saving state.
   */
  @Input() saving = false;

  /**
   * PUBLIC_INTERFACE
   * Optional top-level error message (e.g., API error).
   */
  @Input() errorMessage: string | null = null;

  /**
   * PUBLIC_INTERFACE
   * Fired when user cancels/closes modal.
   */
  @Output() closed = new EventEmitter<void>();

  /**
   * PUBLIC_INTERFACE
   * Fired when user submits. Parent decides whether to call create/update.
   */
  @Output() submitted = new EventEmitter<CustomerFormValue>();

  private readonly initializedForId = signal<number | null>(null);

  readonly title = computed(() =>
    this.mode === 'create' ? 'New customer' : 'Edit customer',
  );

  readonly form = new FormGroup({
    firstName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    lastName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(200),
        Validators.pattern(EMAIL_REGEX),
      ],
    }),
    phone: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(40), Validators.pattern(PHONE_REGEX)],
    }),
    status: new FormControl<CustomerStatus>('Active', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    notes: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
  });

  readonly statuses: CustomerStatus[] = ['Active', 'Prospect', 'Inactive'];

  /**
   * PUBLIC_INTERFACE
   * Call on every CD cycle when modal opens; ensures form is reset/prefilled exactly once.
   */
  syncFromInputs(): void {
    if (!this.open) return;

    if (this.mode === 'create') {
      if (this.initializedForId() !== -1) {
        this.initializedForId.set(-1);
        this.form.reset({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          status: 'Active',
          notes: '',
        });
        this.form.markAsPristine();
        this.form.markAsUntouched();
      }
      return;
    }

    const id = this.customer?.id ?? null;
    if (id === null) return;

    if (this.initializedForId() !== id) {
      this.initializedForId.set(id);

      // Our frontend Customer model currently stores "name". For the modal we split it.
      const { firstName, lastName } = splitName(this.customer?.name ?? '');

      this.form.reset({
        firstName,
        lastName,
        email: this.customer?.email ?? '',
        phone: '', // not in current model; keep blank until backend adds it
        status: (this.customer?.status ?? 'Active') as CustomerStatus,
        notes: this.customer?.notes ?? '',
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  onBackdropMouseDown(e: unknown): void {
    // Close only if clicking directly on backdrop (not inside dialog).
    const evt = e as { target?: unknown; currentTarget?: unknown } | null;
    if (evt?.target && evt?.currentTarget && evt.target === evt.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    if (this.saving) return;
    this.closed.emit();
  }

  onSubmit(): void {
    if (this.saving) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.submitted.emit(this.form.getRawValue());
  }
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: '', lastName: '' };

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0] ?? '', lastName: '' };

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}
