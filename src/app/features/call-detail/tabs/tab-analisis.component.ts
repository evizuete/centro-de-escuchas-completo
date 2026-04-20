import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleLlamada } from '../../../core/models/domain.models';
import { BarComponent } from '../../../shared/components/bar.component';
import { TagComponent } from '../../../shared/components/tag.component';

@Component({
  selector: 'app-tab-analisis',
  standalone: true,
  imports: [CommonModule, BarComponent, TagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="section-title">Análisis de la llamada</h2>

      @if (d().analisis; as a) {
        <div class="grid grid--3">
          <!-- Calidad de audio -->
          @if (hasAudio()) {
            <div class="card">
              <div class="aside-block__title">CALIDAD DE AUDIO — SNR</div>
              @if (a.audio.snr_agente_db != null) {
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                  <span style="color: #1d4ed8; font-weight: 600; font-size: 13px;">Agente</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 700; font-size: 14px; font-feature-settings: 'tnum';">{{ a.audio.snr_agente_db!.toFixed(1) }} dB</span>
                    <app-tag [variant]="snrVariant(a.audio.snr_agente_db)">{{ snrLabel(a.audio.snr_agente_db) }}</app-tag>
                  </div>
                </div>
              }
              @if (a.audio.snr_cliente_db != null) {
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;"
                     [style.borderTop]="a.audio.snr_agente_db != null ? '1px solid #f1f5f9' : null">
                  <span style="color: #15803d; font-weight: 600; font-size: 13px;">Cliente</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 700; font-size: 14px; font-feature-settings: 'tnum';">{{ a.audio.snr_cliente_db!.toFixed(1) }} dB</span>
                    <app-tag [variant]="snrVariant(a.audio.snr_cliente_db)">{{ snrLabel(a.audio.snr_cliente_db) }}</app-tag>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Distribución del habla -->
          @if (hasHabla()) {
            <div class="card">
              <div class="aside-block__title">DISTRIBUCIÓN DEL HABLA</div>
              <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                @if (a.habla.agente_pct != null) {
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 12px; color: #1d4ed8; width: 60px; font-weight: 600;">Agente</span>
                    <app-bar [value]="a.habla.agente_pct" color="#3b82f6" />
                    <span style="font-size: 12px; font-weight: 700; min-width: 32px; text-align: right; font-feature-settings: 'tnum';">{{ a.habla.agente_pct }}%</span>
                  </div>
                }
                @if (a.habla.cliente_pct != null) {
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 12px; color: #15803d; width: 60px; font-weight: 600;">Cliente</span>
                    <app-bar [value]="a.habla.cliente_pct" color="#22c55e" />
                    <span style="font-size: 12px; font-weight: 700; min-width: 32px; text-align: right; font-feature-settings: 'tnum';">{{ a.habla.cliente_pct }}%</span>
                  </div>
                }
                @if (a.habla.silencio_pct != null) {
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 12px; color: #64748b; width: 60px; font-weight: 600;">Silencio</span>
                    <app-bar [value]="a.habla.silencio_pct" color="#94a3b8" />
                    <span style="font-size: 12px; font-weight: 700; min-width: 32px; text-align: right; font-feature-settings: 'tnum';">{{ a.habla.silencio_pct }}%</span>
                  </div>
                }
                @if (a.habla.double_talk_pct != null) {
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 12px; color: #b45309; width: 60px; font-weight: 600;">Solape</span>
                    <app-bar [value]="a.habla.double_talk_pct" color="#f59e0b" />
                    <span style="font-size: 12px; font-weight: 700; min-width: 32px; text-align: right; font-feature-settings: 'tnum';">{{ a.habla.double_talk_pct }}%</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Tiempos operativos -->
          @if (hasTiempos()) {
            <div class="card">
              <div class="aside-block__title">TIEMPOS OPERATIVOS</div>
              <div style="display: flex; gap: 16px; margin-top: 10px; flex-wrap: wrap;">
                @if (a.tiempos.cola_s != null) {
                  <div>
                    <div style="font-size: 22px; font-weight: 700; color: #0f172a; font-feature-settings: 'tnum';">{{ fmtSeconds(a.tiempos.cola_s) }}</div>
                    <div style="font-size: 11px; color: #64748b;">Tiempo en cola</div>
                    <app-tag [variant]="queueVariant(a.tiempos.cola_s)">{{ queueLabel(a.tiempos.cola_s) }}</app-tag>
                  </div>
                }
                @if (a.tiempos.espera_s != null) {
                  <div>
                    <div style="font-size: 22px; font-weight: 700; color: #0f172a; font-feature-settings: 'tnum';">{{ fmtSeconds(a.tiempos.espera_s) }}</div>
                    <div style="font-size: 11px; color: #64748b;">
                      En espera
                      @if (a.tiempos.hold_count != null && a.tiempos.hold_count > 0) {
                        ({{ a.tiempos.hold_count }}×)
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Riesgos detectados -->
        @if (hasRiesgos()) {
          <h3 class="section-subtitle" style="margin-top: 22px;">Riesgos detectados</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            @for (r of riesgosRows(); track r.key) {
              <div class="card" [style.borderLeft]="'3px solid ' + r.color">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 2px;">{{ r.label }}</div>
                    <div style="font-size: 12px; color: #64748b;">{{ r.desc }}</div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 22px; font-weight: 700; font-feature-settings: 'tnum';"
                          [style.color]="r.color">{{ r.value }}</span>
                    <app-tag [variant]="r.variant">{{ r.tagLabel }}</app-tag>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        @if (!hasAudio() && !hasHabla() && !hasTiempos() && !hasRiesgos()) {
          <div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">
            Sin datos de análisis operativo disponibles para esta llamada.
          </div>
        }
      } @else {
        <div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">
          Análisis no disponible para esta llamada.
        </div>
      }
    </div>
  `,
})
export class TabAnalisisComponent {
  d = input.required<DetalleLlamada>();

  /** Hay al menos un SNR para pintar el bloque de audio. */
  readonly hasAudio = computed<boolean>(() => {
    const au = this.d().analisis?.audio;
    return !!au && (au.snr_agente_db != null || au.snr_cliente_db != null);
  });
  readonly hasHabla = computed<boolean>(() => {
    const h = this.d().analisis?.habla;
    return !!h && (h.agente_pct != null || h.cliente_pct != null ||
                   h.silencio_pct != null || h.double_talk_pct != null);
  });
  readonly hasTiempos = computed<boolean>(() => {
    const t = this.d().analisis?.tiempos;
    return !!t && (t.cola_s != null || t.espera_s != null);
  });
  readonly hasRiesgos = computed<boolean>(() => {
    const r = this.d().analisis?.riesgos;
    return !!r && (r.churn != null || r.complaint != null || r.escalation != null);
  });

  /** Filas de riesgo para el bloque, solo las que tienen valor. */
  readonly riesgosRows = computed(() => {
    const r = this.d().analisis?.riesgos;
    if (!r) return [];
    const out: {
      key: string; label: string; desc: string; value: number;
      color: string; variant: 'red' | 'amber' | 'blue' | 'green'; tagLabel: string;
    }[] = [];
    const push = (key: string, label: string, desc: string, v: number | null) => {
      if (v == null) return;
      const { color, variant, tagLabel } = riskStyle(v);
      out.push({ key, label, desc, value: v, color, variant, tagLabel });
    };
    push('churn', 'Churn', 'Riesgo de pérdida del cliente', r.churn);
    push('complaint', 'Reclamación', 'Probabilidad de reclamación formal', r.complaint);
    push('escalation', 'Escalación', 'Probabilidad de escalado a supervisor', r.escalation);
    return out;
  });

  /** Etiqueta cualitativa del SNR — umbrales de telefonía típicos. */
  snrLabel(db: number | null): string {
    if (db == null) return '—';
    if (db >= 20) return 'Muy buena';
    if (db >= 15) return 'Buena';
    if (db >= 10) return 'Aceptable';
    return 'Deficiente';
  }
  snrVariant(db: number | null): 'green' | 'amber' | 'red' {
    if (db == null || db >= 15) return 'green';
    if (db >= 10) return 'amber';
    return 'red';
  }

  /** Tiempo en cola: <30s normal, 30-60 elevado, >60 alto. */
  queueLabel(s: number): string {
    if (s < 30) return 'Normal';
    if (s < 60) return 'Elevado';
    return 'Alto';
  }
  queueVariant(s: number): 'green' | 'amber' | 'red' {
    if (s < 30) return 'green';
    if (s < 60) return 'amber';
    return 'red';
  }

  /** Segundos → "mm:ss" o "Ns" si <60s. */
  fmtSeconds(s: number): string {
    const total = Math.round(s);
    if (total < 60) return `${total}s`;
    const m = Math.floor(total / 60);
    const rem = total % 60;
    return `${m}:${String(rem).padStart(2, '0')}`;
  }
}

/** Estilo asociado a un riesgo 0-100 (criterio conservador). */
function riskStyle(v: number): { color: string; variant: 'red' | 'amber' | 'blue' | 'green'; tagLabel: string } {
  if (v >= 70) return { color: '#dc2626', variant: 'red',   tagLabel: 'ALTA'  };
  if (v >= 40) return { color: '#f59e0b', variant: 'amber', tagLabel: 'MEDIA' };
  if (v >= 20) return { color: '#3b82f6', variant: 'blue',  tagLabel: 'BAJA'  };
  return         { color: '#15803d', variant: 'green', tagLabel: 'MÍNIMA' };
}
