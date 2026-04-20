import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

type Estado = 'A REVISAR' | 'EN REVISIÓN' | 'REVISADO' | 'NO APLICA';

interface EstadoStyle {
  label: string;
  dot: string;
  bg: string;
  fg: string;
}

const MAP: Record<Estado, EstadoStyle> = {
  'A REVISAR':   { label: 'A revisar',   dot: '#f59e0b', bg: '#fffbeb', fg: '#b45309' },
  'EN REVISIÓN': { label: 'En revisión', dot: '#3b82f6', bg: '#eff6ff', fg: '#1d4ed8' },
  'REVISADO':    { label: 'Revisado',    dot: '#22c55e', bg: '#f0fdf4', fg: '#15803d' },
  'NO APLICA':   { label: 'No aplica',   dot: '#94a3b8', bg: '#f8fafc', fg: '#475569' },
};

@Component({
  selector: 'app-estado-tag',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="estado-tag"
      [style.background]="s().bg"
      [style.color]="s().fg"
    >
      <span [style.background]="s().dot" style="width: 6px; height: 6px; border-radius: 999px;"></span>
      {{ s().label }}
    </span>
  `,
})
export class EstadoTagComponent {
  estado = input.required<string>();

  s = computed<EstadoStyle>(() => MAP[(this.estado() as Estado)] ?? MAP['NO APLICA']);
}
