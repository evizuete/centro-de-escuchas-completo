import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { SupervisorsApiService } from '../../../core/services/supervisors-api.service';
import { Agente, AgenteFortaleza, AgenteInsights, Dims, Supervisor } from '../../../core/models/domain.models';
import { IconComponent } from '../../../shared/components/icon.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge.component';
import { SparklineComponent } from '../../../shared/components/sparkline.component';
import { RadarComponent } from '../../../shared/components/radar.component';
import { TagComponent } from '../../../shared/components/tag.component';

type SubTab = 'resumen' | 'fortalezas' | 'coaching' | 'equipo';

const DIM_LABELS: Record<string, string> = {
  saludo: 'Saludo', empatia: 'Empatía', eficiencia: 'Eficiencia',
  claridad: 'Claridad', producto: 'Producto', cierre: 'Cierre',
};

/**
 * Normaliza una entrada de fortalezas/mejoras a un shape rico.
 *
 * El backend actual devuelve `string[]` (frases descriptivas planas). El diseño
 * UI pedía `AgenteFortaleza[]` con metrica/ejemplos. Mientras no se cierre el
 * formato con producto, mostramos lo que tengamos: si es string, la caja
 * verde/ámbar pinta solo el texto; si es objeto, pinta también metrica y
 * ejemplos.
 */
function asFortaleza(x: string | AgenteFortaleza): AgenteFortaleza {
  return typeof x === 'string' ? { titulo: x, metrica: '', ejemplos: 0 } : x;
}

