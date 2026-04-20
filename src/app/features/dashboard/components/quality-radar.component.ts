import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgenteCalidad, Dims } from '../../../core/models/domain.models';
import { RadarComponent } from '../../../shared/components/radar.component';
import { scoreColor } from '../../../core/services/style.utils';

interface Row {
  key: string;
  agentVal: number;
  teamVal: number;
  diff: number;
  agentColor: string;
}

@Component({
  selector: 'app-quality-radar',
  standalone: true,
  imports: [CommonModule, RadarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; gap: 16px; align-items: flex-start;">
      <!-- Radar izquierda -->
      <div style="flex: none;">
        <app-radar [dims]="agente().dims" [overlay]="promedio()" [size]="210" />
        <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 8px; font-size: 10px; color: #64748b;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 12px; height: 2px; background: #3b82f6; border-radius: 1px;"></span>
            <span><strong style="color: #0f172a;">{{ agente().nombre }}</strong></span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <svg width="12" height="4">
              <line x1="0" y1="2" x2="12" y2="2" stroke="#ef4444" stroke-width="1.6" stroke-dasharray="3 2" />
            </svg>
            <span>Promedio equipo ({{ todos().length }})</span>
          </div>
        </div>
      </div>

      <!-- Tabla derecha -->
      <div style="flex: 1; min-width: 0;">
        <!-- Header -->
        <div
          style="display: grid; grid-template-columns: 1.3fr 0.6fr 0.6fr 0.5fr;
                 padding: 6px 10px; font-size: 10px; color: #64748b; font-weight: 700;
                 text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9;"
        >
          <span>Dimensión</span>
          <span style="text-align: right;">Agente</span>
          <span style="text-align: right;">Equipo</span>
          <span style="text-align: right;">Δ</span>
        </div>

        @for (row of rows(); track row.key; let i = $index; let last = $last) {
          <div
            style="display: grid; grid-template-columns: 1.3fr 0.6fr 0.6fr 0.5fr;
                   padding: 8px 10px; align-items: center; font-size: 12px;"
            [style.borderBottom]="last ? 'none' : '1px solid #f8fafc'"
          >
            <span style="color: #0f172a; font-weight: 600; text-transform: capitalize;">{{ row.key }}</span>
            <span style="text-align: right; font-weight: 700; font-feature-settings: 'tnum';" [style.color]="row.agentColor">{{ row.agentVal }}</span>
            <span style="text-align: right; color: #64748b; font-feature-settings: 'tnum';">{{ row.teamVal }}</span>
            <span
              style="text-align: right; font-weight: 700; font-feature-settings: 'tnum';"
              [style.color]="row.diff >= 0 ? '#15803d' : '#dc2626'"
            >{{ row.diff >= 0 ? '+' : '' }}{{ row.diff }}</span>
          </div>
        }

        <!-- Fila total -->
        <div
          style="display: grid; grid-template-columns: 1.3fr 0.6fr 0.6fr 0.5fr;
                 padding: 8px 10px; align-items: center; font-size: 12px;
                 background: #f8fafc; border-top: 1px solid #f1f5f9;
                 margin-top: 2px; border-radius: 4px;"
        >
          <span style="color: #0f172a; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Media global</span>
          <span style="text-align: right; font-weight: 700; font-feature-settings: 'tnum'; font-size: 13px;" [style.color]="totalAgentColor()">{{ scoreAvg() }}</span>
          <span style="text-align: right; color: #64748b; font-feature-settings: 'tnum'; font-size: 13px;">{{ promAvg() }}</span>
          <span
            style="text-align: right; font-weight: 700; font-feature-settings: 'tnum'; font-size: 13px;"
            [style.color]="globalDiff() >= 0 ? '#15803d' : '#dc2626'"
          >{{ globalDiff() >= 0 ? '+' : '' }}{{ globalDiff() }}</span>
        </div>
      </div>
    </div>
  `,
})
export class QualityRadarComponent {
  agente = input.required<AgenteCalidad>();
  todos = input.required<AgenteCalidad[]>();

  private dimsKeys = computed<(keyof Dims)[]>(
    () => Object.keys(this.agente().dims) as (keyof Dims)[]
  );

  promedio = computed<Dims>(() => {
    const all = this.todos();
    const n = all.length || 1;
    return {
      saludo:     Math.round(all.reduce((acc, a) => acc + a.dims.saludo,     0) / n),
      empatia:    Math.round(all.reduce((acc, a) => acc + a.dims.empatia,    0) / n),
      eficiencia: Math.round(all.reduce((acc, a) => acc + a.dims.eficiencia, 0) / n),
      claridad:   Math.round(all.reduce((acc, a) => acc + a.dims.claridad,   0) / n),
      producto:   Math.round(all.reduce((acc, a) => acc + a.dims.producto,   0) / n),
      cierre:     Math.round(all.reduce((acc, a) => acc + a.dims.cierre,     0) / n),
    };
  });

  rows = computed<Row[]>(() => {
    const ag = this.agente();
    const prom = this.promedio();
    return this.dimsKeys().map((k) => {
      const v = ag.dims[k];
      const avg = prom[k];
      return {
        key: k as string,
        agentVal: v,
        teamVal: avg,
        diff: v - avg,
        agentColor: scoreColor(v).fg,
      };
    });
  });

  scoreAvg = computed<number>(() => {
    const vals = Object.values(this.agente().dims);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  });
  promAvg = computed<number>(() => {
    const vals = Object.values(this.promedio());
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  });
  globalDiff = computed<number>(() => this.scoreAvg() - this.promAvg());
  totalAgentColor = computed<string>(() => scoreColor(this.scoreAvg()).fg);
}
