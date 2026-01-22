import { Routes } from '@angular/router';
import { CustomersPageComponent } from './customers/customers-page.component';
import { CustomerFormPageComponent } from './customers/customer-form-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'customers' },
  { path: 'customers', component: CustomersPageComponent },
  { path: 'customers/new', component: CustomerFormPageComponent },
  { path: 'customers/:id', component: CustomerFormPageComponent },
  { path: '**', redirectTo: 'customers' },
];

