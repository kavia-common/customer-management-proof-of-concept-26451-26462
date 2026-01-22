import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type CustomerListItem = {
  id: number;
  name: string;
  email: string;
  status: 'Active' | 'Prospect';
};

@Component({
  selector: 'app-customers-list-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './customers-list.page.html',
  styleUrl: './customers-list.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersListPage {
  // Placeholder data for layout verification. Will be replaced once backend services are wired.
  readonly customers: CustomerListItem[] = [
    { id: 1, name: 'Acme Corp', email: 'ops@acme.example', status: 'Active' },
    { id: 2, name: 'Blue Harbor LLC', email: 'hello@blueharbor.example', status: 'Prospect' },
    { id: 3, name: 'Nimbus Systems', email: 'billing@nimbus.example', status: 'Active' },
  ];
}
