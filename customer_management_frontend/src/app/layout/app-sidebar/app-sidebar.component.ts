import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BackendStatusService } from '../../core/services/backend-status.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebarComponent {
  private readonly backendStatus = inject(BackendStatusService);

  /** Exposed for template usage. */
  readonly status = this.backendStatus.status;
  readonly detail = this.backendStatus.detail;

  constructor() {
    // Lightweight initial probe; updates the indicator without blocking UI.
    this.backendStatus.refresh();
  }

  // PUBLIC_INTERFACE
  refreshBackendStatus(): void {
    /** Manually re-check backend reachability. */
    this.backendStatus.refresh();
  }
}
