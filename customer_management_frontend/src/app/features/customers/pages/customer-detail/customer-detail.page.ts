import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

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

  readonly id = computed(() => Number(this.route.snapshot.paramMap.get('id') ?? NaN));
}
