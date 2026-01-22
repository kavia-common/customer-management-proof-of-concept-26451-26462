export type CustomerStatus = 'Active' | 'Prospect' | 'Inactive';

/**
 * PUBLIC_INTERFACE
 * Customer model used by the Angular frontend.
 *
 * NOTE: This is intentionally flexible while backend endpoints are finalized.
 */
export type Customer = {
  id: number;
  name: string;
  email: string;
  status: CustomerStatus;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

/**
 * PUBLIC_INTERFACE
 * Payload for creating a customer.
 */
export type CreateCustomerRequest = {
  name: string;
  email: string;
  status?: CustomerStatus;
  notes?: string | null;
};

/**
 * PUBLIC_INTERFACE
 * Payload for updating a customer.
 */
export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

/**
 * PUBLIC_INTERFACE
 * Query parameters for listing/searching customers.
 * - q: free-text search
 * - status: filter by status
 * - sortBy/sortDir: sorting
 * - page/pageSize: pagination (optional; backend may ignore for now)
 */
export type CustomersListQuery = {
  q?: string;
  status?: CustomerStatus;
  sortBy?: 'name' | 'email' | 'status' | 'createdAt' | 'updatedAt';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

/**
 * PUBLIC_INTERFACE
 * Generic list response shape (kept optional/loose to avoid blocking while backend stabilizes).
 */
export type ListResponse<T> = {
  items: T[];
  total?: number;
};
