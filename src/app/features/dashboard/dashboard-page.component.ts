import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { IconComponent } from '../../shared/components/icon.component';
import { TagComponent } from '../../shared/components/tag.component';
import { DonutComponent } from '../../shared/components/donut.component';
import { BarComponent } from '../../shared/components/bar.component';
import { KpiCardComponent } from './components/kpi-card.component';
import { TrendChartComponent } from './components/trend-chart.component';
import { HeatmapComponent, HeatmapView } from './components/heatmap.component';
import { QualityRadarComponent } from './components/quality-radar.component';
import { CallQuickRowComponent } from './components/call-quick-row.component';
import { Llamada } from '../../core/models/domain.models';

type Periodo = 'hoy' | 'semana' | 'mes' | 'trimestre';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    TagComponent,
    DonutComponent,
    BarComponent,
    KpiCardComponent,
    TrendChartComponent,
    HeatmapComponent,
    QualityRadarComponent,
    CallQuickRowComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <!-- Header -->
      <header class="page__header">
        <div>
          <h1 class="page__title">Dashboard</h1>
          <div class="page__subtitle">Rendimiento del equipo · Viernes 18 Abr 2026</div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <div class="seg">
            @for (p of periodos; track p) {
              <button
                type="button"
                class="seg__btn"
                [class.seg__btn--active]="periodo() === p"
                (click)="periodo.set(p)"
              >
                {{ p | titlecase }}
              </button>
            }
          </div>
          <button type="button" class="btn btn--primary" (click)="goLlamadas()">
            Ver llamadas <app-icon name="chevron" [size]="15" />
          </button>
        </div>
      </header>

      <!-- KPIs -->
      <div class="kpis">
        <app-kpi-card
          icon="phone" iconColor="#3b82f6"
          labelLine1="Llamadas" labelLine2="Total del período"
          [value]="d().kpis.llamadas.value"
          [delta]="d().kpis.llamadas.delta"
          [spark]="d().kpis.llamadas.spark"
          sparkColor="#3b82f6"
        />
        <app-kpi-card
          icon="clock" iconColor="#64748b"
          labelLine1="Duración" labelLine2="Media por llamada"
          [value]="d().kpis.duracionMedia.value"
          [sub]="'Cola: ' + d().kpis.duracionMedia.cola"
        />
        <app-kpi-card
          icon="sparkles" iconColor="#f59e0b"
          labelLine1="Valoración" labelLine2="Llamada"
          [value]="d().kpis.saludMedia.value"
          [delta]="d().kpis.saludMedia.delta + 'pt'"
          sub="vs ayer"
        />
        <app-kpi-card
          icon="star" iconColor="#8b5cf6"
          labelLine1="Experiencia" labelLine2="Cliente"
          [value]="d().kpis.experienciaCliente.value"
          [delta]="d().kpis.experienciaCliente.delta + 'pt'"
          sub="vs ayer"
        />
        <app-kpi-card
          icon="euro" iconColor="#10b981"
          labelLine1="Facturación" labelLine2="Período"
          [value]="d().kpis.facturacion.value"
          [delta]="d().kpis.facturacion.delta"
          sub="vs ayer"
        />
        <app-kpi-card
          icon="alert" iconColor="#dc2626"
          labelLine1="Riesgos" labelLine2="Altos"
          [value]="d().kpis.riesgosAltos.value"
          [sub]="d().kpis.riesgosAltos.toReview + ' por revisar'"
          [danger]="true"
        />
      </div>

      <!-- Fila 2: tendencias + sentiment + top temas -->
      <div class="grid grid--3">
        <!-- Tendencias -->
        <div class="card">
          <div class="card__header">
            <div>
              <h3 class="card__title">Tendencias · 4 semanas</h3>
              <div class="card__subtitle">Evolución semanal de KPIs clave</div>
            </div>
            <app-tag variant="green">↑ Mejora general</app-tag>
          </div>
          <app-trend-chart [data]="d().tendencias" />
        </div>

        <!-- Donut sentimiento -->
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">Sentimiento</h3>
          </div>
          <div style="display: flex; align-items: center; gap: 18px; padding: 4px 0 8px;">
            <app-donut [segments]="d().sentiment" [size]="140" [thickness]="20" />
            <div style="display: flex; flex-direction: column; gap: 7px; flex: 1;">
              @for (s of d().sentiment; track s.label) {
                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                  <span [style.background]="s.color" style="width: 8px; height: 8px; border-radius: 2px; flex: none;"></span>
                  <span style="color: #475569; flex: 1;">{{ s.label }}</span>
                  <span style="font-weight: 600; color: #0f172a; font-feature-settings: 'tnum';">{{ s.value }}%</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Distribución por tipo CRM -->
        <div class="card">
          <div class="card__header">
            <div>
              <h3 class="card__title">Distribución por tipo</h3>
              <div class="card__subtitle">Clasificación CRM · top subcategorías</div>
            </div>
            <button type="button" class="link-btn">Ver todos</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 14px; padding: 2px 0;">
            @for (t of d().distribucionTipos; track t.tipo) {
              <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                  <span [style.background]="t.color" style="width: 8px; height: 8px; border-radius: 2px; flex: none;"></span>
                  <span style="font-size: 13px; color: #0f172a; font-weight: 700; flex: 1;">{{ t.tipo }}</span>
                  <span style="font-size: 11px; color: #64748b; font-feature-settings: 'tnum';">{{ t.count }} casos</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a; min-width: 34px; text-align: right; font-feature-settings: 'tnum';">{{ t.pct }}%</span>
                </div>
                <app-bar [value]="t.pct" [color]="t.color" [height]="4" />
                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; padding-left: 18px;">
                  @for (s of t.topSub.slice(0, 3); track s.sub) {
                    <span
                      [style.background]="t.color + '10'"
                      style="font-size: 10.5px; color: #475569; padding: 2px 6px; border-radius: 3px; font-weight: 500;"
                    >
                      {{ s.sub }} <span [style.color]="t.color" style="font-weight: 700; margin-left: 2px;">{{ s.n }}</span>
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Fila 3: heatmap emocional + calidad por agente -->
      <div class="grid grid--2">
        <div class="card">
          <div class="card__header">
            <div>
              <h3 class="card__title">Mapa emocional semanal</h3>
              <div class="card__subtitle">Detecta franjas críticas · Día × hora</div>
            </div>
            <div class="seg seg--sm">
              @for (h of heatmapOptions; track h[0]) {
                <button
                  type="button"
                  class="seg__btn"
                  [class.seg__btn--active]="heatmapView() === h[0]"
                  (click)="heatmapView.set(h[0])"
                >{{ h[1] }}</button>
              }
            </div>
          </div>
          <app-heatmap [data]="d().heatmapEmocional" [view]="heatmapView()" />
        </div>

        <div class="card">
          <div class="card__header">
            <div>
              <h3 class="card__title">Calidad por agente</h3>
              <div class="card__subtitle">Dimensiones evaluadas</div>
            </div>
            <select class="select" [value]="selectedAgenteIdx()" (change)="onAgenteChange($event)">
              @for (a of d().agentesCalidad; track a.id; let i = $index) {
                <option [value]="i">{{ a.id }} · {{ a.nombre.split(' ')[0] }}</option>
              }
            </select>
          </div>
          <app-quality-radar [agente]="selectedAgente()" [todos]="d().agentesCalidad" />
        </div>
      </div>

      <!-- Fila 4: llamadas que requieren atención + alertas -->
      <div class="grid grid--2of3">
        <div class="card">
          <div class="card__header">
            <div>
              <h3 class="card__title">Llamadas que requieren atención</h3>
              <div class="card__subtitle">Priorizadas por score × riesgo × valor</div>
            </div>
            <button type="button" class="link-btn" (click)="goLlamadas()">Ver todas →</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            @for (l of llamadasAtencion(); track l.id) {
              <app-call-quick-row [llamada]="l" (open)="openCall($event)" />
            }
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <div>
              <h3 class="card__title">Alertas detectadas</h3>
              <div class="card__subtitle">
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <span style="width: 5px; height: 5px; border-radius: 50%; background: #94a3b8;"></span>
                  Tras procesar · último análisis hace ~15 min
                </span>
              </div>
            </div>
            <app-tag variant="red">{{ d().alertas.length }} pendientes</app-tag>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            @for (a of d().alertas; track $index) {
              <div class="alert-row">
                <div
                  class="alert-row__tag"
                  [class.alert-row__tag--alta]="a.nivel === 'ALTA'"
                  [class.alert-row__tag--media]="a.nivel === 'MEDIA'"
                  [class.alert-row__tag--baja]="a.nivel === 'BAJA'"
                >{{ a.nivel }}</div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 12px; font-weight: 600; color: #0f172a;">{{ a.tipo }}</div>
                  <div style="font-size: 12px; color: #475569; margin-top: 2px; line-height: 1.4;">{{ a.texto }}</div>
                  <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; display: flex; gap: 6px;">
                    <span>{{ a.agente }}</span><span>·</span><span>detectada hace {{ a.hace }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardPageComponent {
  private data = inject(DataService);
  private router = inject(Router);

  readonly d = this.data.dashboard;
  readonly periodo = signal<Periodo>('hoy');
  readonly periodos: Periodo[] = ['hoy', 'semana', 'mes', 'trimestre'];

  readonly heatmapView = signal<HeatmapView>('sentimiento');
  readonly heatmapOptions: [HeatmapView, string][] = [
    ['sentimiento', 'Sentimiento'],
    ['volumen', 'Volumen'],
    ['riesgo', 'Riesgo'],
  ];

  readonly selectedAgenteIdx = signal<number>(0);
  readonly selectedAgente = computed(() => this.d().agentesCalidad[this.selectedAgenteIdx()]);

  readonly llamadasAtencion = computed<Llamada[]>(() =>
    this.d()
      .llamadas.filter((l) => l.estado === 'A REVISAR' || l.estado === 'EN REVISIÓN')
      .slice(0, 4)
  );

  onAgenteChange(e: Event): void {
    const idx = Number((e.target as HTMLSelectElement).value);
    this.selectedAgenteIdx.set(idx);
  }

  openCall(id: string): void {
    this.router.navigate(['/llamadas', id]);
  }

  goLlamadas(): void {
    this.router.navigate(['/llamadas']);
  }
}
