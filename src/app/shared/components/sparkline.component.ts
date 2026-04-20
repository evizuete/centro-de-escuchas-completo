import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Pt { x: number; y: number; }

@Component({
  selector: 'app-sparkline',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="width()" [attr.height]="height()" style="display: block;">
      @if (fill()) {
        <path [attr.d]="fillPath()" [attr.fill]="color()" opacity="0.12" />
      }
      <path
        [attr.d]="path()"
        fill="none"
        [attr.stroke]="color()"
        stroke-width="1.8"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <circle [attr.cx]="last().x" [attr.cy]="last().y" r="2.5" [attr.fill]="color()" />
      @if (showDots()) {
        @for (p of points(); track $index) {
          <circle [attr.cx]="p.x" [attr.cy]="p.y" r="2" fill="#fff" [attr.stroke]="color()" stroke-width="1.6" />
        }
      }
    </svg>
  `,
})
export class SparklineComponent {
  data = input.required<number[]>();
  width = input<number>(120);
  height = input<number>(32);
  color = input<string>('#3b82f6');
  fill = input<boolean>(true);
  showDots = input<boolean>(false);

  points = computed<Pt[]>(() => {
    const d = this.data();
    if (!d.length) return [];
    const max = Math.max(...d);
    const min = Math.min(...d);
    const range = max - min || 1;
    const w = this.width();
    const h = this.height();
    return d.map((v, i) => ({
      x: (i / Math.max(1, d.length - 1)) * w,
      y: h - ((v - min) / range) * (h - 4) - 2,
    }));
  });

  path = computed<string>(() =>
    this.points().map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  );

  fillPath = computed<string>(() => {
    const pts = this.points();
    if (!pts.length) return '';
    return `${this.path()} L${this.width()},${this.height()} L0,${this.height()} Z`;
  });

  last = computed<Pt>(() => {
    const pts = this.points();
    return pts[pts.length - 1] ?? { x: 0, y: 0 };
  });
}
