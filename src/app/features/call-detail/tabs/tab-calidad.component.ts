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
    <div>
      <!-- ==================== Puntuación global (cabecera) ==================== -->
      <div
        style="padding: 20px 24px; background: linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%);
               border: 1px solid #bbf7d0; border-radius: 12px; margin-bottom: 22px;
               display: flex; align-items: center; justify-content: space-between; gap: 24px;"
      >
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #15803d; letter-spacing: 0.8px; text-transform: uppercase;">
            Puntuación global
          </div>
          <div style="font-size: 12px; color: #475569; margin-top: 4px;">
            Media ponderada de las 6 dimensiones evaluadas
          </div>
        </div>
        <div style="display: flex; align-items: baseline; gap: 6px;">
          <span
            style="font-size: 48px; font-weight: 700; font-feature-settings: 'tnum'; line-height: 1;"
            [style.color]="globalColor()"
          >{{ totalAgente() }}</span>
          <span style="font-size: 18px; color: #64748b; font-weight: 600;">/ 100</span>
        </div>
      </div>

      <!-- ==================== Columnas: agente (izq) · cliente (der) ==================== -->
      <div class="grid grid--2" style="align-items: start;">

        <!-- ============ IZQUIERDA: Calidad agente + Observaciones ============ -->
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

          <h3 class="section-subtitle" style="margin-top: 26px;">Observaciones</h3>
          <div class="card__subtitle" style="margin-bottom: 12px;">
            Patrones detectados y oportunidades de mejora
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            @for (o of d().observaciones; track $index) {
              <div style="padding: 12px 16px; background: #fff; border: 1px solid #e2e8f0;
                          border-radius: 8px; font-size: 13px; color: #334155; line-height: 1.55;
                          display: flex; gap: 10px; align-items: flex-start;">
                <span style="color: #22c55e; font-weight: 700; flex-shrink: 0; margin-top: 1px;">›</span>
                <span style="flex: 1;">{{ o }}</span>
              </div>
            }
            @if (d().observaciones.length === 0) {
              <div style="padding: 14px; text-align: center; color: #94a3b8; font-size: 12px;">
                Sin observaciones registradas.
              </div>
            }
          </div>
        </div>

        <!-- ============ DERECHA: Calidad cliente (CX) ============ -->
        <div>
          <h2 class="section-title">Calidad del cliente</h2>
          <div class="card__subtitle" style="margin-bottom: 16px;">
            Experiencia percibida por el cliente durante la llamada
          </div>

          <div
            style="padding: 28px 20px; background: #fff; border: 1px solid #e2e8f0;
                   border-radius: 12px; text-align: center;"
          >
            <div style="font-size: 10.5px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase;">
              CX · Customer Experience
            </div>
            <div style="display: flex; align-items: baseline; justify-content: center; gap: 6px; margin-top: 12px;">
              <span
                style="font-size: 64px; font-weight: 700; font-feature-settings: 'tnum'; line-height: 1;"
                [style.color]="cxColor()"
              >{{ d().cx }}</span>
              <span style="font-size: 20px; color: #64748b; font-weight: 600;">/ 100</span>
            </div>
            <div
              style="margin-top: 14px; display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700;"
              [style.background]="cxBadgeBg()"
              [style.color]="cxColor()"
            >{{ cxLabel() }}</div>

            <div style="margin-top: 18px; padding-top: 18px; border-top: 1px dashed #e2e8f0;
                        font-size: 12px; color: #64748b; line-height: 1.6; text-align: left;">
              <b style="color: #334155;">Cómo se interpreta:</b> el CX mide cómo percibió el cliente
              la interacción considerando tono, resolución, espera y satisfacción final. Es una
              valoración global, sin dimensiones desglosadas.
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class TabCalidadComponent {
  d = input.required<DetalleLlamada>();

  readonly rows = computed<Row[]>(() =>
    Object.entries(this.d().calidadDims).map(([k, v]) => ({
      key: k,
      value: v as number,
      color: scoreColor(v as number).fg,
    }))
  );

  readonly totalAgente = computed<number>(() => {
    const vals = Object.values(this.d().calidadDims) as number[];
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  });

  readonly globalColor = computed<string>(() => scoreColor(this.totalAgente()).fg);
  readonly cxColor = computed<string>(() => scoreColor(this.d().cx).fg);

  readonly cxLabel = computed<string>(() => {
    const v = this.d().cx;
    if (v >= 85) return 'Excelente';
    if (v >= 70) return 'Buena';
    if (v >= 55) return 'Aceptable';
    return 'Deficiente';
  });

  readonly cxBadgeBg = computed<string>(() => {
    const v = this.d().cx;
    if (v >= 85) return '#dcfce7';
    if (v >= 70) return '#dbeafe';
    if (v >= 55) return '#fef3c7';
    return '#fee2e2';
  });
}