@Component({
  selector: 'app-agente-perfil',
  standalone: true,
  imports: [
    CommonModule, IconComponent, ScoreBadgeComponent,
    SparklineComponent, RadarComponent, TagComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div style="padding: 40px; text-align: center; color: #64748b;">Cargando agente…</div>
    }

    @if (error()) {
      <div style="padding: 40px; text-align: center; color: #dc2626;">
        {{ error() }}
        <div style="margin-top: 12px;">
          <button type="button" class="btn btn--ghost" (click)="backToList()">Volver</button>
        </div>
      </div>
    }

    @if (a(); as ag) {
      <div class="page">
        <!-- Breadcrumbs -->
        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; margin-bottom: 14px;">
          @if (fromCall()) {
            <button type="button" (click)="backToCall()" style="color: #3b82f6; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Volver a la llamada
            </button>
          } @else {
            <button type="button" (click)="backToList()" style="color: #3b82f6; font-weight: 500;">Supervisores</button>
            <app-icon name="chevron" [size]="13" color="#94a3b8" />
            <button type="button" (click)="backToSupervisor()" style="color: #3b82f6; font-weight: 500;">{{ supName() }}</button>
            <app-icon name="chevron" [size]="13" color="#94a3b8" />
            <span style="color: #0f172a; font-weight: 600;">{{ ag.nombre }}</span>
          }
        </div>

        <!-- Header de identidad -->
        <div class="card" style="padding: 24px; margin-bottom: 18px; display: flex; align-items: flex-start; gap: 22px;">
          @if (ag.foto) {
            <img [src]="ag.foto" [alt]="ag.nombre"
                 style="width: 96px; height: 96px; border-radius: 50%; object-fit: cover;
                        border: 3px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.12);" />
          } @else {
            <div style="width: 96px; height: 96px; border-radius: 50%; background: #e2e8f0; color: #475569;
                        display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 32px;
                        border: 3px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.12);">{{ initials(ag.nombre) }}</div>
          }
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">{{ ag.nombre }}</h1>
              @if (ag.rol) {
                <app-tag [variant]="ag.rol === 'Senior' ? 'blue' : ag.rol === 'Middle' ? 'gray' : 'amber'">{{ ag.rol }}</app-tag>
              }
              @if (ag.score >= 90) {
                <app-tag variant="green">⭐ Top performer</app-tag>
              }
              @if (ag.score < 65) {
                <app-tag variant="red">Requiere coaching</app-tag>
              }
            </div>
            <div style="font-size: 13px; color: #64748b; margin-top: 6px;">
              {{ supEquipo() }} · {{ ag.pais }}
              @if (ag.antiguedad) { · {{ ag.antiguedad }} }
              @if (ag.turno) { · Turno {{ ag.turno.toLowerCase() }} }
              @if (ag.idiomas && ag.idiomas.length > 0) { · {{ ag.idiomas.join(' · ') }} }
            </div>

            <div style="display: flex; gap: 8px; margin-top: 12px;">
              <button type="button" class="btn btn--primary" style="font-size: 12px; padding: 7px 12px; display: inline-flex; align-items: center; gap: 6px;">
                <app-icon name="phone" [size]="13" color="#fff" /> Llamar
              </button>
              <button type="button" class="btn" style="font-size: 12px; padding: 7px 12px; display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #e2e8f0; color: #0f172a;">
                <app-icon name="chat" [size]="13" color="#64748b" /> Mensaje
              </button>
              <button type="button" class="btn" style="font-size: 12px; padding: 7px 12px; display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #e2e8f0; color: #0f172a;">
                <app-icon name="calendar" [size]="13" color="#64748b" /> Agendar 1:1
              </button>
              <button type="button" class="btn" style="font-size: 12px; padding: 7px 12px; display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #e2e8f0; color: #0f172a;">
                <app-icon name="send" [size]="13" color="#64748b" /> Enviar highlight
              </button>
            </div>

            <!-- CV de rasgos -->
            <div style="margin-top: 14px; padding: 14px; background: #f8fafc; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;">
                <div>
                  <div style="font-size: 9.5px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase;">Estilo</div>
                  <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 4px;">{{ estilo() }}</div>
                  <div style="font-size: 10.5px; color: #64748b; margin-top: 2px; line-height: 1.4;">{{ estiloDesc() }}</div>
                </div>
                <div>
                  <div style="font-size: 9.5px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase;">Especialidad</div>
                  @if (ag.topTemas && ag.topTemas.length > 0) {
                    <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 4px;">{{ ag.topTemas[0] }}</div>
                    @if (ag.topTemas.length > 1) {
                      <div style="font-size: 10.5px; color: #64748b; margin-top: 2px; line-height: 1.4;">+ {{ ag.topTemas[1] }}</div>
                    }
                  } @else {
                    <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">—</div>
                  }
                </div>
                <div>
                  <div style="font-size: 9.5px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase;">Fortaleza top</div>
                  <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 4px; text-transform: capitalize;">{{ fortalezaTop().k }}</div>
                  <div style="font-size: 10.5px; color: #15803d; margin-top: 2px; font-weight: 600; font-feature-settings: 'tnum';">{{ fortalezaTop().v }} pts</div>
                </div>
                <div>
                  <div style="font-size: 9.5px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase;">Facturación</div>
                  @if (ag.facturacion != null) {
                    <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 4px; font-feature-settings: 'tnum';">€{{ facK() }}k</div>
                    <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">últimos 30 días</div>
                  } @else {
                    <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">—</div>
                  }
                </div>
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; min-width: 180px;">
            <div style="padding: 12px; background: #eff6ff; border-radius: 8px; text-align: center;">
              <div style="font-size: 10px; color: #1e3a8a; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;">Score medio</div>
              <div style="font-size: 30px; font-weight: 700; color: #1e3a8a; margin-top: 4px; font-feature-settings: 'tnum';">{{ ag.score }}</div>
              <div style="font-size: 11px; font-weight: 700; margin-top: 2px; font-feature-settings: 'tnum';"
                   [style.color]="ag.delta >= 0 ? '#15803d' : '#dc2626'">
                {{ ag.delta >= 0 ? '+' : '' }}{{ ag.delta }}pt vs sem. ant.
              </div>
            </div>
            <div style="padding: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 11px;">
              <div style="color: #64748b;">Ranking en equipo: <b style="color: #0f172a; font-feature-settings: 'tnum';">#{{ rankEquipo() || '—' }}/{{ equipo().length || '—' }}</b></div>
              <div style="color: #64748b; margin-top: 4px;">Ranking global: <b style="color: #0f172a; font-feature-settings: 'tnum';">#{{ rankGlobal() || '—' }}/{{ totalAgentes() || '—' }}</b></div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs" style="margin-bottom: 14px;">
          @for (t of tabs; track t[0]) {
            <button
              type="button"
              class="tab"
              [class.tab--active]="subTab() === t[0]"
              (click)="subTab.set(t[0])"
            >{{ t[1] }}</button>
          }
        </div>

        <!-- Sub-tab: Resumen -->
        @if (subTab() === 'resumen') {
          <div class="grid grid--2">
            <div class="card">
              <div class="card__header">
                <div>
                  <h3 class="card__title">Dimensiones vs equipo</h3>
                  <div class="card__subtitle">Comparado con el promedio del equipo</div>
                </div>
              </div>
              <div style="display: flex; justify-content: center;">
                <app-radar [dims]="ag.dims" [size]="220" />
              </div>
              <div style="margin-top: 14px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px;">
                @for (row of dimsTable(); track row.k) {
                  <div style="padding: 8px; background: #f8fafc; border-radius: 6px;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">{{ dimLabel(row.k) }}</div>
                    <div style="display: flex; align-items: baseline; gap: 6px; margin-top: 2px;">
                      <span style="font-size: 18px; font-weight: 700; color: #0f172a; font-feature-settings: 'tnum';">{{ row.v }}</span>
                      <span style="font-size: 11px; font-weight: 700;" [style.color]="row.diff >= 0 ? '#15803d' : '#dc2626'">
                        {{ row.diff >= 0 ? '+' : '' }}{{ row.diff }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="card">
              <div class="card__header">
                <div>
                  <h3 class="card__title">Evolución 12 semanas</h3>
                  <div class="card__subtitle">Score semanal · {{ ag.score }} actual</div>
                </div>
                <app-tag [variant]="ag.delta >= 0 ? 'green' : 'red'">{{ ag.delta >= 0 ? '↑ +' : '↓ ' }}{{ ag.delta }}pt</app-tag>
              </div>
              @if (ag.tendencia && ag.tendencia.length > 0) {
                <app-sparkline [data]="ag.tendencia" [width]="320" [height]="140" color="#3b82f6" [showDots]="true" />
                <div style="margin-top: 14px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                  @for (r of mejorMediaPeor(); track r.label) {
                    <div style="padding: 10px; background: #f8fafc; border-radius: 6px; text-align: center;">
                      <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">{{ r.label }}</div>
                      <div style="font-size: 20px; font-weight: 700; font-feature-settings: 'tnum'; margin-top: 2px;" [style.color]="r.color">{{ r.value }}</div>
                    </div>
                  }
                </div>
              } @else {
                <div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 12px;">Sin datos de tendencia disponibles.</div>
              }
            </div>

            @if (ag.topTemas && ag.topTemas.length > 0) {
              <div class="card" style="grid-column: span 2;">
                <div class="card__header">
                  <div>
                    <h3 class="card__title">Temas que domina</h3>
                    <div class="card__subtitle">Distribución de llamadas por tema</div>
                  </div>
                </div>
                <div style="display: grid; gap: 12px;" [style.gridTemplateColumns]="'repeat(' + ag.topTemas.length + ', 1fr)'">
                  @for (t of ag.topTemas; track t; let i = $index) {
                    <div style="padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                      <div style="font-size: 10.5px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase;">{{ temaLabel(i) }}</div>
                      <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 4px;">{{ t }}</div>
                      <div style="margin-top: 8px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                        <div
                          [style.width.%]="temaPcts[i]"
                          [style.background]="temaColors[i]"
                          style="height: 100%;"
                        ></div>
                      </div>
                      <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-feature-settings: 'tnum';">{{ temaPcts[i] }}% de sus llamadas</div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Sub-tab: Fortalezas -->
        @if (subTab() === 'fortalezas') {
          <div class="grid grid--2">
            <div class="card">
              <div class="card__header">
                <div>
                  <h3 class="card__title" style="color: #15803d;">✦ Fortalezas documentadas</h3>
                  <div class="card__subtitle">Qué hace mejor que la media</div>
                </div>
              </div>
              @if (fortalezasNorm().length > 0) {
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  @for (f of fortalezasNorm(); track $index) {
                    <div style="padding: 12px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                      <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
                        <div style="font-size: 14px; font-weight: 600; color: #14532d;">{{ f.titulo }}</div>
                        @if (f.metrica) {
                          <app-tag variant="green">{{ f.metrica }}</app-tag>
                        }
                      </div>
                      @if (f.ejemplos > 0) {
                        <div style="font-size: 11px; color: #15803d; margin-top: 6px;">
                          {{ f.ejemplos }} ejemplos documentados · <button type="button" class="link-btn" style="font-size: 11px;">ver casos</button>
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">Aún no hay fortalezas registradas.</div>
              }
            </div>

            <div class="card">
              <div class="card__header">
                <div>
                  <h3 class="card__title" style="color: #b45309;">△ Áreas de mejora</h3>
                  <div class="card__subtitle">Dónde la IA detecta oportunidad</div>
                </div>
              </div>
              @if (mejorasNorm().length > 0) {
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  @for (m of mejorasNorm(); track $index) {
                    <div style="padding: 12px; background: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
                      <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
                        <div style="font-size: 14px; font-weight: 600; color: #78350f;">{{ m.titulo }}</div>
                        @if (m.metrica) {
                          <app-tag variant="amber">{{ m.metrica }}</app-tag>
                        }
                      </div>
                      @if (m.ejemplos > 0) {
                        <div style="font-size: 11px; color: #92400e; margin-top: 6px;">
                          {{ m.ejemplos }} casos detectados · <button type="button" class="link-btn" style="font-size: 11px;">marcar para coaching →</button>
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">Sin áreas de mejora registradas. <br/><i>TODO backend: fuente pendiente</i></div>
              }
            </div>

            <div class="card" style="grid-column: span 2;">
              <div class="card__header">
                <div>
                  <h3 class="card__title">★ Momentos brillantes</h3>
                  <div class="card__subtitle">Llamadas que definen a {{ firstName() }} · replicables como caso de estudio</div>
                </div>
              </div>
              @if ((insights()?.momentosBrillantes?.length ?? 0) > 0) {
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
                  @for (m of insights()?.momentosBrillantes ?? []; track $index) {
                    <div
                      (click)="openCall(m.callId)"
                      style="padding: 14px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                             border-radius: 10px; border: 1px solid #fcd34d; cursor: pointer; transition: transform 120ms;"
                      (mouseenter)="liftOn($event)" (mouseleave)="liftOff($event)"
                    >
                      <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px;">
                        <div style="font-size: 9.5px; color: #92400e; font-weight: 700; font-feature-settings: 'tnum'; letter-spacing: 0.5px;">#{{ m.callId }}</div>
                        <app-score-badge [value]="m.score" size="sm" />
                      </div>
                      <div style="font-size: 14px; font-weight: 700; color: #78350f; margin-top: 6px; line-height: 1.3;">{{ m.titulo }}</div>
                      <div style="font-size: 12px; color: #92400e; margin-top: 6px; line-height: 1.5;">{{ m.descripcion }}</div>
                    </div>
                  }
                </div>
              } @else {
                <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">Sin momentos destacados registrados. <br/><i>TODO backend: fuente pendiente</i></div>
              }
            </div>

            @if ((insights()?.patronesRiesgo?.length ?? 0) > 0) {
              <div class="card" style="grid-column: span 2; border-color: #fecaca; background: #fffbfb;">
                <div class="card__header">
                  <div>
                    <h3 class="card__title" style="color: #991b1b;">⚠ Patrones de riesgo</h3>
                    <div class="card__subtitle">Situaciones donde sistemáticamente rinde por debajo</div>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  @for (p of insights()?.patronesRiesgo ?? []; track $index) {
                    <div style="padding: 12px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; display: flex; gap: 12px; align-items: start;">
                      <div style="width: 34px; height: 34px; border-radius: 8px; background: #dc262614; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <app-icon name="alert" [size]="18" color="#dc2626" />
                      </div>
                      <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; gap: 8px;">
                          <div style="font-size: 14px; font-weight: 700; color: #991b1b;">{{ p.patron }}</div>
                          <app-tag [variant]="p.severidad === 'ALTA' ? 'red' : 'amber'">{{ p.severidad }}</app-tag>
                        </div>
                        <div style="font-size: 12px; color: #7f1d1d; margin-top: 4px; line-height: 1.5;">{{ p.detalle }}</div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Sub-tab: Coaching -->
        @if (subTab() === 'coaching') {
          <div class="grid grid--2">
            <div class="card" style="grid-column: span 2;">
              <div class="card__header">
                <div>
                  <h3 class="card__title">Historial de coaching</h3>
                  <div class="card__subtitle">Highlights recibidos y su impacto medido</div>
                </div>
                <button type="button" class="btn btn--primary" style="font-size: 12px; padding: 6px 12px;">+ Nuevo highlight</button>
              </div>
              @if ((insights()?.coachingRecibido?.length ?? 0) > 0) {
                <div style="display: flex; flex-direction: column;">
                  @for (c of insights()?.coachingRecibido ?? []; track $index; let last = $last) {
                    <div style="display: flex; gap: 14px; padding: 14px 0;" [style.borderBottom]="last ? 'none' : '1px solid #f1f5f9'">
                      <div style="position: relative; width: 32px; display: flex; flex-direction: column; align-items: center;">
                        <div
                          [style.background]="c.aplicado ? '#dcfce7' : '#fef3c7'"
                          style="width: 32px; height: 32px; border-radius: 50%;
                                 display: flex; align-items: center; justify-content: center;"
                        >
                          <app-icon [name]="c.aplicado ? 'check' : 'clock'" [size]="16" [color]="c.aplicado ? '#15803d' : '#b45309'" />
                        </div>
                        @if (!last) {
                          <div style="width: 2px; flex: 1; background: #e2e8f0; margin-top: 4px;"></div>
                        }
                      </div>
                      <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
                          <div style="font-size: 14px; font-weight: 600; color: #0f172a;">{{ c.titulo }}</div>
                          @if (c.mejora) {
                            <app-tag variant="green">Impacto {{ c.mejora }}</app-tag>
                          }
                          @if (!c.aplicado) {
                            <app-tag variant="amber">Pendiente</app-tag>
                          }
                        </div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">{{ c.fecha }} · de {{ c.de }}</div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">Sin historial de coaching. <br/><i>TODO backend: fuente pendiente</i></div>
              }
            </div>

            <div class="card">
              <div class="card__header">
                <div>
                  <h3 class="card__title">Sugerencias IA para {{ firstName() }}</h3>
                  <div class="card__subtitle">Basado en patrones recientes</div>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                @for (m of sugerenciasIA(); track $index) {
                  <div style="padding: 12px; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
                    <div style="display: flex; gap: 10px; align-items: start;">
                      <div style="width: 28px; height: 28px; border-radius: 50%; background: #3b82f614; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <app-icon name="sparkles" [size]="14" color="#3b82f6" />
                      </div>
                      <div style="flex: 1;">
                        <div style="font-size: 13px; font-weight: 600; color: #1e3a8a;">{{ m.titulo }}</div>
                        @if (m.metrica) {
                          <div style="font-size: 11px; color: #1e40af; margin-top: 2px;">{{ m.metrica }}</div>
                        }
                        <button type="button" class="link-btn" style="font-size: 11px; margin-top: 6px;">Enviar como highlight →</button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="card">
              <div class="card__header">
                <div>
                  <h3 class="card__title">Progreso tras coaching</h3>
                  <div class="card__subtitle">Efecto medible en score</div>
                </div>
              </div>
              <div style="padding: 14px; background: #f0fdf4; border-radius: 8px; text-align: center;">
                <div style="font-size: 40px; font-weight: 700; color: #15803d; font-feature-settings: 'tnum';">+{{ progresoTotal() }}pt</div>
                <div style="font-size: 12px; color: #166534; margin-top: 4px;">Mejora acumulada tras aplicar {{ aplicados() }} highlights</div>
              </div>
              <div style="margin-top: 14px; font-size: 12px; color: #64748b; line-height: 1.6;">
                <b>{{ firstName() }}</b> {{ aplicados() >= 2 ? 'responde bien al coaching' : 'aún está construyendo historial' }}.
                @if (pendientes() > 0) {
                  Tiene {{ pendientes() }} highlight(s) pendiente(s) de aplicar.
                }
              </div>
            </div>
          </div>
        }

        <!-- Sub-tab: Equipo -->
        @if (subTab() === 'equipo') {
          <div class="grid grid--2">
            <div class="card">
              <div class="card__header">
                <div>
                  <h3 class="card__title">Posición en el equipo</h3>
                  <div class="card__subtitle">{{ supName() }} · {{ equipo().length }} agentes</div>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                @for (m of equipoSorted(); track m.id; let i = $index) {
                  <div
                    [style.background]="m.id === ag.id ? '#eff6ff' : 'transparent'"
                    [style.border]="m.id === ag.id ? '1px solid #bfdbfe' : '1px solid transparent'"
                    style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px;"
                  >
                    <span
                      style="font-size: 11px; font-weight: 700; width: 20px; font-feature-settings: 'tnum';"
                      [style.color]="m.id === ag.id ? '#1e40af' : '#64748b'"
                    >#{{ i + 1 }}</span>
                    @if (m.foto) {
                      <img [src]="m.foto" style="width: 28px; height: 28px; border-radius: 50%;" />
                    } @else {
                      <div style="width: 28px; height: 28px; border-radius: 50%; background: #e2e8f0; color: #475569; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px;">{{ initials(m.nombre) }}</div>
                    }
                    <div style="flex: 1; min-width: 0;">
                      <div style="font-size: 13px; color: #0f172a;" [style.fontWeight]="m.id === ag.id ? 700 : 500">
                        {{ m.nombre }}
                        @if (m.id === ag.id) {
                          <span style="font-size: 10px; color: #3b82f6; font-weight: 600;">(ESTE)</span>
                        }
                      </div>
                      <div style="font-size: 10.5px; color: #94a3b8;">{{ m.rol ?? '—' }}{{ m.antiguedad ? ' · ' + m.antiguedad : '' }}</div>
                    </div>
                    <app-score-badge [value]="m.score" size="sm" />
                  </div>
                }
              </div>
            </div>

            <div class="card">
              <div class="card__header">
                <div>
                  <h3 class="card__title">Agentes similares</h3>
                  <div class="card__subtitle">Mismo rol{{ ag.rol ? ' · ' + ag.rol : '' }} · cross-equipo</div>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                @for (m of similaresSorted(); track m.id; let i = $index) {
                  <div
                    [style.background]="m.id === ag.id ? '#f5f3ff' : 'transparent'"
                    [style.border]="m.id === ag.id ? '1px solid #ddd6fe' : '1px solid transparent'"
                    style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px;"
                  >
                    <span
                      style="font-size: 11px; font-weight: 700; width: 20px; font-feature-settings: 'tnum';"
                      [style.color]="m.id === ag.id ? '#6d28d9' : '#64748b'"
                    >#{{ i + 1 }}</span>
                    @if (m.foto) {
                      <img [src]="m.foto" style="width: 28px; height: 28px; border-radius: 50%;" />
                    } @else {
                      <div style="width: 28px; height: 28px; border-radius: 50%; background: #e2e8f0; color: #475569; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px;">{{ initials(m.nombre) }}</div>
                    }
                    <div style="flex: 1; min-width: 0;">
                      <div style="font-size: 13px; color: #0f172a;" [style.fontWeight]="m.id === ag.id ? 700 : 500">
                        {{ m.nombre }}
                        @if (m.id === ag.id) {
                          <span style="font-size: 10px; color: #8b5cf6; font-weight: 600;">(ESTE)</span>
                        }
                      </div>
                      <div style="font-size: 10.5px; color: #94a3b8;">{{ supShort(m.supervisorId) }} · {{ m.pais }}</div>
                    </div>
                    <app-score-badge [value]="m.score" size="sm" />
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class AgentePerfilComponent {
  private api = inject(SupervisorsApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  id = input<string>('');

  private queryParams = toSignal(this.route.queryParams, { initialValue: {} as Record<string, string> });

  readonly a = signal<Agente | null>(null);
  readonly insights = signal<AgenteInsights | null>(null);
  readonly equipo = signal<Agente[]>([]);
  private allAgentes = signal<Agente[]>([]);
  private supervisorObj = signal<Supervisor | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly subTab = signal<SubTab>('resumen');
  readonly tabs: [SubTab, string][] = [
    ['resumen', 'Resumen'],
    ['fortalezas', 'Fortalezas y patrones'],
    ['coaching', 'Coaching'],
    ['equipo', 'Dentro del equipo'],
  ];

  readonly temaPcts = [48, 32, 20];
  readonly temaColors = ['#3b82f6', '#8b5cf6', '#f59e0b'];

  readonly firstName = computed<string>(() => this.a()?.nombre.split(' ')[0] ?? '');
  readonly fromCall = computed<boolean>(() => (this.queryParams() as Record<string, string>)['from'] === 'call');
  readonly callId = computed<string>(() => (this.queryParams() as Record<string, string>)['callId'] ?? '');

  readonly equipoSorted = computed<Agente[]>(() => [...this.equipo()].sort((a, b) => b.score - a.score));

  readonly similares = computed<Agente[]>(() => {
    const ag = this.a();
    if (!ag || !ag.rol) return [];
    return this.allAgentes().filter((x) => x.rol === ag.rol);
  });
  readonly similaresSorted = computed<Agente[]>(() => [...this.similares()].sort((a, b) => b.score - a.score));

  readonly supName = computed<string>(() => this.supervisorObj()?.nombre ?? '');
  readonly supEquipo = computed<string>(() => this.supervisorObj()?.equipo ?? '');

  readonly rankEquipo = computed<number>(() => {
    const ag = this.a();
    if (!ag) return 0;
    return this.equipoSorted().findIndex((x) => x.id === ag.id) + 1;
  });
  readonly rankGlobal = computed<number>(() => {
    const ag = this.a();
    if (!ag) return 0;
    const sorted = [...this.allAgentes()].sort((a, b) => b.score - a.score);
    return sorted.findIndex((x) => x.id === ag.id) + 1;
  });
  readonly totalAgentes = computed<number>(() => this.allAgentes().length);

  readonly promedioEquipo = computed<Dims>(() => {
    const eq = this.equipo();
    const n = Math.max(1, eq.length);
    return {
      saludo:     Math.round(eq.reduce((a, x) => a + x.dims.saludo,     0) / n),
      empatia:    Math.round(eq.reduce((a, x) => a + x.dims.empatia,    0) / n),
      eficiencia: Math.round(eq.reduce((a, x) => a + x.dims.eficiencia, 0) / n),
      claridad:   Math.round(eq.reduce((a, x) => a + x.dims.claridad,   0) / n),
      producto:   Math.round(eq.reduce((a, x) => a + x.dims.producto,   0) / n),
      cierre:     Math.round(eq.reduce((a, x) => a + x.dims.cierre,     0) / n),
    };
  });

  readonly dimsTable = computed(() => {
    const ag = this.a();
    if (!ag) return [];
    const prom = this.promedioEquipo();
    const keys: (keyof Dims)[] = ['saludo', 'empatia', 'eficiencia', 'claridad', 'producto', 'cierre'];
    return keys.map((k) => ({
      k: k as string,
      v: ag.dims[k],
      diff: ag.dims[k] - prom[k],
    }));
  });

  readonly estilo = computed<string>(() => {
    const s = this.a()?.score ?? 0;
    if (s >= 90) return 'Acompañante';
    if (s >= 80) return 'Sereno';
    if (s >= 70) return 'Neutral';
    return 'Tenso';
  });
  readonly estiloDesc = computed<string>(() => {
    const s = this.a()?.score ?? 0;
    if (s >= 90) return 'Eleva al cliente';
    if (s >= 80) return 'Estabiliza';
    if (s >= 70) return 'Plano emocional';
    return 'Arrastra al cliente';
  });

  readonly fortalezaTop = computed<{ k: string; v: number }>(() => {
    const ag = this.a();
    if (!ag) return { k: '—', v: 0 };
    const entries = Object.entries(ag.dims).sort((a, b) => (b[1] as number) - (a[1] as number));
    const [k, v] = entries[0];
    return { k, v: v as number };
  });

  readonly facK = computed<string>(() => ((this.a()?.facturacion ?? 0) / 1000).toFixed(1));

  readonly mejorMediaPeor = computed(() => {
    const ag = this.a();
    const arr = ag?.tendencia;
    if (!arr || arr.length === 0) return [];
    const mejor = Math.max(...arr);
    const media = Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    const peor = Math.min(...arr);
    return [
      { label: 'Mejor', value: mejor, color: '#15803d' },
      { label: 'Media', value: media, color: '#3b82f6' },
      { label: 'Peor', value: peor, color: '#dc2626' },
    ];
  });

  // Fortalezas/mejoras normalizadas (backend devuelve string[] hoy)
  readonly fortalezasNorm = computed<AgenteFortaleza[]>(() => {
    const ins = this.insights();
    if (!ins?.fortalezas) return [];
    return (ins.fortalezas as (string | AgenteFortaleza)[]).map(asFortaleza);
  });
  readonly mejorasNorm = computed<AgenteFortaleza[]>(() => {
    const ins = this.insights();
    if (!ins?.mejoras) return [];
    return ins.mejoras.map(asFortaleza);
  });

  readonly sugerenciasIA = computed<AgenteFortaleza[]>(() => {
    const mej = this.mejorasNorm();
    if (mej.length > 0) return mej.slice(0, 3);
    return [{ titulo: 'Mantener el nivel', metrica: 'Rendimiento estable', ejemplos: 0 }];
  });

  readonly progresoTotal = computed<number>(() => {
    const cs = this.insights()?.coachingRecibido ?? [];
    return cs
      .filter((c) => c.aplicado && c.mejora)
      .reduce((s, c) => s + parseInt(c.mejora ?? '0', 10), 0);
  });
  readonly aplicados = computed<number>(() =>
    (this.insights()?.coachingRecibido ?? []).filter((c) => c.aplicado).length
  );
  readonly pendientes = computed<number>(() =>
    (this.insights()?.coachingRecibido ?? []).filter((c) => !c.aplicado).length
  );

  constructor() {
    effect(() => {
      const agentId = this.id();
      if (!agentId) {
        this.a.set(null);
        this.insights.set(null);
        return;
      }
      this.loading.set(true);
      this.error.set(null);

      // 1º traemos agente + insights + lista global (benchmark).
      forkJoin({
        allAgs: this.api.listAgents(),
        ins: this.api.getAgentInsights(agentId),
      }).subscribe({
        next: ({ allAgs, ins }) => {
          const ag = allAgs.find((x) => x.id === agentId) ?? null;
          if (!ag) {
            this.loading.set(false);
            this.error.set(`Agente ${agentId} no encontrado`);
            return;
          }
          this.a.set(ag);
          this.insights.set(ins);
          this.allAgentes.set(allAgs);
          this.equipo.set(allAgs.filter((x) => x.supervisorId === ag.supervisorId));

          // 2º resolvemos el supervisor (para breadcrumb y equipo).
          if (ag.supervisorId) {
            this.api.getSupervisor(ag.supervisorId).subscribe({
              next: (sup) => {
                this.supervisorObj.set(sup);
                this.loading.set(false);
              },
              error: () => {
                // Si falla el supervisor no bloqueamos la vista del agente.
                this.supervisorObj.set(null);
                this.loading.set(false);
              },
            });
          } else {
            this.supervisorObj.set(null);
            this.loading.set(false);
          }
        },
        error: (err) => {
          this.loading.set(false);
          const status = err?.status;
          if (status === 404) {
            this.error.set(`Agente ${agentId} no encontrado`);
          } else {
            this.error.set('No se pudo cargar el agente');
          }
          console.error('[agente-perfil] error', err);
        },
      });
    });
  }

  initials(nombre: string): string {
    const parts = nombre.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }

  temaLabel(i: number): string {
    return i === 0 ? 'Principal' : i === 1 ? 'Secundario' : 'Ocasional';
  }
  dimLabel(k: string): string { return DIM_LABELS[k] ?? k; }
  supShort(id: string | undefined): string {
    if (!id) return '';
    // En esta pantalla solo conocemos el supervisor del agente actual. Para
    // los "similares" de otros equipos mostramos solo el id como fallback.
    const s = this.supervisorObj();
    if (s && s.id === id) return s.nombre.split(' ')[0];
    return id;
  }

  backToList(): void { this.router.navigate(['/supervisores']); }
  backToSupervisor(): void {
    const ag = this.a();
    if (ag?.supervisorId) this.router.navigate(['/supervisores', ag.supervisorId]);
  }
  backToCall(): void {
    const cid = this.callId();
    if (cid) this.router.navigate(['/llamadas', cid]);
    else this.router.navigate(['/llamadas']);
  }
  openCall(id: string): void { this.router.navigate(['/llamadas', id]); }

  liftOn(e: MouseEvent): void { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }
  liftOff(e: MouseEvent): void { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }
}
