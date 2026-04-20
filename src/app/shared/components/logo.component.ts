import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 32 32"
      fill="none"
      style="flex: none; display: block;"
    >
      <!-- Tapa del frasco -->
      <rect x="11" y="3" width="10" height="4" rx="0.5" [attr.fill]="color()" />
      <!-- Cuerpo del frasco (relleno suave) -->
      <path
        d="M10 8h12l1 4c2 0 3 1.5 3 3.5v8.5a4 4 0 01-4 4H10a4 4 0 01-4-4V15.5C6 13.5 7 12 9 12l1-4z"
        [attr.fill]="color()"
        fill-opacity="0.25"
      />
      <!-- Cuerpo del frasco (contorno) -->
      <path
        d="M10 8h12l1 4c2 0 3 1.5 3 3.5v8.5a4 4 0 01-4 4H10a4 4 0 01-4-4V15.5C6 13.5 7 12 9 12l1-4z"
        fill="none"
        [attr.stroke]="color()"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <!-- Punto central -->
      <circle cx="16" cy="19" r="2.5" [attr.fill]="color()" />
    </svg>
  `,
})
export class LogoComponent {
  size = input<number>(28);
  color = input<string>('#fff');
}
