import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { Agente, Dims } from '../../../core/models/domain.models';
import { IconComponent } from '../../../shared/components/icon.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge.component';
import { SparklineComponent } from '../../../shared/components/sparkline.component';
import { RadarComponent } from '../../../shared/components/radar.component';
import { TagComponent } from '../../../shared/components/tag.component';

const DIMS: (keyof Dims)[] = ['saludo', 'empatia', 'eficiencia', 'claridad', 'producto', 'cierre'];

interface CoachItem { titulo: string; agente: Agente; }
interface AlertaItem { tipo: string; agente: Agente; }

@Component({
  selector: 'app-supervisor-detalle',
  standalone: true,
  imports: [
    CommonModule, IconComponent, ScoreBadgeComponent, SparklineComponent,
    RadarComponent, TagComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (s(); as sup) {
      <div class="page">
        <!-- Breadcrumbs -->
        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; margin-bottom: 14px;">
          <button type="button" (click)="backToList()" style="color: #3b82f6; font-weight: 500;">Supervisores</button>
          <app-icon name="chevron" [size]="13" color="#94a3b8" />
          <span style="color: #0f172a; font-weight: 600;">{{ sup.nombre }}</span>
        </div>

        <!-- Header -->
        <div class="card" style="padding: 22px; margin-bottom: 18px; display: flex; align-items: flex-start; gap: 20px;">
          <img [src]="sup.foto" [alt]="sup.nombre"
               style="width: 86px; height: 86px; border-radius: 50%; object-fit: cover;
                      border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          <div style="flex: 1;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">{{ sup.nombre }}</h1>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
              {{ sup.equipo }} · {{ sup.pais }} · {{ sup.antiguedad }} de experiencia
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 6px; font-style: italic;">{{ sup.especializacion }}</div>

            <!-- Resumen IA -->
            <div style="margin-top: 12px; padding: 10px 12px;
                        background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
                        border-radius: 8px; border: 1px solid #dbeafe;
                        display: flex; gap: 10px; align-items: flex-start;">
              <div style="width: 24px; height: 24px; border-radius: 6px; background: #fff;
                          display: flex; align-items: center; justify-content: center;
                          flex-shrink: 0; border: 1px solid #dbeafe;">
                <app-icon name="sparkles" [size]="13" color="#3b82f6" />
              </div>
              <div style="flex: 1; font-size: 12px; color: #1e3a8a; line-height: 1.5;">
                <b>{{ firstName() }}</b> lidera un equipo de {{ agentes().length }} agentes con score medio
                <b>{{ sup.scoreMedio }}</b>{{ sup.delta >= 0 ? ' y tendencia positiva (+' + sup.delta + 'pt este mes)' : ' con caída de ' + sup.delta + 'pt este mes' }}.
                Destaca por su gestión en <b>{{ sup.topTemas[0].tema.toLowerCase() }}</b>
                ({{ sup.topTemas[0].pct }}% del volumen) y su equipo rinde especialmente bien en
                <b>{{ bestDim().k }}</b> ({{ bestDim().v }}pts), con margen de mejora en
                <b>{{ worstDim().k }}</b> ({{ worstDim().v }}pts).
                {{ sup.alertasAbiertas > 0
                    ? 'Tiene ' + sup.alertasAbiertas + ' alerta' + (sup.alertasAbiertas > 1 ? 's' : '') + ' abierta' + (sup.alertasAbiertas > 1 ? 's' : '') + ' que requieren atención.'
                    : 'Sin alertas abiertas actualmente.' }}
                <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-style: italic;">Resumen generado por QA · revisado por equipo de Calidad</div>
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 14px;">
            <div style="display: flex; gap: 8px; flex-shrink: 0;">
              <button type="button" class="btn btn--primary" style="font-size: 12px; padding: 7px 12px; display: inline-flex; align-items: center; gap: 6px;">
                <app-icon name="phone" [size]="13" color="#fff" /> Llamar
              </button>
              <button type="button" class="btn" style="font-size: 12px; padding: 7px 12px; display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #e2e8f0; color: #0f172a;">
                <app-icon name="chat" [size]="13" color="#64748b" /> Mensaje
              </button>
              <button type="button" class="btn" style="font-size: 12px; padding: 7px 12px; display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #e2e8f0; color: #0f172a;">
                <app-icon name="calendar" [size]="13" color="#64748b" /> Agendar 1:1
              </button>
            </div>

            <div style="display: flex; gap: 28px; align-items: center;">
              <div style="text-align: center;">
                <div style="font-size: 10px; color: #64748b; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase;">Agentes</div>
                <div style="font-size: 24px; font-weight: 700; color: #0f172a; font-feature-settings: 'tnum'; margin-top: 2px;">{{ agentes().length }}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 10px; color: #64748b; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase;">Llamadas</div>
                <div style="font-size: 24px; font-weight: 700; color: #0f172a; font-feature-settings: 'tnum'; margin-top: 2px;">{{ sup.nLlamadas.toLocaleString('es') }}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 10px; color: #64748b; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase;">Valoración</div>
                <div style="margin-top: 4px;"><app-score-badge [value]="sup.scoreMedio" /></div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 10px; color: #64748b; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase;">Tendencia</div>
                <div style="font-size: 20px; font-weight: 700; font-feature-settings: 'tnum'; margin-top: 4px;"
                     [style.color]="sup.delta >= 0 ? '#15803d' : '#dc2626'">{{ sup.delta >= 0 ? '+' : '' }}{{ sup.delta }}pt</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ranking del equipo -->
        <div class="card" style="margin-bottom: 18px;">
          <div class="card__header">
            <div>
              <h3 class="card__title">Equipo · {{ agentes().length }} agentes</h3>
              <div class="card__subtitle">Click en un agente para ver su perfil completo</div>
            </div>
          </div>
          <div style="overflow: auto;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <thead>
                <tr style="font-size: 10.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                  <th style="text-align: left; padding: 10px 12px;">Agente</th>
                  <th style="text-align: center; padding: 10px 12px;">Rol</th>
                  <th style="text-align: center; padding: 10px 12px;">Turno</th>
                  <th style="text-align: center; padding: 10px 12px;">Llamadas</th>
                  <th style="text-align: center; padding: 10px 12px;">Valoración</th>
                  <th style="text-align: center; padding: 10px 12px;">Experiencia<br/>cliente</th>
                  <th style="text-align: center; padding: 10px 12px; width: 100px;">12 sem</th>
                  <th style="text-align: center; padding: 10px 12px;">Δ</th>
                  <th style="text-align: center; padding: 10px 12px;">Facturación</th>
                </tr>
              </thead>
              <tbody>
                @for (a of agentesSorted(); track a.id) {
                  <tr
                    (click)="openAgente(a.id)"
                    style="cursor: pointer; border-top: 1px solid #f1f5f9;"
                    (mouseenter)="hoverOn($event)" (mouseleave)="hoverOff($event)"
                  >
                    <td style="padding: 12px; display: flex; align-items: center; gap: 10px;">
                      <img [src]="a.foto" [alt]="a.nombre" style="width: 30px; height: 30px; border-radius: 50%;" />
                      <div>
                        <div style="font-weight: 600; color: #0f172a;">{{ a.nombre }}</div>
                        <div style="font-size: 10.5px; color: #94a3b8;">{{ a.idiomas.join(' · ') }} · {{ a.antiguedad }}</div>
                      </div>
                    </td>
                    <td style="padding: 12px; text-align: center;">
                      <app-tag [variant]="a.rol === 'Senior' ? 'blue' : a.rol === 'Middle' ? 'gray' : 'amber'">{{ a.rol }}</app-tag>
                    </td>
                    <td style="padding: 12px; text-align: center; color: #475569;">{{ a.turno }}</td>
                    <td style="padding: 12px; text-align: center; font-feature-settings: 'tnum';">{{ a.nLlamadas }}</td>
                    <td style="padding: 12px; text-align: center;">
                      <div style="display: inline-flex;">
                        <app-score-badge [value]="a.score" size="sm" />
                      </div>
                    </td>
                    <td style="padding: 12px; text-align: center; font-weight: 600; font-feature-settings: 'tnum';">{{ a.cx }}</td>
                    <td style="padding: 12px; text-align: center;">
                      <div style="display: inline-flex;">
                        <app-sparkline [data]="a.tendencia" [width]="84" [height]="20" color="#3b82f6" />
                      </div>
                    </td>
                    <td style="padding: 12px; text-align: center; font-weight: 700; font-feature-settings: 'tnum';"
                        [style.color]="a.delta >= 0 ? '#15803d' : '#dc2626'">{{ a.delta >= 0 ? '+' : '' }}{{ a.delta }}pt</td>
                    <td style="padding: 12px; text-align: center; font-feature-settings: 'tnum'; color: #475569;">€{{ a.facturacion.toLocaleString('es') }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Radar + Evolución + Temas -->
        <div class="grid grid--3">
          <div class="card">
            <div class="card__header">
              <div>
                <h3 class="card__title">Equipo vs benchmark global</h3>
                <div class="card__subtitle">Dimensiones de calidad</div>
              </div>
            </div>
            <div style="display: flex; justify-content: center;">
              <app-radar [dims]="sup.dims" [size]="220" />
            </div>
            <div style="margin-top: 12px; font-size: 11px; color: #64748b; display: flex; justify-content: space-around;">
              @for (row of dimDiff(); track row.k) {
                <div style="text-align: center;">
                  <div style="font-size: 14px; font-weight: 700;" [style.color]="row.diff >= 0 ? '#15803d' : '#dc2626'">
                    {{ row.diff >= 0 ? '+' : '' }}{{ row.diff }}
                  </div>
                  <div style="font-size: 9px; color: #94a3b8; text-transform: capitalize;">{{ row.k }}</div>
                </div>
              }
            </div>
          </div>

          <div class="card">
            <div class="card__header">
              <div>
                <h3 class="card__title">Evolución 12 semanas</h3>
                <div class="card__subtitle">Score medio del equipo</div>
              </div>
              <app-tag [variant]="sup.delta >= 0 ? 'green' : 'red'">{{ sup.delta >= 0 ? '↑ +' : '↓ ' }}{{ sup.delta }}pt</app-tag>
            </div>
            <app-sparkline [data]="sup.tendencia" [width]="280" [height]="120" color="#3b82f6" [showDots]="true" />
            <div style="margin-top: 14px; padding: 10px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #475569; line-height: 1.5;">
              <b>Semana actual:</b> {{ sup.tendencia[sup.tendencia.length - 1] }} pts<br/>
              <b>Mejor semana:</b> {{ bestWeek() }} pts<br/>
              <b>Peor semana:</b> {{ worstWeek() }} pts
            </div>
          </div>

          <div class="card">
            <div class="card__header">
              <div>
                <h3 class="card__title">Temas más tratados</h3>
                <div class="card__subtitle">Por este equipo</div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              @for (t of sup.topTemas; track t.tema; let i = $index) {
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                    <span style="color: #0f172a; font-weight: 500;">{{ t.tema }}</span>
                    <span style="color: #64748b; font-feature-settings: 'tnum';">{{ t.pct }}%</span>
                  </div>
                  <div style="height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden;">
                    <div
                      [style.width.%]="t.pct * 2.5"
                      [style.background]="colorsBar[i] || '#64748b'"
                      style="height: 100%;"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Coaching pendiente + Alertas -->
        <div class="grid grid--2" style="margin-top: 18px;">
          <div class="card">
            <div class="card__header">
              <div>
                <h3 class="card__title">Coaching pendiente</h3>
                <div class="card__subtitle">{{ sup.coachingPendiente }} highlights marcados por enviar</div>
              </div>
              <button type="button" class="btn btn--primary" style="font-size: 12px; padding: 6px 12px;">Enviar todo</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              @for (c of coachingList(); track $index) {
                <div style="display: flex; gap: 10px; padding: 10px; background: #fef3c7; border-radius: 6px; border: 1px solid #fcd34d;">
                  <img [src]="c.agente.foto" style="width: 32px; height: 32px; border-radius: 50%;" />
                  <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 13px; color: #0f172a;">{{ c.titulo }}</div>
                    <div style="font-size: 11px; color: #78350f; margin-top: 2px;">Para <b>{{ c.agente.nombre }}</b> · 3 highlights agrupados</div>
                  </div>
                  <button type="button" class="link-btn" style="font-size: 12px;">Revisar →</button>
                </div>
              }
            </div>
          </div>

          <div class="card">
            <div class="card__header">
              <div>
                <h3 class="card__title">Alertas del equipo</h3>
                <div class="card__subtitle">{{ sup.alertasAbiertas }} abiertas</div>
              </div>
            </div>
            @if (alertasList().length > 0) {
              <div style="display: flex; flex-direction: column; gap: 10px;">
                @for (al of alertasList(); track $index) {
                  <div style="display: flex; gap: 10px; padding: 10px; background: #fef2f2; border-radius: 6px; border: 1px solid #fecaca;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center;">
                      <app-icon name="alert" [size]="16" color="#dc2626" />
                    </div>
                    <div style="flex: 1;">
                      <div style="font-weight: 600; font-size: 13px; color: #991b1b;">{{ al.tipo }}</div>
                      <div style="font-size: 11px; color: #7f1d1d; margin-top: 2px;">{{ al.agente.nombre }} · hace {{ $index + 1 }}h</div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
                <app-icon name="sparkles" [size]="20" color="#15803d" />
                <div style="margin-top: 6px;">Sin alertas abiertas. Equipo en buen estado.</div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class SupervisorDetalleComponent {
  private data = inject(DataService);
  private router = inject(Router);

  id = input<string>('');

  readonly colorsBar = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#64748b'];

  s = computed(() => this.data.getSupervisor(this.id()));
  agentes = computed<Agente[]>(() => this.data.getAgentesDeSupervisor(this.id()));
  firstName = computed<string>(() => this.s()?.nombre.split(' ')[0] ?? '');

  // Agentes ordenados por score desc
  agentesSorted = computed<Agente[]>(() =>
    [...this.agentes()].sort((a, b) => b.score - a.score)
  );

  bestWeek = computed<number>(() => Math.max(...(this.s()?.tendencia ?? [0])));
  worstWeek = computed<number>(() => Math.min(...(this.s()?.tendencia ?? [0])));

  // Mejor / peor dimensión
  bestDim = computed<{ k: string; v: number }>(() => {
    const sup = this.s();
    if (!sup) return { k: '', v: 0 };
    const entries = Object.entries(sup.dims).sort((a, b) => (b[1] as number) - (a[1] as number));
    return { k: entries[0][0], v: entries[0][1] as number };
  });
  worstDim = computed<{ k: string; v: number }>(() => {
    const sup = this.s();
    if (!sup) return { k: '', v: 0 };
    const entries = Object.entries(sup.dims).sort((a, b) => (a[1] as number) - (b[1] as number));
    return { k: entries[0][0], v: entries[0][1] as number };
  });

  // Diferencia por dimensión vs promedio global
  dimDiff = computed(() => {
    const sup = this.s();
    if (!sup) return [];
    const all = this.data.agentes();
    return DIMS.map((k) => {
      const avg = Math.round(all.reduce((a, x) => a + x.dims[k], 0) / all.length);
      return { k: k as string, diff: sup.dims[k] - avg };
    });
  });

  // Coaching pendiente (simulado)
  coachingList = computed<CoachItem[]>(() => {
    const sup = this.s();
    const ags = this.agentes();
    if (!sup || !ags.length) return [];
    const titulos = ['Mejorar cierre empático', 'Técnica de escucha activa', 'Manejo de objeciones'];
    const n = Math.min(3, sup.coachingPendiente);
    return Array.from({ length: n }, (_, i) => ({
      titulo: titulos[i] ?? titulos[0],
      agente: ags[i % ags.length],
    }));
  });

  // Alertas (simuladas)
  alertasList = computed<AlertaItem[]>(() => {
    const sup = this.s();
    const ags = this.agentes();
    if (!sup || !ags.length) return [];
    const tipos = ['Caída de score', '3 llamadas seguidas <60', 'Cliente VIP insatisfecho', 'Tiempo resolución alto'];
    return Array.from({ length: sup.alertasAbiertas }, (_, i) => ({
      tipo: tipos[i % tipos.length],
      agente: ags[i % ags.length],
    }));
  });

  backToList(): void { this.router.navigate(['/supervisores']); }
  openAgente(id: string): void { this.router.navigate(['/agentes', id]); }

  hoverOn(e: MouseEvent): void { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }
  hoverOff(e: MouseEvent): void { (e.currentTarget as HTMLElement).style.background = 'transparent'; }
}
