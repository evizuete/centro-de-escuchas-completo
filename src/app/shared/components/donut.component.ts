import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DrawSeg {
  color: string;
  length: number;
  offset: number;
}

@Component({
  selector: 'app-donut',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="'0 0 ' + size() + ' ' + size()" style="display: block;">
      <circle
        [attr.cx]="cx()"
        [attr.cy]="cx()"
        [attr.r]="r()"
        fill="none"
        stroke="#f1f5f9"
        [attr.stroke-width]="thickness()"
      />
      @for (seg of drawSegments(); track $index) {
        <circle
          [attr.cx]="cx()"
          [attr.cy]="cx()"
          [attr.r]="r()"
          fill="none"
          [attr.stroke]="seg.color"
          [attr.stroke-width]="thickness()"
          [attr.stroke-dasharray]="seg.length + ' ' + (circumference() - seg.length)"
          [attr.stroke-dashoffset]="-seg.offset"
          [attr.transform]="'rotate(-90 ' + cx() + ' ' + cx() + ')'"
        />
      }
      <text
        [attr.x]="cx()" [attr.y]="cx() - 2"
        text-anchor="middle" font-size="22" font-weight="700" fill="#0f172a" font-family="inherit">{{ total() }}%</text>
      <text
        [attr.x]="cx()" [attr.y]="cx() + 14"
        text-anchor="middle" font-size="10" fill="#64748b" font-weight="500" letter-spacing="0.5">SENTIMIENTO</text>
    </svg>
  `,
})
export class DonutComponent {
  segments = input.required<DonutSegment[]>();
  size = input<number>(160);
  thickness = input<number>(22);

  cx = computed<number>(() => this.size() / 2);
  r = computed<number>(() => (this.size() - this.thickness()) / 2);
  circumference = computed<number>(() => 2 * Math.PI * this.r());
  total = computed<number>(() => this.segments().reduce((a, s) => a + s.value, 0));

  drawSegments = computed<DrawSeg[]>(() => {
    const total = this.total() || 1;
    const c = this.circumference();
    let offset = 0;
    return this.segments().map((s) => {
      const length = (s.value / total) * c;
      const out: DrawSeg = { color: s.color, length, offset };
      offset += length;
      return out;
    });
  });
}
