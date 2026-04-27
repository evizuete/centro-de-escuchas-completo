import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tendencias } from '../../../core/models/domain.models';

interface Series {
  key: string;
  label: string;
  color: string;
  data: number[];
  path: string;
  dots: { x: number; y: number }[];
  last: number;
}

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <svg width="100%" [attr.height]="H" [attr.viewBox]="'0 0 ' + W + ' ' + H" preserveAspectRatio="none" style="display: block;">
        @for (v of gridY; track v) {
          <g>
            <line [attr.x1]="pad.l" [attr.x2]="W - pad.r" [attr.y1]="y(v)" [attr.y2]="y(v)" stroke="#f1f5f9" />
            <text [attr.x]="pad.l - 6" [attr.y]="y(v) + 3" text-anchor="end" font-size="9" fill="#94a3b8">{{ v }}</text>
          </g>
        }
        @for (w of weeks(); track $index; let i = $index) {
          <text [attr.x]="x(i)" [attr.y]="H - 8" text-anchor="middle" font-size="10" fill="#64748b">{{ w }}</text>
        }
        @for (s of series(); track s.key) {
          <g>
            <path [attr.d]="s.path" fill="none" [attr.stroke]="s.color" stroke-width="2" stroke-linejoin="round" />
            @for (d of s.dots; track $index) {
              <circle [attr.cx]="d.x" [attr.cy]="d.y" r="3" fill="#fff" [attr.stroke]="s.color" stroke-width="1.8" />
            }
          </g>
        }
      </svg>
      <div style="display: flex; gap: 14px; margin-top: 8px; flex-wrap: wrap;">
        @for (s of series(); track s.key) {
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
            <span [style.background]="s.color" style="width: 10px; height: 2px; border-radius: 2px;"></span>
            <span style="color: #475569; font-weight: 500;">{{ s.label }}</span>
            <span style="color: #0f172a; font-weight: 700; font-feature-settings: 'tnum';">{{ s.last }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class TrendChartComponent {
  data = input.required<Tendencias>();

  readonly W = 420;
  readonly H = 160;
  readonly pad = { l: 30, r: 10, t: 10, b: 26 };
  readonly gridY = [60, 70, 80, 90];

  /**
   * Etiquetas dinámicas: las últimas N semanas ISO contando hacia atrás
   * desde hoy. Depende del length del array de `score` en `data()` para
   * que si el backend devuelve 3, 4 o 5 puntos, las etiquetas coincidan.
   */
  readonly weeks = computed<string[]>(() => {
    const n = this.data().score.length || 4;
    const today = new Date();
    const out: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - 7 * i);
      out.push(`Sem ${this.isoWeek(d)}`);
    }
    return out;
  });

  /** Número de semana ISO 8601 (1-53). */
  private isoWeek(d: Date): number {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const diff = target.valueOf() - firstThursday.valueOf();
    return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
  }

  private readonly min = 60;
  private readonly max = 90;

  x(i: number): number {
    // Distribuye uniformemente los puntos sobre el rango. `n-1` evita div/0
    // cuando sólo hay 1 punto.
    const n = this.data().score.length || 1;
    const denom = Math.max(1, n - 1);
    return this.pad.l + (i / denom) * (this.W - this.pad.l - this.pad.r);
  }
  y(v: number): number {
    return this.pad.t + (1 - (v - this.min) / (this.max - this.min)) * (this.H - this.pad.t - this.pad.b);
  }

  series = computed<Series[]>(() => {
    const d = this.data();
    const defs: { key: keyof Tendencias; label: string; color: string }[] = [
      { key: 'score', label: 'Score', color: '#3b82f6' },
      { key: 'cx', label: 'Exp. cliente', color: '#8b5cf6' },
      { key: 'sentimiento', label: 'Sentimiento', color: '#10b981' },
    ];
    return defs.map((def) => {
      const arr = d[def.key];
      const dots = arr.map((v, i) => ({ x: this.x(i), y: this.y(v) }));
      const path = dots.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
      return {
        key: def.key,
        label: def.label,
        color: def.color,
        data: arr,
        path,
        dots,
        last: arr[arr.length - 1] ?? 0,
      };
    });
  });
}