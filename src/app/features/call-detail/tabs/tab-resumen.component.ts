import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleLlamada } from '../../../core/models/domain.models';
import { TagComponent } from '../../../shared/components/tag.component';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-tab-resumen',
  standalone: true,
  imports: [CommonModule, TagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="detail-layout">
      <!-- Columna izquierda -->
      <div>
        <h2 class="section-title">Resumen ejecutivo</h2>
        @if (d().resumen) {
          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 18px; white-space: pre-wrap;">{{ d().resumen }}</p>
        } @else {
          <p style="font-size: 13px; color: #94a3b8; font-style: italic; margin-bottom: 18px;">Resumen no disponible.</p>
        }
        <h3 class="section-subtitle">Datos clave</h3>
        @if (datosClave(); as dk) {
          @if (hasDatos()) {
            <div style="display: flex; flex-direction: column; gap: 12px;">
              @if (dk.referencias.length > 0) {
                <div class="datos-clave-row">
                  <div class="datos-clave-row__label">Referencias</div>
                  <div class="datos-clave-row__chips">
                    @for (r of dk.referencias; track $index) {
                      <span class="chip chip--mono" title="Referencia">{{ r }}</span>
                    }
                  </div>
                </div>
              }
              @if (dk.importes.length > 0) {
                <div class="datos-clave-row">
                  <div class="datos-clave-row__label">Importes</div>
                  <div class="datos-clave-row__chips">
                    @for (imp of dk.importes; track $index) {
                      <span class="chip chip--money" title="Importe">{{ imp }}</span>
                    }
                  </div>
                </div>
              }
              @if (dk.personas.length > 0) {
                <div class="datos-clave-row">
                  <div class="datos-clave-row__label">Personas</div>
                  <div class="datos-clave-row__chips">
                    @for (p of dk.personas; track $index) {
                      <span class="chip" title="Persona mencionada">{{ p }}</span>
                    }
                  </div>
                </div>
              }
              @if (dk.emails.length > 0) {
                <div class="datos-clave-row">
                  <div class="datos-clave-row__label">Emails</div>
                  <div class="datos-clave-row__chips">
                    @for (e of dk.emails; track $index) {
                      <a [attr.href]="'mailto:' + e" class="chip chip--link">{{ e }}</a>
                    }
                  </div>
                </div>
              }
              @if (dk.telefonos.length > 0) {
                <div class="datos-clave-row">
                  <div class="datos-clave-row__label">Teléfonos</div>
                  <div class="datos-clave-row__chips">
                    @for (t of dk.telefonos; track $index) {
                      <a [attr.href]="'tel:' + t" class="chip chip--link chip--mono">{{ t }}</a>
                    }
                  </div>
                </div>
              }
              @if (dk.competidores.length > 0) {
                <div class="datos-clave-row">
                  <div class="datos-clave-row__label">Competencia</div>
                  <div class="datos-clave-row__chips">
                    @for (c of dk.competidores; track $index) {
                      <span class="chip chip--warn" title="Competidor mencionado">{{ c }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div style="padding: 12px 14px; background: #f8fafc; border: 1px dashed #cbd5e1;
                        border-radius: 8px; font-size: 12.5px; color: #64748b; line-height: 1.5;">
              No se han detectado datos estructurados específicos para esta llamada.
            </div>
          }
        } @else {
          <div style="padding: 12px 14px; background: #f8fafc; border: 1px dashed #cbd5e1;
                      border-radius: 8px; font-size: 12.5px; color: #64748b; line-height: 1.5;">
            <b style="color: #475569;">Pendiente:</b> la extracción de datos clave no está
            disponible para esta llamada. Reprocesa con <code>--force</code> para generarla.
          </div>
        }
      </div>

      <!-- Aside -->
      <aside class="detail-aside">
        <div class="aside-block">
          <div class="aside-block__title">INTERACCIÓN</div>
          <div class="__aside-row">
            <span style="color: #94a3b8;">Campaña</span>
            <span style="color: #0f172a; font-weight: 600;">{{ d().campaign || '—' }}</span>
          </div>
          <div class="__aside-row">
            <span style="color: #94a3b8;">Nº marcado</span>
            <span
                style="color: #0f172a; font-weight: 600;
                       font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                       font-feature-settings: 'tnum';"
            >{{ d().dialedNumber || '—' }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 4px 0; border-bottom: 1px dashed #f1f5f9; gap: 8px;">
            <span style="color: #94a3b8;">Agente</span>
            <button
                type="button"
                (click)="openAgente.emit(agentId())"
                style="background: transparent; border: none; padding: 0; cursor: pointer;
                     color: #1d4ed8; font-weight: 500; font-size: 12px; text-decoration: underline;
                     text-underline-offset: 2px; display: inline-flex; align-items: center; gap: 4px;
                     font-family: inherit;"
                title="Ver ficha del agente"
            >
              {{ d().interaccion.agente }}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 17L17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </button>
          </div>
          <div class="__aside-row">
            <span style="color: #94a3b8;">Inicio</span>
            <span style="color: #0f172a; font-weight: 600;">{{ d().interaccion.inicio }}</span>
          </div>
          <div class="__aside-row">
            <span style="color: #94a3b8;">Duración</span>
            <span style="color: #0f172a; font-weight: 600;">{{ d().interaccion.duracion }}</span>
          </div>
          <div class="__aside-row">
            <span style="color: #94a3b8;">Espera</span>
            <span style="color: #0f172a; font-weight: 600;">{{ d().interaccion.espera }}</span>
          </div>
          @if (d().dispositionCode) {
            <div class="__aside-row">
              <span style="color: #94a3b8;">Disposición</span>
              <span style="color: #0f172a; font-weight: 600;">{{ d().dispositionCode }}</span>
            </div>
          }
          @if (d().releaseCode) {
            <div class="__aside-row">
              <span style="color: #94a3b8;">Release</span>
              <span style="color: #0f172a; font-weight: 600;">{{ d().releaseCode }}</span>
            </div>
          }
          @if (d().inSchedule !== null && d().inSchedule !== undefined) {
            <div class="__aside-row">
              <span style="color: #94a3b8;">En horario</span>
              <span style="color: #0f172a; font-weight: 600;">{{ d().inSchedule ? 'Sí' : 'No' }}</span>
            </div>
          }
        </div>

        <div class="aside-block">
          <div class="aside-block__title">CLASIFICACIÓN</div>
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px; margin-bottom: 6px;">
            <span
                [style.background]="tipoColor() + '18'"
                [style.color]="tipoColor()"
                style="font-size: 10px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; padding: 3px 7px; border-radius: 4px;"
            >{{ d().tipo || '—' }}</span>
            <span style="font-size: 11px; color: #64748b;">→</span>
            <span style="font-size: 12px; font-weight: 600; color: #0f172a;">{{ d().subcategoria || '—' }}</span>
          </div>
          @if (d().marca) {
            <div style="font-size: 11px; color: #64748b;">
              Marca: <span style="color: #0f172a; font-weight: 600;">{{ d().marca }}</span>
            </div>
          }
        </div>

        <div class="aside-block">
          <div class="aside-block__title">PRODUCTOS MENCIONADOS</div>
          <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px;">
            @for (p of d().productos; track $index) {
              <span
                  style="display: inline-flex; align-items: center; gap: 5px;
                       padding: 3px 8px; background: #eff6ff; border-radius: 10px;
                       font-size: 11px; color: #1e40af; font-weight: 600;
                       border: 1px solid #dbeafe;"
              >
                {{ p.nombre }}
                @if (p.formato) {
                  <span style="font-size: 10px; color: #3b82f6; font-weight: 500; opacity: 0.8;">{{ p.formato }}</span>
                }
              </span>
            }
          </div>
        </div>

        @if (d().incidencias.length > 0) {
          <div class="aside-block" style="border-color: #fecaca; background: #fffbfb;">
            <div class="aside-block__title" style="color: #b91c1c;">INCIDENCIAS</div>
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
              @for (inc of d().incidencias; track $index) {
                <div style="display: flex; gap: 8px; align-items: flex-start; font-size: 12.5px; color: #7f1d1d; line-height: 1.4;">
                  <span style="color: #dc2626; font-weight: 700; flex: none; margin-top: 1px;">!</span>
                  <span>{{ inc }}</span>
                </div>
              }
            </div>
          </div>
        }

        <div class="aside-block">
          <div class="aside-block__title">SENTIMIENTO</div>
          <div
              style="font-size: 14px; font-weight: 700; margin: 6px 0 8px;"
              [style.color]="isNegative() ? '#b45309' : '#15803d'"
          >{{ d().sentimiento }}</div>
          <div style="display: flex; gap: 5px; flex-wrap: wrap;">
            @for (t of d().tags; track t) {
              <app-tag [variant]="isNegative() ? 'amber' : 'green'">{{ t }}</app-tag>
            }
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .__aside-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 4px 0;
      border-bottom: 1px dashed #f1f5f9;
    }
    .datos-clave-row {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 12px;
      align-items: flex-start;
      padding: 4px 0;
    }
    .datos-clave-row__label {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding-top: 3px;
    }
    .datos-clave-row__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      padding: 3px 9px;
      border-radius: 10px;
      font-size: 12px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
      font-weight: 500;
    }
    .chip--mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-feature-settings: 'tnum';
    }
    .chip--money {
      background: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
      font-weight: 600;
    }
    .chip--warn {
      background: #fef3c7;
      color: #92400e;
      border-color: #fde68a;
    }
    .chip--link {
      text-decoration: none;
      cursor: pointer;
    }
    .chip--link:hover {
      background: #dbeafe;
      color: #1e40af;
      border-color: #bfdbfe;
    }
  `],
})
export class TabResumenComponent {
  private data = inject(DataService);
  d = input.required<DetalleLlamada>();
  openAgente = output<string>();

  tipoColor = computed<string>(() => this.data.getTipoColor(this.d().tipo));
  isNegative = computed<boolean>(() => this.d().sentimiento.toLowerCase().includes('neg'));
  /**
   * Id del agente para navegar al perfil. `interaccion.agente` suele venir
   * como email ("cc_gbr5@yodeyma.com"); nos quedamos con la parte local.
   */
  agentId = computed<string>(() => {
    const raw = this.d().interaccion.agente || '';
    return raw.split('@')[0];
  });

  /** DatosClave del DTO. Puede ser null si el backend no lo ha poblado. */
  datosClave = computed(() => this.d().datosClave ?? null);

  /**
   * True si hay al menos un dato concreto entre las 6 categorías. Distinguir
   * entre "el campo existe pero está vacío" y "el campo no existe" permite
   * elegir el empty state correcto.
   */
  hasDatos = computed<boolean>(() => {
    const dk = this.datosClave();
    if (!dk) return false;
    return (dk.referencias.length +
        dk.importes.length +
        dk.personas.length +
        dk.emails.length +
        dk.telefonos.length +
        dk.competidores.length) > 0;
  });
}