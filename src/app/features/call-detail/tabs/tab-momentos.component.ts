import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleLlamada, HeatmapPunto, Momento } from '../../../core/models/domain.models';
import { TagComponent } from '../../../shared/components/tag.component';
import { BarComponent } from '../../../shared/components/bar.component';
import { tToSec } from '../../../core/services/style.utils';

const CLI_COLOR = '#3b82f6';
const AG_COLOR = '#8b5cf6';
const PRIO_COLOR: Record<string, string> = {
  ALTA: '#dc2626', MEDIA: '#f59e0b', BAJA: '#64748b',
};

const W = 760;
const H = 280;
const PAD = { l: 36, r: 20, t: 30, b: 62 };
const INNER_W = W - PAD.l - PAD.r;

@Component({
  selector: 'app-tab-momentos',
  standalone: true,
  imports: [CommonModule, TagComponent, BarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <!-- Header -->
      <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 class="section-title" style="margin: 0;">Momentos & evolución emocional</h2>
          <div class="card__subtitle" style="margin-top: 2px;">
            {{ momentos().length }} momentos detectados · Intensidad emocional cliente vs. agente
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button
            type="button"
            (click)="showClient.set(!showClient())"
            [style.background]="showClient() ? cliColor + '15' : '#fff'"
            [style.border]="'1px solid ' + (showClient() ? cliColor + '50' : '#e2e8f0')"
            [style.color]="showClient() ? cliColor : '#94a3b8'"
            style="display: inline-flex; align-items: center; gap: 6px;
                   padding: 6px 10px; border-radius: 6px;
                   font-size: 12px; font-weight: 600; cursor: pointer;"
          >
            <svg width="18" height="4">
              <line x1="0" y1="2" x2="18" y2="2" [attr.stroke]="cliColor" stroke-width="2.2" />
            </svg>
            Cliente
          </button>
          <button
            type="button"
            (click)="showAgent.set(!showAgent())"
            [style.background]="showAgent() ? agColor + '15' : '#fff'"
            [style.border]="'1px solid ' + (showAgent() ? agColor + '50' : '#e2e8f0')"
            [style.color]="showAgent() ? agColor : '#94a3b8'"
            style="display: inline-flex; align-items: center; gap: 6px;
                   padding: 6px 10px; border-radius: 6px;
                   font-size: 12px; font-weight: 600; cursor: pointer;"
          >
            <svg width="18" height="4">
              <line x1="0" y1="2" x2="18" y2="2" [attr.stroke]="agColor" stroke-width="2.2" stroke-dasharray="4 2" />
            </svg>
            Agente
          </button>
        </div>
      </div>

      <!-- Gráfico -->
      <div class="card">
        <svg width="100%" [attr.viewBox]="'0 0 ' + W + ' ' + H" style="display: block;">
          <defs>
            <linearGradient id="emoGradCli" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" [attr.stop-color]="cliColor" stop-opacity="0.18" />
              <stop offset="100%" [attr.stop-color]="cliColor" stop-opacity="0" />
            </linearGradient>
          </defs>

          <!-- Grid -->
          @for (v of gridY; track v) {
            <g>
              <line [attr.x1]="pad.l" [attr.x2]="W - pad.r" [attr.y1]="y(v)" [attr.y2]="y(v)" stroke="#f1f5f9" />
              <text [attr.x]="pad.l - 6" [attr.y]="y(v) + 3" text-anchor="end" font-size="9" fill="#94a3b8">{{ v }}</text>
            </g>
          }

          <!-- Cliente -->
          @if (showClient()) {
            <path [attr.d]="areaCli()" fill="url(#emoGradCli)" />
            <path [attr.d]="pathCli()" fill="none" [attr.stroke]="cliColor" stroke-width="2.4" stroke-linejoin="round" />
            @for (p of cliPoints(); track $index) {
              <g>
                <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#fff" [attr.stroke]="p.color" stroke-width="2" />
                <text [attr.x]="p.x" [attr.y]="p.y - 10" text-anchor="middle" font-size="8.5" fill="#64748b" style="text-transform: capitalize;">{{ p.emocion }}</text>
              </g>
            }
          }

          <!-- Agente -->
          @if (showAgent() && pathAg()) {
            <path [attr.d]="pathAg()" fill="none" [attr.stroke]="agColor" stroke-width="2" stroke-dasharray="5 3" stroke-linejoin="round" />
            @for (p of agPoints(); track $index) {
              <rect
                [attr.x]="p.x - 3.5" [attr.y]="p.y - 3.5"
                width="7" height="7"
                fill="#fff" [attr.stroke]="agColor" stroke-width="1.8"
                [attr.transform]="'rotate(45 ' + p.x + ' ' + p.y + ')'"
              />
            }
          }

          <!-- Pins momentos -->
          @for (m of momentoPins(); track $index; let i = $index) {
            <g style="cursor: pointer;"
               (mouseenter)="hoverId.set(i)"
               (mouseleave)="hoverId.set(null)">
              <line
                [attr.x1]="m.x" [attr.x2]="m.x"
                [attr.y1]="pad.t" [attr.y2]="H - pad.b"
                [attr.stroke]="m.col"
                [attr.stroke-width]="hoverId() === i ? 1.6 : 1"
                stroke-dasharray="2 3"
                [attr.opacity]="hoverId() === i ? 0.9 : 0.4"
              />
              <circle
                [attr.cx]="m.x" [attr.cy]="m.y"
                [attr.r]="hoverId() === i ? 8 : 6"
                [attr.fill]="m.col"
                stroke="#fff" stroke-width="2"
              />
              <text [attr.x]="m.x" [attr.y]="m.y + 3" text-anchor="middle" font-size="8.5" fill="#fff" font-weight="700">{{ i + 1 }}</text>
            </g>
          }

          <!-- Eje X -->
          @for (f of xTicks; track f) {
            <text
              [attr.x]="pad.l + innerW * f"
              [attr.y]="H - 44"
              text-anchor="middle" font-size="9" fill="#94a3b8"
              font-feature-settings='"tnum"'
            >{{ formatTick(f) }}</text>
          }

          <!-- Leyenda inferior -->
          <g [attr.transform]="'translate(' + pad.l + ', ' + (H - 18) + ')'">
            <line x1="0" y1="0" x2="16" y2="0" [attr.stroke]="cliColor" stroke-width="2.4" />
            <circle cx="8" cy="0" r="2.5" fill="#fff" [attr.stroke]="cliColor" stroke-width="1.5" />
            <text x="22" y="3" font-size="10" fill="#475569" font-weight="600">Cliente</text>
            <line x1="80" y1="0" x2="96" y2="0" [attr.stroke]="agColor" stroke-width="2" stroke-dasharray="4 2" />
            <rect x="84.5" y="-3" width="7" height="7" fill="#fff" [attr.stroke]="agColor" stroke-width="1.5" transform="rotate(45 88 0)" />
            <text x="102" y="3" font-size="10" fill="#475569" font-weight="600">Agente</text>
            <circle cx="165" cy="0" r="5" fill="#dc2626" stroke="#fff" stroke-width="1.5" />
            <text x="175" y="3" font-size="10" fill="#64748b">Momento clave</text>
          </g>
        </svg>
      </div>

      <!-- Insight automático -->
      @if (insight(); as ins) {
        <div style="margin-top: 14px; padding: 12px 14px; background: #f8fafc; border-radius: 8px;
                    border: 1px solid #e2e8f0; display: flex; gap: 10px; align-items: flex-start;">
          <span style="font-size: 18px; line-height: 1;">📊</span>
          <div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 3px;">Insight</div>
            <div style="font-size: 13px; color: #0f172a; line-height: 1.5;">{{ ins.msg }}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; display: flex; gap: 12px;">
              <span>Media cliente: <strong [style.color]="cliColor">{{ ins.avgCli }}</strong></span>
              <span>Media agente: <strong [style.color]="agColor">{{ ins.avgAg }}</strong></span>
            </div>
          </div>
        </div>
      }

      <!-- Listado de momentos -->
      <h3 class="section-subtitle" style="margin-top: 22px;">Momentos detectados en orden</h3>
      <div style="display: flex; flex-direction: column; gap: 0; margin-top: 12px;">
        @for (row of momentoRows(); track $index; let i = $index) {
          <div
            (mouseenter)="hoverId.set(i)"
            (mouseleave)="hoverId.set(null)"
            [style.background]="hoverId() === i ? '#f8fafc' : '#fff'"
            [style.borderLeft]="'3px solid ' + row.prio"
            style="display: flex; gap: 12px; padding: 14px 16px;
                   border: 1px solid #f1f5f9;
                   border-radius: 8px; margin-bottom: 8px; align-items: stretch;
                   transition: background 0.15s;"
          >
            <div
              [style.background]="row.prio"
              style="width: 28px; height: 28px; border-radius: 50%;
                     color: #fff; font-weight: 700; font-size: 12px;
                     display: flex; align-items: center; justify-content: center; flex: none; margin-top: 2px;"
            >{{ i + 1 }}</div>

            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                <span style="font-size: 12px; color: #64748b; font-weight: 600; font-feature-settings: 'tnum';">{{ row.m.t }}</span>
                <app-tag variant="blue">{{ row.m.tipo }}</app-tag>
                <app-tag variant="slate">{{ row.m.actor }}</app-tag>
                <app-tag [variant]="row.m.prioridad === 'ALTA' ? 'red' : row.m.prioridad === 'MEDIA' ? 'amber' : 'slate'">{{ row.m.prioridad }}</app-tag>
              </div>
              <div style="font-size: 14px; color: #0f172a; line-height: 1.5;">{{ row.m.texto }}</div>
            </div>

            <!-- Cliente -->
            <div
              [style.background]="cliColor + '10'"
              [style.borderLeft]="'3px solid ' + cliColor"
              style="flex: none; width: 140px;
                     display: flex; flex-direction: column; justify-content: center;
                     padding: 8px 10px; border-radius: 6px;"
            >
              <div [style.color]="cliColor" style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">
                Cliente
              </div>
              <div style="display: flex; align-items: baseline; gap: 6px;">
                <span
                  style="font-size: 13px; font-weight: 700; text-transform: capitalize; line-height: 1.2;"
                  [style.color]="row.emoColor"
                >{{ row.nearCli }}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                <span
                  style="font-size: 16px; font-weight: 700; font-feature-settings: 'tnum'; line-height: 1;"
                  [style.color]="row.emoColor"
                >{{ row.intensidadCli }}</span>
                <div style="flex: 1;">
                  <app-bar [value]="row.intensidadCli" [color]="row.emoColor" [height]="3" />
                </div>
              </div>
            </div>

            <!-- Agente -->
            @if (row.intensidadAg !== null) {
              <div
                [style.background]="agColor + '10'"
                [style.borderLeft]="'3px solid ' + agColor"
                style="flex: none; width: 140px;
                       display: flex; flex-direction: column; justify-content: center;
                       padding: 8px 10px; border-radius: 6px;"
              >
                <div [style.color]="agColor" style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">
                  Agente
                </div>
                <div style="display: flex; align-items: baseline; gap: 6px;">
                  <span
                    style="font-size: 13px; font-weight: 700; text-transform: capitalize; line-height: 1.2;"
                    [style.color]="agColor"
                  >{{ row.nearAg }}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                  <span
                    style="font-size: 16px; font-weight: 700; font-feature-settings: 'tnum'; line-height: 1;"
                    [style.color]="agColor"
                  >{{ row.intensidadAg }}</span>
                  <div style="flex: 1;">
                    <app-bar [value]="row.intensidadAg" [color]="agColor" [height]="3" />
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class TabMomentosComponent {
  d = input.required<DetalleLlamada>();

  readonly hoverId = signal<number | null>(null);
  readonly showClient = signal<boolean>(true);
  readonly showAgent = signal<boolean>(true);

  readonly cliColor = CLI_COLOR;
  readonly agColor = AG_COLOR;
  readonly W = W;
  readonly H = H;
  readonly pad = PAD;
  readonly innerW = INNER_W;
  readonly gridY = [0, 25, 50, 75, 100];
  readonly xTicks = [0, 0.25, 0.5, 0.75, 1];

  emo = computed<HeatmapPunto[]>(() => this.d().heatmapLlamada);
  emoAg = computed<HeatmapPunto[]>(() => this.d().heatmapAgente);
  momentos = computed<Momento[]>(() => this.d().momentos);

  emoSecs = computed<number[]>(() => this.emo().map((e) => tToSec(e.t)));
  emoAgSecs = computed<number[]>(() => this.emoAg().map((e) => tToSec(e.t)));
  momSecs = computed<number[]>(() => this.momentos().map((m) => tToSec(m.t)));

  totalSec = computed<number>(() => Math.max(...this.emoSecs(), ...this.emoAgSecs(), ...this.momSecs()));

  x(sec: number): number {
    return PAD.l + (sec / this.totalSec()) * INNER_W;
  }
  y(v: number): number {
    return PAD.t + (1 - v / 100) * (H - PAD.t - PAD.b);
  }

  pathCli = computed<string>(() =>
    this.emo()
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${this.x(this.emoSecs()[i])},${this.y(p.intensidad)}`)
      .join(' ')
  );

  areaCli = computed<string>(() => {
    const secs = this.emoSecs();
    if (!secs.length) return '';
    return `${this.pathCli()} L${this.x(secs[secs.length - 1])},${H - PAD.b} L${this.x(secs[0])},${H - PAD.b} Z`;
  });

  pathAg = computed<string>(() =>
    this.emoAg()
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${this.x(this.emoAgSecs()[i])},${this.y(p.intensidad)}`)
      .join(' ')
  );

  cliPoints = computed(() => {
    return this.emo().map((p, i) => {
      const color = p.intensidad >= 80 ? '#22c55e' : p.intensidad >= 60 ? CLI_COLOR : p.intensidad >= 40 ? '#f59e0b' : '#ef4444';
      return { x: this.x(this.emoSecs()[i]), y: this.y(p.intensidad), emocion: p.emocion, color };
    });
  });

  agPoints = computed(() => {
    return this.emoAg().map((p, i) => ({
      x: this.x(this.emoAgSecs()[i]),
      y: this.y(p.intensidad),
    }));
  });

  momentoPins = computed(() => {
    const secs = this.momSecs();
    return this.momentos().map((m, i) => {
      const mx = this.x(secs[i]);
      const my = this.y(this.emoAt(secs[i], this.emo(), this.emoSecs()));
      const col = PRIO_COLOR[m.prioridad] ?? '#64748b';
      return { x: mx, y: my, col };
    });
  });

  // Listado de momentos con emoción más cercana de cliente/agente
  momentoRows = computed(() => {
    const secs = this.momSecs();
    return this.momentos().map((m, i) => {
      const intensidadCli = Math.round(this.emoAt(secs[i], this.emo(), this.emoSecs()));
      const hasAg = this.emoAg().length > 0;
      const intensidadAg = hasAg ? Math.round(this.emoAt(secs[i], this.emoAg(), this.emoAgSecs())) : null;
      const emoColor = intensidadCli >= 80 ? '#22c55e' : intensidadCli >= 60 ? CLI_COLOR : intensidadCli >= 40 ? '#f59e0b' : '#ef4444';
      const prio = PRIO_COLOR[m.prioridad] ?? '#64748b';

      const nearCli = this.nearestIn(this.emo(), this.emoSecs(), secs[i])?.emocion ?? '';
      const nearAg = hasAg ? (this.nearestIn(this.emoAg(), this.emoAgSecs(), secs[i])?.emocion ?? '') : '';

      return { m, prio, emoColor, intensidadCli, intensidadAg, nearCli, nearAg };
    });
  });

  insight = computed(() => {
    if (!this.emoAg().length) return null;
    const avgCli = Math.round(this.emo().reduce((a, b) => a + b.intensidad, 0) / this.emo().length);
    const avgAg = Math.round(this.emoAg().reduce((a, b) => a + b.intensidad, 0) / this.emoAg().length);
    const diff = avgCli - avgAg;
    const abs = Math.abs(diff);
    let msg = '';
    if (abs < 5) {
      msg = 'Cliente y agente muestran intensidad emocional muy similar durante toda la llamada — conexión sólida.';
    } else if (diff > 0) {
      msg = `El cliente supera al agente en ${abs} puntos de intensidad media — muestra mayor entusiasmo que el agente durante la conversación.`;
    } else {
      msg = `El agente mantiene ${abs} puntos más de energía emocional que el cliente — puede haber intentado elevar el tono.`;
    }
    return { msg, avgCli, avgAg };
  });

  formatTick(f: number): string {
    const sec = this.totalSec() * f;
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // interpolación lineal de intensidad en `sec`
  private emoAt(sec: number, arr: HeatmapPunto[], secs: number[]): number {
    if (!arr.length) return 50;
    if (sec <= secs[0]) return arr[0].intensidad;
    if (sec >= secs[secs.length - 1]) return arr[arr.length - 1].intensidad;
    for (let i = 1; i < secs.length; i++) {
      if (sec <= secs[i]) {
        const t = (sec - secs[i - 1]) / (secs[i] - secs[i - 1]);
        return arr[i - 1].intensidad + (arr[i].intensidad - arr[i - 1].intensidad) * t;
      }
    }
    return 50;
  }

  private nearestIn(arr: HeatmapPunto[], secs: number[], momSec: number): HeatmapPunto | undefined {
    let nearest = arr[0];
    let minDiff = Infinity;
    arr.forEach((e, j) => {
      const d = Math.abs(secs[j] - momSec);
      if (d < minDiff) {
        minDiff = d;
        nearest = e;
      }
    });
    return nearest;
  }
}
