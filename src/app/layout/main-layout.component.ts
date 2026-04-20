import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app">
      <app-sidebar />
      <main>
        <router-outlet />
      </main>
    </div>
  `,
})
export class MainLayoutComponent {}
