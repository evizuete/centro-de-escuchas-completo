import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SupervisorsApiService } from '../../../core/services/supervisors-api.service';
import { Agente, Dims, Supervisor } from '../../../core/models/domain.models';
import { IconComponent } from '../../../shared/components/icon.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge.component';
import { SparklineComponent } from '../../../shared/components/sparkline.component';

type SortKey = 'score' | 'volumen' | 'alertas' | 'delta';

const DIMS: (keyof Dims)[] = ['saludo', 'empatia', 'eficiencia', 'claridad', 'producto', 'cierre'];
const DIM_LABELS: Record<string, string> = {
  saludo: 'Saludo', empatia: 'Empatía', eficiencia: 'Eficiencia',
  claridad: 'Claridad', producto: 'Producto', cierre: 'Cierre',
};

@Component({
  selector: 'app-supervisores-global',
  standalone: true,
  imports: [CommonModule, IconComponent, ScoreBadgeComponent, SparklineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page__header">
        <div>
          <h1 class="page__title">Supervisores</h1>
          <div class="page__subtitle">
            Vista global · {{ sups().length }} supervisores · {{ agentes().length }} agentes ·
            {{ totalLlamadas() }} llamadas acumuladas
          </div>
        </div>
      </header>

      @if (loading()) {
        <div style="padding: 40px; text-align: center; color: #64748b;">Cargando supervisores…</div>
      }

      @if (error()) {
        <div style="padding: 40px; text-align: center; color: #dc2626;">{{ error() }}</div>
      }

      @if (!loading() && !error()) {
      <div class="kpis" style="grid-template-columns: repeat(4, 1fr);">
        <div class="kpi-card">
          <div style="font-size: 10.5px; color: #64748b; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.25; min-height: 26px;">
            <div>Valoración</div><div style="color: #94a3b8; font-weight: 500;">Media del call center</div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">
            <div style="font-size: 26px; font-weight: 700; color: #0f172a; font-feature-settings: 'tnum';">{{ scoreMedio() }}</div>
            <div style="width: 30px; height: 30px; border-radius: 8px; background: #f59e0b14; display: flex; align-items: center; justify-content: center;">
              <app-icon name="sparkles" [size]="15" color="#f59e0b" />
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div style="font-size: 10.5px; color: #64748b; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.25; min-height: 26px;">
            <div>Experiencia</div><div style="color: #94a3b8; font-weight: 500;">Cliente global</div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">
            <div style="font-size: 26px; font-weight: 700; color: #0f172a; font-feature-settings: 'tnum';">{{ cxMedio() }}</div>
            <div style="width: 30px; height: 30px; border-radius: 8px; background: #8b5cf614; display: flex; align-items: center; justify-content: center;">
              <app-icon name="star" [size]="15" color="#8b5cf6" />
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div style="font-size: 10.5px; color: #64748b; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.25; min-height: 26px;">
            <div>Excelentes</div><div style="color: #94a3b8; font-weight: 500;">Agentes ≥ 85 pts</div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">
            <div style="font-size: 26px; font-weight: 700; color: #15803d; font-feature-settings: 'tnum';">{{ agentesExcelentes() }}</div>
            <div style="width: 30px; height: 30px; border-radius: 8px; background: #15803d14; display: flex; align-items: center; justify-content: center;">
              <app-icon name="sparkles" [size]="15" color="#15803d" />
            </div>
          </div>
          <div style="margin-top: 8px; font-size: 11px;">
            <span style="color: #94a3b8;">{{ pctExcelentes() }}% del equipo</span>
          </div>
        </div>

        <div class="kpi-card" style="border-color: #fecaca; background: #fffbfb;">
          <div style="font-size: 10.5px; color: #64748b; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.25; min-height: 26px;">
            <div>En riesgo</div><div style="color: #94a3b8; font-weight: 500;">Agentes &lt; 65 pts</div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">
            <div style="font-size: 26px; font-weight: 700; color: #dc2626; font-feature-settings: 'tnum';">{{ agentesRiesgo() }}</div>
            <div style="width: 30px; height: 30px; border-radius: 8px; background: #dc262614; display: flex; align-items: center; justify-content: center;">
              <app-icon name="alert" [size]="15" color="#dc2626" />
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 18px;">
        <div class="card__header">
          <div>
            <h3 class="card__title">Ranking de supervisores</h3>
            <div class="card__subtitle">Click en un supervisor para ver su equipo</div>
          </div>
          <div class="seg" style="font-size: 11px;">
            @for (opt of sortOptions; track opt[0]) {
              <button
                type="button"
                class="seg__btn"
                [class.seg__btn--active]="sortBy() === opt[0]"
                (click)="sortBy.set(opt[0])"
              >{{ opt[1] }}</button>
            }
          </div>
        </div>

        <div style="overflow: auto;">
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <thead>
              <tr style="font-size: 10.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                <th style="text-align: left; padding: 10px 12px;">Supervisor</th>
                <th style="text-align: left; padding: 10px 12px;">Equipo</th>
                <th style="text-align: right; padding: 10px 12px;">Agentes</th>
                <th style="text-align: right; padding: 10px 12px;">Llamadas</th>
                <th style="text-align: right; padding: 10px 12px;">Score</th>
                <th style="text-align: right; padding: 10px 12px;">CX</th>
                <th style="text-align: left; padding: 10px 12px; width: 120px;">12 sem</th>
                <th style="text-align: right; padding: 10px 12px;">Δ</th>
                <th style="text-align: right; padding: 10px 12px;">Alertas</th>
              </tr>
            </thead>
            <tbody>
              @for (s of sortedSups(); track s.id) {
                <tr
                  (click)="openSupervisor(s.id)"
                  style="cursor: pointer; border-top: 1px solid #f1f5f9;"
                  (mouseenter)="onRowEnter($event)"
                  (mouseleave)="onRowLeave($event)"
                >
                  <td style="padding: 12px; display: flex; align-items: center; gap: 10px;">
                    @if (s.foto) {
                      <img [src]="s.foto" [alt]="s.nombre" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover;" />
                    } @else {
                      <div style="width: 34px; height: 34px; border-radius: 50%; background: #e2e8f0; color: #475569; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">{{ initials(s.nombre) }}</div>
                    }
                    <div>
                      <div style="font-weight: 600; color: #0f172a;">{{ s.nombre }}</div>
                      <div style="font-size: 11px; color: #94a3b8;">{{ s.pais }} · {{ s.antiguedad }}</div>
                    </div>
                  </td>
                  <td style="padding: 12px; color: #475569;">{{ s.especializacion }}</td>
                  <td style="padding: 12px; text-align: right; font-feature-settings: 'tnum';">{{ s.nAgentes }}</td>
                  <td style="padding: 12px; text-align: right; font-feature-settings: 'tnum'; color: #475569;">{{ s.nLlamadas.toLocaleString('es') }}</td>
                  <td style="padding: 12px; text-align: right;">
                    <div style="display: inline-flex;">
                      <app-score-badge [value]="s.scoreMedio" size="sm" />
                    </div>
                  </td>
                  <td style="padding: 12px; text-align: right; font-weight: 600; font-feature-settings: 'tnum';">{{ s.cxMedio }}</td>
                  <td style="padding: 12px;">
                    @if (s.tendencia && s.tendencia.length > 0) {
                      <app-sparkline [data]="s.tendencia" [width]="100" [height]="22" color="#3b82f6" />
                    } @else {
                      <span style="color: #cbd5e1; font-size: 11px;">—</span>
                    }
                  </td>
                  <td
                    style="padding: 12px; text-align: right; font-weight: 700; font-feature-settings: 'tnum';"
                    [style.color]="s.delta >= 0 ? '#15803d' : '#dc2626'"
                  >{{ s.delta >= 0 ? '+' : '' }}{{ s.delta }}pt</td>
                  <td style="padding: 12px; text-align: right;">
                    @if (s.alertasAbiertas > 0) {
                      <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: #dc2626; font-size: 12px;">
                        <app-icon name="alert" [size]="12" color="#dc2626" /> {{ s.alertasAbiertas }}
                      </span>
                    } @else {
                      <span style="color: #94a3b8;">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid--3">
        <div class="card" style="grid-column: span 2;">
          <div class="card__header">
            <div>
              <h3 class="card__title">Mapa de fortalezas organizacional</h3>
              <div class="card__subtitle">Supervisores × dimensiones de calidad</div>
            </div>
          </div>
          <div style="overflow: auto;">
            <table style="border-collapse: separate; border-spacing: 3px; font-size: 12px;">
              <thead>
                <tr>
                  <th></th>
                  @for (d of dimsList; track d) {
                    <th style="font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 8px;">{{ dimLabel(d) }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (s of sups(); track s.id) {
                  <tr>
                    <td style="padding: 4px 10px 4px 0; font-size: 12px; color: #475569; font-weight: 500; white-space: nowrap;">{{ s.nombre }}</td>
                    @for (d of dimsList; track d) {
                      <td
                        [style.background]="heatColor(s.dims[d])"
                        style="width: 68px; height: 36px; text-align: center; color: #fff; font-weight: 700; font-size: 13px; border-radius: 4px; font-feature-settings: 'tnum';"
                      >{{ s.dims[d] }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div style="display: flex; gap: 12px; margin-top: 14px; font-size: 11px; color: #64748b; flex-wrap: wrap;">
            @for (leg of legend; track leg[1]) {
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <span [style.background]="heatColor(leg[0])" style="width: 12px; height: 12px; border-radius: 2px;"></span>
                {{ leg[1] }}
              </span>
            }
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <div>
              <h3 class="card__title">Top & Bottom agentes</h3>
              <div class="card__subtitle">Cross-equipo</div>
            </div>
          </div>

          <div style="font-size: 10.5px; color: #15803d; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 8px;">TOP 5</div>
          <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
            @for (a of topAgentes(); track a.id; let i = $index) {
              <div
                (click)="openAgente(a.id)"
                style="display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 6px; cursor: pointer;"
                (mouseenter)="onTopEnter($event)" (mouseleave)="onRowLeave($event)"
              >
                <span style="font-size: 10px; font-weight: 700; color: #15803d; width: 14px; font-feature-settings: 'tnum';">#{{ i + 1 }}</span>
                @if (a.foto) {
                  <img [src]="a.foto" style="width: 26px; height: 26px; border-radius: 50%;" />
                } @else {
                  <div style="width: 26px; height: 26px; border-radius: 50%; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px;">{{ initials(a.nombre) }}</div>
                }
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 600; font-size: 12px; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ a.nombre }}</div>
                  <div style="font-size: 10px; color: #94a3b8;">{{ supFirstName(a.supervisorId) }}</div>
                </div>
                <app-score-badge [value]="a.score" size="sm" />
              </div>
            }
          </div>

          <div style="font-size: 10.5px; color: #dc2626; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 8px;">BOTTOM 5</div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            @for (a of bottomAgentes(); track a.id; let i = $index) {
              <div
                (click)="openAgente(a.id)"
                style="display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 6px; cursor: pointer;"
                (mouseenter)="onBottomEnter($event)" (mouseleave)="onRowLeave($event)"
              >
                <span style="font-size: 10px; font-weight: 700; color: #dc2626; width: 14px; font-feature-settings: 'tnum';">#{{ i + 1 }}</span>
                @if (a.foto) {
                  <img [src]="a.foto" style="width: 26px; height: 26px; border-radius: 50%;" />
                } @else {
                  <div style="width: 26px; height: 26px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px;">{{ initials(a.nombre) }}</div>
                }
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 600; font-size: 12px; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ a.nombre }}</div>
                  <div style="font-size: 10px; color: #94a3b8;">{{ supFirstName(a.supervisorId) }}</div>
                </div>
                <app-score-badge [value]="a.score" size="sm" />
              </div>
            }
          </div>
        </div>
      </div>
      }
    </div>
  `,
})
export class SupervisoresGlobalComponent {
  private api = inject(SupervisorsApiService);
  private router = inject(Router);

  readonly sups = signal<Supervisor[]>([]);
  readonly agentes = signal<Agente[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly sortBy = signal<SortKey>('score');

  readonly sortOptions: [SortKey, string][] = [
    ['score', 'Score'], ['volumen', 'Volumen'],
    ['alertas', 'Alertas'], ['delta', 'Tendencia'],
  ];

  readonly dimsList = DIMS;
  readonly legend: [number, string][] = [
    [88, 'Excelente'], [82, 'Muy bueno'], [75, 'Bueno'], [68, 'Regular'], [0, 'Crítico'],
  ];

  readonly totalLlamadas = computed(() =>
    this.sups().reduce((a, s) => a + s.nLlamadas, 0).toLocaleString('es')
  );
  readonly scoreMedio = computed(() => {
    const s = this.sups();
    const total = s.reduce((a, x) => a + x.nAgentes, 0);
    if (!total) return 0;
    return Math.round(s.reduce((a, x) => a + x.scoreMedio * x.nAgentes, 0) / total);
  });
  readonly cxMedio = computed(() => {
    const s = this.sups();
    const total = s.reduce((a, x) => a + x.nAgentes, 0);
    if (!total) return 0;
    return Math.round(s.reduce((a, x) => a + x.cxMedio * x.nAgentes, 0) / total);
  });
  readonly agentesExcelentes = computed(() => this.agentes().filter((a) => a.score >= 85).length);
  readonly agentesRiesgo = computed(() => this.agentes().filter((a) => a.score < 65).length);
  readonly pctExcelentes = computed(() => {
    const n = this.agentes().length;
    return n ? Math.round((this.agentesExcelentes() / n) * 100) : 0;
  });

  readonly sortedSups = computed<Supervisor[]>(() => {
    const arr = [...this.sups()];
    const k = this.sortBy();
    return arr.sort((a, b) => {
      if (k === 'score') return b.scoreMedio - a.scoreMedio;
      if (k === 'volumen') return b.nLlamadas - a.nLlamadas;
      if (k === 'alertas') return b.alertasAbiertas - a.alertasAbiertas;
      return b.delta - a.delta;
    });
  });

  readonly topAgentes = computed<Agente[]>(() =>
    [...this.agentes()].sort((a, b) => b.score - a.score).slice(0, 5)
  );
  readonly bottomAgentes = computed<Agente[]>(() =>
    [...this.agentes()].sort((a, b) => a.score - b.score).slice(0, 5)
  );

  constructor() {
    forkJoin({
      sups: this.api.listSupervisors(),
      agentes: this.api.listAgents(),
    }).subscribe({
      next: ({ sups, agentes }) => {
        this.sups.set(sups);
        this.agentes.set(agentes);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los supervisores');
        console.error('[supervisores-global] error', err);
      },
    });
  }

  dimLabel(k: string): string { return DIM_LABELS[k] ?? k; }
  heatColor(v: number): string {
    if (v >= 88) return '#15803d';
    if (v >= 82) return '#22c55e';
    if (v >= 75) return '#84cc16';
    if (v >= 68) return '#f59e0b';
    return '#dc2626';
  }
  initials(nombre: string): string {
    const parts = nombre.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }
  supFirstName(id: string | undefined): string {
    if (!id) return '';
    const s = this.sups().find((x) => x.id === id);
    return s ? s.nombre.split(' ')[0] : '';
  }
  openSupervisor(id: string): void { this.router.navigate(['/supervisores', id]); }
  openAgente(id: string): void { this.router.navigate(['/agentes', id]); }
  onRowEnter(e: MouseEvent): void { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }
  onRowLeave(e: MouseEvent): void { (e.currentTarget as HTMLElement).style.background = 'transparent'; }
  onTopEnter(e: MouseEvent): void { (e.currentTarget as HTMLElement).style.background = '#f0fdf4'; }
  onBottomEnter(e: MouseEvent): void { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }
}
