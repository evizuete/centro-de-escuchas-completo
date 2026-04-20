import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, IconName } from '../../shared/components/icon.component';
import { LogoComponent } from '../../shared/components/logo.component';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar">
      <div class="sidebar__brand">
        <app-logo [size]="28" [color]="'#fff'" />
        <div style="display: flex; flex-direction: column; line-height: 1;">
          <span class="sidebar__brand-title" style="font-family: Georgia, serif; letter-spacing: 1px;">YODEYMA</span>
          <span class="sidebar__brand-sub">Centro de escucha</span>
        </div>
      </div>

      <nav class="sidebar__nav">
        @for (item of items; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="sidebar__item--active"
            class="sidebar__item"
          >
            <app-icon [name]="item.icon" [size]="18" />
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="sidebar__footer">
        <button class="sidebar__item">
          <app-icon name="help" [size]="18" />
          <span>Ayuda</span>
        </button>
        <button class="sidebar__item" (click)="logout()">
          <app-icon name="logout" [size]="18" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private auth = inject(AuthService);

  readonly items: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/llamadas', label: 'Llamadas', icon: 'phone' },
    { path: '/supervisores', label: 'Supervisores', icon: 'users' },
  ];

  logout(): void {
    this.auth.logout();
  }
}
