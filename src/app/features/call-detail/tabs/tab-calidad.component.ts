import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DetalleLlamada,
  Observacion,
  ObservacionDimension,
} from '../../../core/models/domain.models';
import { BarComponent } from '../../../shared/components/bar.component';
import { scoreColor } from '../../../core/services/style.utils';

interface DimensionRow {
  key: string;
  label: string;
  value: number;
  color: string;
}

// Mapeo de claves de CalidadDimsCall a dimensiones del backend. La BD usa
// "conocimiento" pero los momentos del LLM emiten "producto". Los unificamos
// para que el hover entre observación y barra funcione en ambos sentidos.
const DIM_ALIASES: Record<string, ObservacionDimension> = {
  saludo: 'saludo',
  empatia: 'empatia',
  eficiencia: 'eficiencia',
  claridad: 'claridad',
  conocimiento: 'producto',
  producto: 'producto',
  cierre: 'cierre',
};

// Label visible de cada dimensión
const DIM_LABELS: Record<string, string> = {
  saludo: 'Saludo',
  empatia: 'Empatía',
  eficiencia: 'Eficiencia',
  claridad: 'Claridad',
  conocimiento: 'Conocimiento',
  producto: 'Producto',
  cierre: 'Cierre',
};

@Component({
  selector: 'app-tab-calidad',
  standalone: true,
  imports: [CommonModule, BarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    /* Layout desktop: 3 columnas (coaching + coaching + dimensiones) */
    .tab-calidad__grid {
      display: grid;
      grid-template-columns: 1fr 1fr 260px;
      gap: 20px;
      align-items: start;
    }

    /* Pantallas pequeñas: dimensiones arriba a ancho completo,
       coaching debajo en 2 columnas.
       El orden lo forzamos con CSS grid areas. */
    @media (max-width: 1199px) {
      .tab-calidad__grid {
        grid-template-columns: 1fr 1fr;
        grid-template-areas:
          "dims   dims"
          "pos    mej";
      }
      .tab-calidad__col-pos  { grid-area: pos; }
      .tab-calidad__col-mej  { grid-area: mej; }
      .tab-calidad__col-dims { grid-area: dims; }
    }

    /* Móvil: todo apilado */
    @media (max-width: 640px) {
      .tab-calidad__grid {
        grid-template-columns: 1fr;
        grid-template-areas:
          "dims"
          "pos"
          "mej";
      }
    }

    /* Default desktop: dimensiones apiladas verticalmente en columna estrecha */
    .tab-calidad__dims-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* En modo apilado (dimensiones arriba ancho completo), las 6
       filas de dimensiones pasan a formato horizontal compacto */
    @media (max-width: 1199px) {
      .tab-calidad__dims-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px 20px;
      }
    }
    @media (max-width: 640px) {
      .tab-calidad__dims-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `],
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

      <!-- ========== 3 columnas: positivas (1fr) · mejoras (1fr) · dimensiones (260px) ========== -->
      <!-- En <1200px pasa a 2 cols con dimensiones arriba a ancho completo -->
      <div class="tab-calidad__grid">

        <!-- ============ COLUMNA 1: Qué hizo bien ============ -->
        <div class="tab-calidad__col-pos">
          <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px;">
            <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">
              Qué hizo bien
            </h2>
            <span
              style="padding: 2px 9px; border-radius: 999px; font-size: 11px;
                     font-weight: 700; font-feature-settings: 'tnum';
                     background: #dcfce7; color: #15803d;"
            >{{ positivas().length }}</span>
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 14px;">
            Técnicas aplicadas correctamente
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            @for (o of positivas(); track $index) {
              <div
                (mouseenter)="highlightDim.set(o.dimension)"
                (mouseleave)="highlightDim.set(null)"
                style="padding: 14px 16px; background: #fff; border: 1px solid #e2e8f0;
                       border-radius: 10px; border-left: 3px solid #22c55e;
                       transition: border-color 0.15s, transform 0.12s;"
                [style.transform]="highlightDim() === o.dimension ? 'translateX(2px)' : 'none'"
              >
                <div style="display: flex; align-items: baseline; justify-content: space-between;
                            gap: 10px; margin-bottom: 6px;">
                  <div style="font-size: 13px; font-weight: 600; color: #0f172a;">
                    {{ o.title }}
                  </div>
                  <span
                    style="padding: 2px 7px; border-radius: 4px; font-size: 10px;
                           font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase;
                           background: #f1f5f9; color: #64748b; flex-shrink: 0;"
                  >{{ dimLabel(o.dimension) }}</span>
                </div>
                <div style="font-size: 13px; color: #475569; line-height: 1.55;">
                  {{ o.detail }}
                </div>
              </div>
            }
            @if (positivas().length === 0) {
              <div style="padding: 28px 16px; text-align: center; color: #94a3b8; font-size: 12px;
                          background: #fafafa; border: 1px dashed #e2e8f0; border-radius: 10px;">
                Sin observaciones positivas destacadas.
              </div>
            }
          </div>
        </div>

        <!-- ============ COLUMNA 2: Oportunidades de mejora ============ -->
        <div class="tab-calidad__col-mej">
          <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px;">
            <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">
              Oportunidades de mejora
            </h2>
            <span
              style="padding: 2px 9px; border-radius: 999px; font-size: 11px;
                     font-weight: 700; font-feature-settings: 'tnum';
                     background: #fef3c7; color: #b45309;"
            >{{ mejoras().length }}</span>
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 14px;">
            Patrones a trabajar en próximas llamadas
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            @for (o of mejoras(); track $index) {
              <div
                (mouseenter)="highlightDim.set(o.dimension)"
                (mouseleave)="highlightDim.set(null)"
                style="padding: 14px 16px; background: #fff; border: 1px solid #e2e8f0;
                       border-radius: 10px; border-left: 3px solid #f59e0b;
                       transition: border-color 0.15s, transform 0.12s;"
                [style.transform]="highlightDim() === o.dimension ? 'translateX(2px)' : 'none'"
              >
                <div style="display: flex; align-items: baseline; justify-content: space-between;
                            gap: 10px; margin-bottom: 6px;">
                  <div style="font-size: 13px; font-weight: 600; color: #0f172a;">
                    {{ o.title }}
                  </div>
                  <span
                    style="padding: 2px 7px; border-radius: 4px; font-size: 10px;
                           font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase;
                           background: #f1f5f9; color: #64748b; flex-shrink: 0;"
                  >{{ dimLabel(o.dimension) }}</span>
                </div>
                <div style="font-size: 13px; color: #475569; line-height: 1.55;">
                  {{ o.detail }}
                </div>
              </div>
            }
            @if (mejoras().length === 0) {
              <div style="padding: 28px 16px; text-align: center; color: #94a3b8; font-size: 12px;
                          background: #fafafa; border: 1px dashed #e2e8f0; border-radius: 10px;">
                Sin oportunidades de mejora detectadas. ¡Buen trabajo!
              </div>
            }
          </div>
        </div>

        <!-- ============ COLUMNA 3: Dimensiones (estrecha en desktop, ancha arriba en tablet) ============ -->
        <div class="tab-calidad__col-dims">
          <div style="margin-bottom: 6px;">
            <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">
              Dimensiones
            </h2>
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 14px;">
            Desglose de calidad
          </div>
          <div
            style="padding: 14px 14px; background: #fff; border: 1px solid #e2e8f0;
                   border-radius: 10px;"
          >
            <div class="tab-calidad__dims-grid">
              @for (row of rows(); track row.key) {
                <div
                  style="padding: 6px 8px; border-radius: 6px; transition: background 0.15s;"
                  [style.background]="isDimHighlighted(row.key) ? '#fef3c7' : 'transparent'"
                >
                  <div style="display: flex; align-items: baseline; justify-content: space-between;
                              margin-bottom: 4px;">
                    <span style="font-size: 12px; color: #334155; font-weight: 500;">
                      {{ row.label }}
                    </span>
                    <span
                      style="font-size: 13px; font-weight: 700; font-feature-settings: 'tnum';"
                      [style.color]="row.color"
                    >{{ row.value }}</span>
                  </div>
                  <app-bar [value]="row.value" [color]="row.color" [height]="6" />
                </div>
              }
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class TabCalidadComponent {
  d = input.required<DetalleLlamada>();

  /** Dimensión destacada al hacer hover sobre una observación. */
  readonly highlightDim = signal<ObservacionDimension | null>(null);

  readonly rows = computed<DimensionRow[]>(() =>
      Object.entries(this.d().calidadDims).map(([k, v]) => ({
        key: k,
        label: DIM_LABELS[k] ?? k,
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

  /** Observaciones positivas (aplicó correctamente X). */
  readonly positivas = computed<Observacion[]>(() =>
      (this.d().observaciones || []).filter((o: Observacion) => o.kind === 'positive')
  );

  /** Observaciones de mejora (oportunidades). */
  readonly mejoras = computed<Observacion[]>(() =>
      (this.d().observaciones || []).filter((o: Observacion) => o.kind === 'improvement')
  );

  /** Label visible de una dimensión. */
  dimLabel(dim: string): string {
    return DIM_LABELS[dim] ?? dim;
  }

  /**
   * True si la dimensión de esta fila se corresponde con la que está
   * destacada actualmente (la del hover sobre una observación).
   *
   * Maneja el caso producto/conocimiento: el backend emite "producto" en
   * las observaciones pero la tabla muestra "conocimiento".
   */
  isDimHighlighted(rowKey: string): boolean {
    const current = this.highlightDim();
    if (!current) return false;
    const rowAlias = DIM_ALIASES[rowKey] ?? rowKey;
    return rowAlias === current;
  }
}