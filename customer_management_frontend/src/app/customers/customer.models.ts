export interface CustomerDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PagedCustomersResponse {
  items: CustomerDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {}
