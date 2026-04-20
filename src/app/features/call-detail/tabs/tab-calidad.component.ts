import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleLlamada } from '../../../core/models/domain.models';
import { BarComponent } from '../../../shared/components/bar.component';
import { scoreColor } from '../../../core/services/style.utils';

interface Row {
  key: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-tab-calidad',
  standalone: true,
  imports: [CommonModule, BarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="detail-layout">
      <div>
        <h2 class="section-title">Calidad del agente</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          @for (row of rows(); track row.key) {
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 13px; color: #334155; width: 110px; text-transform: capitalize; font-weight: 500;">{{ row.key }}</span>
              <app-bar [value]="row.value" [color]="row.color" [height]="8" />
              <span
                style="font-size: 13px; font-weight: 700; font-feature-settings: 'tnum'; min-width: 32px; text-align: right;"
                [style.color]="row.color"
              >{{ row.value }}</span>
            </div>
          }
        </div>
        <div
          style="margin-top: 22px; padding: 14px 18px; background: #f0fdf4;
                 border: 1px solid #bbf7d0; border-radius: 10px;
                 display: flex; align-items: center; justify-content: space-between;"
        >
          <span style="font-size: 13px; font-weight: 600; color: #15803d;">Puntuación global</span>
          <span style="font-size: 22px; font-weight: 700; color: #15803d; font-feature-settings: 'tnum';">{{ total() }} / 100</span>
        </div>
      </div>
      <div>
        <h3 class="section-subtitle">Observaciones</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          @for (o of d().observaciones; track $index) {
            <div style="padding: 10px 14px; background: #fff; border: 1px solid #f1f5f9; border-radius: 8px; font-size: 13px; color: #334155; line-height: 1.5;">
              <span style="color: #22c55e; margin-right: 8px; font-weight: 700;">›</span>{{ o }}
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class TabCalidadComponent {
  d = input.required<DetalleLlamada>();

  rows = computed<Row[]>(() =>
    Object.entries(this.d().calidadDims).map(([k, v]) => ({
      key: k,
      value: v as number,
      color: scoreColor(v as number).fg,
    }))
  );

  total = computed<number>(() => {
    const vals = Object.values(this.d().calidadDims);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  });
}
