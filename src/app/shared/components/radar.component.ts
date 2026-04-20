import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dims } from '../../core/models/domain.models';

/** El Radar pinta las 6 dimensiones de calidad estándar. */
export type DimMap = Dims;

interface LabelPt { key: string; x: number; y: number; }
interface PointPt { key: string; x: number; y: number; }
interface GridPoly { points: string; }
interface AxisLine { x1: number; y1: number; x2: number; y2: number; }

@Component({
  selector: 'app-radar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="'0 0 ' + size() + ' ' + size()">
      @for (g of gridPolys(); track $index) {
        <polygon [attr.points]="g.points" fill="none" stroke="#e2e8f0" stroke-width="1" />
      }
      @for (line of axisLines(); track $index) {
        <line [attr.x1]="line.x1" [attr.y1]="line.y1" [attr.x2]="line.x2" [attr.y2]="line.y2" stroke="#e2e8f0" />
      }

      <!-- Overlay (promedio) dibujado primero para que el agente quede encima -->
      @if (overlayPoints()) {
        <polygon
          [attr.points]="overlayPoints()"
          fill="#ef4444"
          fill-opacity="0.10"
          stroke="#ef4444"
          stroke-width="1.4"
          stroke-dasharray="4 3"
        />
      }

      <polygon
        [attr.points]="mainPoints()"
        fill="#3b82f6"
        fill-opacity="0.22"
        stroke="#3b82f6"
        stroke-width="1.8"
      />

      @for (p of mainDots(); track p.key) {
        <circle [attr.cx]="p.x" [attr.cy]="p.y" r="2.5" fill="#3b82f6" />
      }

      @if (overlay()) {
        @for (p of overlayDots(); track p.key) {
          <circle [attr.cx]="p.x" [attr.cy]="p.y" r="2" fill="#ef4444" />
        }
      }

      @for (lbl of labels(); track lbl.key) {
        <text
          [attr.x]="lbl.x"
          [attr.y]="lbl.y"
          text-anchor="middle"
          dominant-baseline="central"
          font-size="10"
          fill="#475569"
          font-weight="600"
          style="text-transform: capitalize;"
        >{{ lbl.key }}</text>
      }
    </svg>
  `,
})
export class RadarComponent {
  dims = input.required<DimMap>();
  overlay = input<DimMap | null>(null);
  size = input<number>(220);
  max = input<number>(100);

  // Vista como record indexable por string (internamente)
  private dimsRec = computed<Record<string, number>>(() => this.dims() as unknown as Record<string, number>);
  private overlayRec = computed<Record<string, number> | null>(() => {
    const o = this.overlay();
    return o ? (o as unknown as Record<string, number>) : null;
  });

  private keys = computed<string[]>(() => Object.keys(this.dimsRec()));

  private cx = computed<number>(() => this.size() / 2);
  private cy = computed<number>(() => this.size() / 2);
  private radius = computed<number>(() => this.size() / 2 - 34);

  private angle(i: number): number {
    return (Math.PI * 2 * i) / this.keys().length - Math.PI / 2;
  }

  private pt(i: number, v: number): [number, number] {
    const a = this.angle(i);
    const r = this.radius() * (v / this.max());
    return [this.cx() + Math.cos(a) * r, this.cy() + Math.sin(a) * r];
  }

  gridPolys = computed<GridPoly[]>(() => {
    const levels = [0.25, 0.5, 0.75, 1];
    return levels.map((g) => {
      const pts = this.keys()
        .map((_, j) => this.pt(j, this.max() * g).join(','))
        .join(' ');
      return { points: pts };
    });
  });

  axisLines = computed<AxisLine[]>(() =>
    this.keys().map((_, i) => {
      const [x2, y2] = this.pt(i, this.max());
      return { x1: this.cx(), y1: this.cy(), x2, y2 };
    })
  );

  mainPoints = computed<string>(() => {
    const rec = this.dimsRec();
    return this.keys()
      .map((k, i) => this.pt(i, rec[k] ?? 0).join(','))
      .join(' ');
  });

  mainDots = computed<PointPt[]>(() => {
    const rec = this.dimsRec();
    return this.keys().map((k, i) => {
      const [x, y] = this.pt(i, rec[k] ?? 0);
      return { key: k, x, y };
    });
  });

  overlayPoints = computed<string | null>(() => {
    const o = this.overlayRec();
    if (!o) return null;
    return this.keys()
      .map((k, i) => this.pt(i, o[k] ?? 0).join(','))
      .join(' ');
  });

  overlayDots = computed<PointPt[]>(() => {
    const o = this.overlayRec();
    if (!o) return [];
    return this.keys().map((k, i) => {
      const [x, y] = this.pt(i, o[k] ?? 0);
      return { key: k, x, y };
    });
  });

  labels = computed<LabelPt[]>(() =>
    this.keys().map((k, i) => {
      const [x, y] = this.pt(i, this.max() * 1.18);
      return { key: k, x, y };
    })
  );
}
