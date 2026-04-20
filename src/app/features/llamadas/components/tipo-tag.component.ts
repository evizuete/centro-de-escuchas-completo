import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-tipo-tag',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tipo()) {
      <span
        style="display: inline-flex; align-items: center; gap: 4px; line-height: 1.2;"
        [style.fontSize.px]="size() === 'sm' ? 10 : 11"
      >
        <span
          [style.background]="color() + '18'"
          [style.color]="color()"
          style="font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase;
                 padding: 2px 6px; border-radius: 3px;"
        >{{ tipo() }}</span>
        @if (subcategoria()) {
          <span style="color: #64748b; font-weight: 500;">{{ subcategoria() }}</span>
        }
      </span>
    }
  `,
})
export class TipoTagComponent {
  private data = inject(DataService);

  tipo = input<string | null>(null);
  subcategoria = input<string | null>(null);
  size = input<'sm' | 'md'>('sm');

  color = computed<string>(() => this.data.getTipoColor(this.tipo() ?? ''));
}
