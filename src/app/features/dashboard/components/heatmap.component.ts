import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type HeatmapView = 'sentimiento' | 'volumen' | 'riesgo';

@Component({
  selector: 'app-heatmap',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <!-- Header de horas -->
      <div style="display: grid; grid-template-columns: 32px repeat(12, 1fr); gap: 3px; align-items: center;">
        <div></div>
        @for (h of hours; track h) {
          <div style="font-size: 9px; color: #94a3b8; text-align: center;">{{ h }}</div>
        }
      </div>

      @for (day of days; track day; let di = $index) {
        <div style="display: grid; grid-template-columns: 32px repeat(12, 1fr); gap: 3px; align-items: center;">
          <div style="font-size: 10px; color: #64748b; font-weight: 600;">{{ day }}</div>
          @for (v of data()[di]; track $index; let hi = $index) {
            <div
              [title]="day + ' ' + hours[hi] + ':00 · ' + v"
              [style.background]="colorFor(v)"
              style="aspect-ratio: 1 / 1; border-radius: 3px; cursor: pointer;"
            ></div>
          }
        </div>
      }

      <!-- Leyenda -->
      <div style="display: flex; gap: 10px; margin-top: 10px; align-items: center; font-size: 11px; color: #64748b;">
        <span>Menos</span>
        <div style="display: flex; gap: 2px;">
          @for (v of legendValues; track v) {
            <div [style.background]="colorFor(v)" style="width: 14px; height: 14px; border-radius: 3px;"></div>
          }
        </div>
        <span>Más</span>
        <span style="margin-left: auto; color: #94a3b8;">Detectado: viernes tarde con tensión</span>
      </div>
    </div>
  `,
})
export class HeatmapComponent {
  data = input.required<number[][]>();
  view = input<HeatmapView>('sentimiento');

  readonly days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly hours = ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'];
  readonly legendValues = [30, 55, 70, 82, 92];

  colorFor(v: number): string {
    const view = this.view();
    if (view === 'sentimiento') {
      if (v >= 80) return '#22c55e';
      if (v >= 70) return '#86efac';
      if (v >= 60) return '#fde68a';
      if (v >= 45) return '#fdba74';
      return '#fca5a5';
    }
    if (view === 'volumen') {
      const op = Math.min(1, v / 95);
      return `rgba(59, 130, 246, ${op})`;
    }
    // riesgo
    const inv = 100 - v;
    if (inv >= 40) return '#dc2626';
    if (inv >= 25) return '#f97316';
    if (inv >= 15) return '#fbbf24';
    return '#e2e8f0';
  }
}
