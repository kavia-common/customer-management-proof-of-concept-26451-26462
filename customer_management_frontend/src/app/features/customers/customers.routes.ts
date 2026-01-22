import { Routes } from '@angular/router';
import { CustomersListPage } from './pages/customers-list/customers-list.page';
import { CustomerDetailPage } from './pages/customer-detail/customer-detail.page';

export const CUSTOMERS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', component: CustomersListPage },
  { path: ':id', component: CustomerDetailPage },
];
