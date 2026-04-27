import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Pt { x: number; y: number; }

/**
 * Mini-gráfico del arco emocional de una llamada.
 *
 * Por defecto se renderiza con dimensiones fijas (72×22) pensadas para
 * incrustar dentro de filas/listas. Si necesitas que ocupe todo el ancho
 * del contenedor (ej. paneles laterales o tarjetas anchas) pásale
 * `responsive=true` y el SVG se estira con `viewBox` preservando la
 * proporción interna.
 */
@Component({
  selector: 'app-emotion-arc',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
        [attr.width]="responsive() ? '100%' : width()"
        [attr.height]="responsive() ? null : height()"
        [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
        [attr.preserveAspectRatio]="responsive() ? 'none' : 'xMidYMid meet'"
        style="display: block;"
    >
      <path
          [attr.d]="path()"
          fill="none"
          [attr.stroke]="color()"
          stroke-width="1.4"
          stroke-linejoin="round"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
      />
      <circle
          [attr.cx]="last().x"
          [attr.cy]="last().y"
          r="2.2"
          [attr.fill]="endColor()"
          vector-effect="non-scaling-stroke"
      />
    </svg>
  `,
})
export class EmotionArcComponent {
  data = input.required<number[]>();
  width = input<number>(72);
  height = input<number>(22);
  color = input<string>('#3b82f6');
  /** Si true, el SVG ocupa el 100% del contenedor (estira viewBox). */
  responsive = input<boolean>(false);

  points = computed<Pt[]>(() => {
    const d = this.data();
    const w = this.width();
    const h = this.height();
    const max = 100;
    const min = 0;
    return d.map((v, i) => ({
      x: (i / Math.max(1, d.length - 1)) * w,
      y: h - ((v - min) / (max - min)) * (h - 2) - 1,
    }));
  });

  path = computed<string>(() =>
      this.points().map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  );

  last = computed<Pt>(() => {
    const pts = this.points();
    return pts[pts.length - 1] ?? { x: 0, y: 0 };
  });

  endColor = computed<string>(() => {
    const d = this.data();
    const end = d[d.length - 1] ?? 0;
    if (end >= 70) return '#22c55e';
    if (end >= 50) return '#f59e0b';
    return '#ef4444';
  });
}