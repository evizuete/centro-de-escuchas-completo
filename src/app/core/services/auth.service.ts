import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

const STORAGE_KEY = 'ce_authed';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  readonly authed = signal<boolean>(
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STORAGE_KEY) === '1'
  );
  readonly authenticating = signal<boolean>(false);

  login(): Promise<void> {
    this.authenticating.set(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        sessionStorage.setItem(STORAGE_KEY, '1');
        this.authed.set(true);
        this.authenticating.set(false);
        this.router.navigate(['/dashboard']);
        resolve();
      }, 900);
    });
  }

  logout(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.authed.set(false);
    this.router.navigate(['/login']);
  }
}
