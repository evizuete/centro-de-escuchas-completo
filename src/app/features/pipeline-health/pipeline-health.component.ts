import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { EventsApiService } from '../../core/services/events-api.service';
import {
  eventTypeLabel,
  EventSummaryItem,
  LogEventItem,
  LogLevel,
  levelClasses,
} from '../../core/models/events.models';

type Range = '24h' | '7d' | '30d';

interface Alert {
  eventType: string;
  phase: string | null;
  current: number;
  previous: number;
  ratio: number;
  severity: 'critical' | 'warning' | 'info';
}

/**
 * Dashboard de salud del pipeline.
 *
 * Bloques:
 *   1. Cabecera con rango + acciones
 *   2. Alertas calculadas comparando ventana actual vs anterior
 *   3. KPIs (totales, INFO, WARN, ERROR)
 *   4. Gráfico de tendencia diaria
 *   5. Tabla top event_types con drill-down a llamadas
 *   6. Lista de eventos recientes con detalle expandible (JSON data)
 */
@Component({
  selector: 'app-pipeline-health',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, DecimalPipe],
  template: `
    <div style="padding: 24px; max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 22px;">

      <!-- ==================== Cabecera ==================== -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">
          Salud del pipeline
        </h1>
        <div style="display: flex; align-items: center; gap: 10px;">
          <label style="font-size: 13px; color: #475569;">Rango:</label>
          <select
              style="padding: 7px 12px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px;
                   font-size: 13px; color: #334155; cursor: pointer;"
              [ngModel]="range()"
              (ngModelChange)="range.set($event); reload()"
          >
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
          </select>
          <button
              type="button"
              style="padding: 7px 14px; background: #4f46e5; color: #fff; border: 0; border-radius: 6px;
                   font-size: 13px; font-weight: 500; cursor: pointer;"
              (click)="reload()"
          >
            Actualizar
          </button>
          <button
              type="button"
              style="padding: 7px 14px; background: #fff; color: #334155; border: 1px solid #cbd5e1;
                   border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;
                   display: flex; align-items: center; gap: 6px;"
              (click)="exportSummary()"
              title="Descargar CSV con los datos del summary"
          >
            <svg style="width: 14px; height: 14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      <!-- ==================== Alertas activas ==================== -->
      @if (alerts().length > 0) {
        <div style="padding: 16px 20px; background: #fef3c7; border: 1px solid #fcd34d;
                    border-radius: 12px;">
          <h2 style="font-size: 13px; font-weight: 700; color: #78350f; margin: 0 0 10px 0;
                     display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">⚠</span> Alertas activas
          </h2>
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;">
            @for (a of alerts(); track a.eventType) {
              <li style="font-size: 13px; color: #78350f; line-height: 1.5;">
                <span style="font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px;
                             background: #fff; padding: 2px 6px; border-radius: 4px;
                             border: 1px solid #fcd34d;">{{ a.eventType }}</span>
                @if (a.phase) {
                  <span style="color: #92400e; margin-left: 4px;">· {{ a.phase }}</span>
                }
                — subió
                <span style="font-weight: 700;">{{ a.ratio | number: '1.1-1' }}×</span>
                vs periodo anterior
                <span style="color: #92400e;">({{ a.previous }} → {{ a.current }})</span>
              </li>
            }
          </ul>
        </div>
      }

      <!-- ==================== KPIs ==================== -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
        <!-- Total -->
        <div style="padding: 18px 20px; background: #fff; border: 1px solid #e2e8f0;
                    border-radius: 12px;">
          <div style="font-size: 10.5px; font-weight: 700; color: #64748b;
                      letter-spacing: 0.8px; text-transform: uppercase;">
            Eventos totales
          </div>
          <div style="margin-top: 6px; font-size: 32px; font-weight: 700;
                      font-feature-settings: 'tnum'; color: #0f172a; line-height: 1.1;">
            {{ totalEvents() | number }}
          </div>
          <div style="margin-top: 4px; font-size: 11px; color: #94a3b8;">
            en el periodo seleccionado
          </div>
        </div>

        <!-- INFO -->
        <div style="padding: 18px 20px; background: #fff; border: 1px solid #e2e8f0;
                    border-radius: 12px;">
          <div style="font-size: 10.5px; font-weight: 700; color: #059669;
                      letter-spacing: 0.8px; text-transform: uppercase;">
            INFO
          </div>
          <div style="margin-top: 6px; font-size: 32px; font-weight: 700;
                      font-feature-settings: 'tnum'; color: #047857; line-height: 1.1;">
            {{ countsByLevel()['INFO'] || 0 | number }}
          </div>
          <div style="margin-top: 8px; height: 3px; border-radius: 2px; background: #d1fae5;
                      overflow: hidden;">
            <div style="height: 100%; background: #10b981;"
                 [style.width.%]="levelPct('INFO')"></div>
          </div>
        </div>

        <!-- WARN -->
        <div style="padding: 18px 20px; background: #fff; border: 1px solid #e2e8f0;
                    border-radius: 12px;">
          <div style="font-size: 10.5px; font-weight: 700; color: #d97706;
                      letter-spacing: 0.8px; text-transform: uppercase;">
            Warnings
          </div>
          <div style="margin-top: 6px; font-size: 32px; font-weight: 700;
                      font-feature-settings: 'tnum'; color: #b45309; line-height: 1.1;">
            {{ countsByLevel()['WARN'] || 0 | number }}
          </div>
          <div style="margin-top: 8px; height: 3px; border-radius: 2px; background: #fef3c7;
                      overflow: hidden;">
            <div style="height: 100%; background: #f59e0b;"
                 [style.width.%]="levelPct('WARN')"></div>
          </div>
        </div>

        <!-- ERROR -->
        <div style="padding: 18px 20px; background: #fff; border: 1px solid #e2e8f0;
                    border-radius: 12px;">
          <div style="font-size: 10.5px; font-weight: 700; color: #dc2626;
                      letter-spacing: 0.8px; text-transform: uppercase;">
            Errors
          </div>
          <div style="margin-top: 6px; font-size: 32px; font-weight: 700;
                      font-feature-settings: 'tnum'; color: #b91c1c; line-height: 1.1;">
            {{ countsByLevel()['ERROR'] || 0 | number }}
          </div>
          <div style="margin-top: 8px; height: 3px; border-radius: 2px; background: #fee2e2;
                      overflow: hidden;">
            <div style="height: 100%; background: #ef4444;"
                 [style.width.%]="levelPct('ERROR')"></div>
          </div>
        </div>
      </div>

      <!-- ==================== Tendencia diaria ==================== -->
      <div style="padding: 18px 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0;">
          Tendencia diaria
        </h2>
        @if (trend().length === 0) {
          <div style="padding: 28px; text-align: center; color: #94a3b8; font-size: 13px;">
            Sin datos suficientes para mostrar tendencia.
          </div>
        } @else {
          <div style="display: flex; align-items: flex-end; gap: 3px; height: 140px;
                      border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
            @for (d of trend(); track d.day) {
              <div
                  style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end; min-width: 8px;"
                  [title]="d.day + ' · ' + d.warn + ' WARN · ' + d.error + ' ERROR'"
              >
                @if (d.error > 0) {
                  <div style="background: #ef4444; width: 100%; border-radius: 2px 2px 0 0;"
                       [style.height.%]="(d.error / maxDaily()) * 85"></div>
                }
                @if (d.warn > 0) {
                  <div style="background: #f59e0b; width: 100%;"
                       [style.border-radius]="d.error === 0 ? '2px 2px 0 0' : '0'"
                       [style.height.%]="(d.warn / maxDaily()) * 85"></div>
                }
              </div>
            }
          </div>
          <div style="margin-top: 8px; display: flex; justify-content: space-between;
                      font-size: 11px; color: #94a3b8; font-family: ui-monospace, Menlo, Consolas, monospace;">
            <span>{{ trend()[0].day }}</span>
            <span>{{ trend()[trend().length - 1].day }}</span>
          </div>
          <!-- Leyenda -->
          <div style="margin-top: 12px; display: flex; gap: 16px; font-size: 11px; color: #64748b;">
            <span style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; background: #f59e0b; border-radius: 2px;"></span>
              WARN
            </span>
            <span style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; background: #ef4444; border-radius: 2px;"></span>
              ERROR
            </span>
          </div>
        }
      </div>

      <!-- ==================== Top tipos de evento ==================== -->
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0;
                    display: flex; align-items: center; justify-content: space-between;">
          <h2 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;">
            Top tipos de evento
          </h2>
          <div style="font-size: 11px; color: #94a3b8;">
            Click en una fila para ver las llamadas afectadas
          </div>
        </div>

        @if (loading()) {
          <div style="padding: 40px; text-align: center; color: #94a3b8; font-size: 13px;">
            Cargando...
          </div>
        } @else if (summary().length === 0) {
          <div style="padding: 40px; text-align: center; color: #94a3b8; font-size: 13px;">
            Sin eventos en este rango.
          </div>
        } @else {
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <thead>
            <tr style="background: #f8fafc; font-size: 11px; color: #64748b;
                         letter-spacing: 0.5px; text-transform: uppercase;">
              <th style="text-align: left; padding: 10px 16px; font-weight: 600;">Evento</th>
              <th style="text-align: left; padding: 10px 16px; font-weight: 600;">Fase</th>
              <th style="text-align: left; padding: 10px 16px; font-weight: 600;">Nivel</th>
              <th style="text-align: right; padding: 10px 16px; font-weight: 600;">Ocurrencias</th>
              <th style="text-align: right; padding: 10px 16px; font-weight: 600;">Último</th>
              <th style="width: 28px;"></th>
            </tr>
            </thead>
            <tbody>
              @for (item of summary(); track item.event_type + item.phase) {
                <tr
                    style="cursor: pointer; border-top: 1px solid #f1f5f9; transition: background 0.12s;"
                    [routerLink]="['/llamadas']"
                    [queryParams]="drillParams(item)"
                    [title]="'Ver las ' + item.count + ' llamadas afectadas'"
                    (mouseenter)="hoverRow.set(item.event_type + (item.phase || ''))"
                    (mouseleave)="hoverRow.set(null)"
                    [style.background]="hoverRow() === (item.event_type + (item.phase || '')) ? '#eef2ff' : 'transparent'"
                >
                  <td style="padding: 12px 16px;">
                    <div style="font-weight: 500; color: #0f172a;">
                      {{ labelFor(item.event_type) }}
                    </div>
                    <div style="font-size: 11px; color: #64748b;
                                font-family: ui-monospace, Menlo, Consolas, monospace; margin-top: 2px;">
                      {{ item.event_type }}
                    </div>
                  </td>
                  <td style="padding: 12px 16px; font-size: 11px;
                             font-family: ui-monospace, Menlo, Consolas, monospace; color: #64748b;">
                    {{ item.phase || '—' }}
                  </td>
                  <td style="padding: 12px 16px;">
                    <span
                        style="display: inline-block; padding: 2px 8px; border-radius: 999px;
                             font-size: 10.5px; font-weight: 700; letter-spacing: 0.4px;"
                        [style.background]="levelBadgeBg(item.level)"
                        [style.color]="levelBadgeFg(item.level)"
                    >
                      {{ item.level }}
                    </span>
                  </td>
                  <td style="padding: 12px 16px; text-align: right; font-feature-settings: 'tnum';
                             font-weight: 600; color: #0f172a;">
                    {{ item.count }}
                  </td>
                  <td style="padding: 12px 16px; text-align: right; font-size: 11px;
                             color: #94a3b8; font-feature-settings: 'tnum';">
                    {{ item.last_seen | date: 'dd/MM HH:mm' }}
                  </td>
                  <td style="padding: 12px 8px; text-align: right; color: #6366f1; font-weight: 600;"
                      [style.opacity]="hoverRow() === (item.event_type + (item.phase || '')) ? '1' : '0'">
                    →
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- ==================== Eventos recientes con detalle expandible ==================== -->
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0;
                    display: flex; align-items: center; justify-content: space-between;">
          <h2 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;">
            Eventos recientes
          </h2>
          <div style="font-size: 11px; color: #94a3b8;">
            Click en un evento para ver el detalle JSON
          </div>
        </div>

        @if (recentEvents().length === 0) {
          <div style="padding: 40px; text-align: center; color: #94a3b8; font-size: 13px;">
            Sin eventos recientes.
          </div>
        } @else {
          <div>
            @for (ev of displayedEvents(); track ev.id) {
              <div style="border-top: 1px solid #f1f5f9;">
                <div
                    style="padding: 12px 20px; cursor: pointer; display: flex; gap: 12px;
                         align-items: flex-start; transition: background 0.12s;"
                    [style.background]="expandedId() === ev.id ? '#f8fafc' : 'transparent'"
                    (click)="toggleExpand(ev.id)"
                >
                  <span
                      style="flex-shrink: 0; display: inline-block; padding: 2px 8px; border-radius: 999px;
                           font-size: 10.5px; font-weight: 700; letter-spacing: 0.4px; margin-top: 2px;"
                      [style.background]="levelBadgeBg(ev.level)"
                      [style.color]="levelBadgeFg(ev.level)"
                  >
                    {{ ev.level }}
                  </span>
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;">
                      <span style="font-family: ui-monospace, Menlo, Consolas, monospace;
                                   font-size: 12px; font-weight: 600; color: #334155;">
                        {{ ev.event_type }}
                      </span>
                      @if (ev.phase) {
                        <span style="font-size: 11px; color: #64748b;">· {{ ev.phase }}</span>
                      }
                      @if (ev.call_id) {
                        <a
                            [routerLink]="['/llamadas', ev.call_id]"
                            (click)="$event.stopPropagation()"
                            style="font-size: 11px; color: #6366f1; text-decoration: none;
                                 font-family: ui-monospace, Menlo, Consolas, monospace;"
                            title="Ver llamada"
                        >
                          · {{ ev.call_id.substring(0, 8) }}…
                        </a>
                      }
                      <span style="margin-left: auto; font-size: 11px; color: #94a3b8;
                                   font-feature-settings: 'tnum';">
                        {{ ev.ts | date: 'dd/MM HH:mm:ss' }}
                      </span>
                    </div>
                    @if (ev.message) {
                      <div style="margin-top: 4px; font-size: 13px; color: #475569;
                                  line-height: 1.5; word-break: break-word;
                                  white-space: pre-wrap; overflow-wrap: anywhere;">
                        @if (isMessageLong(ev) && !messageExpanded().has(ev.id)) {
                          {{ truncateMessage(ev.message) }}<!--
                          --><button
                              type="button"
                              (click)="toggleMessage(ev.id, $event)"
                              style="margin-left: 6px; padding: 0; background: none; border: 0;
                                   color: #6366f1; font-size: 12px; font-weight: 500;
                                   cursor: pointer; text-decoration: underline;"
                          >Ver más</button>
                        } @else {
                          {{ ev.message }}
                          @if (isMessageLong(ev)) {
                            <button
                                type="button"
                                (click)="toggleMessage(ev.id, $event)"
                                style="margin-left: 6px; padding: 0; background: none; border: 0;
                                     color: #6366f1; font-size: 12px; font-weight: 500;
                                     cursor: pointer; text-decoration: underline;"
                            >Ver menos</button>
                          }
                        }
                      </div>
                    }
                  </div>
                  <span style="flex-shrink: 0; color: #94a3b8; font-size: 12px; margin-top: 2px;"
                        [style.transform]="expandedId() === ev.id ? 'rotate(90deg)' : 'none'"
                        style="transition: transform 0.15s;">
                    ›
                  </span>
                </div>

                @if (expandedId() === ev.id) {
                  <div style="padding: 14px 20px 16px 52px; background: #f8fafc;
                              border-top: 1px dashed #e2e8f0;">
                    @if (ev.duration_ms !== null && ev.duration_ms !== undefined) {
                      <div style="margin-bottom: 10px; font-size: 12px; color: #64748b;">
                        <b style="color: #334155;">Duración:</b>
                        {{ ev.duration_ms }} ms
                      </div>
                    }
                    @if (hasData(ev)) {
                      <div style="font-size: 11.5px; color: #64748b; margin-bottom: 6px;
                                  font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
                        Data
                      </div>
                      <pre style="margin: 0; padding: 12px 14px; background: #0f172a; color: #e2e8f0;
                                  border-radius: 8px; font-size: 12px; line-height: 1.5;
                                  font-family: ui-monospace, Menlo, Consolas, monospace;
                                  overflow-x: auto; white-space: pre-wrap; word-break: break-word;">{{ formatData(ev) }}</pre>
                    } @else {
                      <div style="font-size: 12px; color: #94a3b8; font-style: italic;">
                        Sin datos adicionales.
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          @if (recentEvents().length > displayLimit()) {
            <div style="padding: 14px 20px; text-align: center; border-top: 1px solid #f1f5f9;
                        background: #f8fafc;">
              <button
                  type="button"
                  style="padding: 7px 18px; background: #fff; border: 1px solid #cbd5e1;
                       border-radius: 6px; font-size: 12px; color: #334155; cursor: pointer;
                       font-weight: 500;"
                  (click)="showMore()"
              >
                Mostrar más ({{ recentEvents().length - displayLimit() }} restantes)
              </button>
            </div>
          }
        }
      </div>

    </div>
  `,
})
export class PipelineHealthComponent implements OnInit {
  private api = inject(EventsApiService);

  range = signal<Range>('7d');
  loading = signal<boolean>(false);
  summary = signal<EventSummaryItem[]>([]);
  summaryPrevious = signal<EventSummaryItem[]>([]);
  recentEvents = signal<LogEventItem[]>([]);

  hoverRow = signal<string | null>(null);
  expandedId = signal<number | null>(null);
  messageExpanded = signal<Set<number>>(new Set());
  displayLimit = signal<number>(30);

  // Umbral para considerar un mensaje "largo" y mostrar el toggle "Ver más"
  private readonly MESSAGE_PREVIEW_LIMIT = 160;

  // Conteos derivados
  totalEvents = computed(() =>
      this.summary().reduce((a, s) => a + s.count, 0),
  );

  countsByLevel = computed<Partial<Record<LogLevel, number>>>(() => {
    const out: Partial<Record<LogLevel, number>> = {};
    for (const item of this.summary()) {
      out[item.level] = (out[item.level] ?? 0) + item.count;
    }
    return out;
  });

  trend = computed(() => {
    // Agrupar recentEvents por día
    const byDay = new Map<string, { warn: number; error: number }>();
    for (const ev of this.recentEvents()) {
      const day = ev.ts.substring(0, 10); // YYYY-MM-DD
      const entry = byDay.get(day) ?? { warn: 0, error: 0 };
      if (ev.level === 'WARN') entry.warn++;
      else if (ev.level === 'ERROR') entry.error++;
      byDay.set(day, entry);
    }
    return Array.from(byDay.entries())
        .map(([day, counts]) => ({ day, ...counts }))
        .sort((a, b) => a.day.localeCompare(b.day));
  });

  maxDaily = computed(() => {
    let m = 1;
    for (const d of this.trend()) {
      m = Math.max(m, d.warn + d.error);
    }
    return m;
  });

  displayedEvents = computed(() =>
      this.recentEvents().slice(0, this.displayLimit())
  );

  alerts = computed<Alert[]>(() => {
    // Comparar ventana actual vs anterior por event_type+phase
    const prevMap = new Map<string, number>();
    for (const s of this.summaryPrevious()) {
      const key = `${s.event_type}|${s.phase ?? ''}`;
      prevMap.set(key, (prevMap.get(key) ?? 0) + s.count);
    }

    const alerts: Alert[] = [];
    for (const s of this.summary()) {
      const key = `${s.event_type}|${s.phase ?? ''}`;
      const prev = prevMap.get(key) ?? 0;
      const curr = s.count;

      // Umbrales: sube al menos 2x y supera 3 ocurrencias en la ventana actual
      if (curr >= 3 && prev > 0 && curr >= prev * 2) {
        const ratio = curr / prev;
        alerts.push({
          eventType: s.event_type,
          phase: s.phase,
          current: curr,
          previous: prev,
          ratio,
          severity:
              ratio >= 5 ? 'critical' : ratio >= 3 ? 'warning' : 'info',
        });
      }

      // Error nuevo que antes no existía
      if (curr >= 3 && prev === 0 && s.level === 'ERROR') {
        alerts.push({
          eventType: s.event_type,
          phase: s.phase,
          current: curr,
          previous: 0,
          ratio: Infinity,
          severity: 'critical',
        });
      }
    }

    return alerts.sort((a, b) => b.ratio - a.ratio).slice(0, 5);
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.displayLimit.set(30);
    this.expandedId.set(null);
    this.messageExpanded.set(new Set());
    const hours = this.hoursForRange(this.range());

    // Cargar summary de la ventana actual
    this.api.getSummary({ hours, level: 'WARN' }).subscribe({
      next: (items) => this.summary.set(items),
      error: () => this.summary.set([]),
    });

    // Baseline: ventana doble → aproximación para alertas
    this.api.getSummary({ hours: hours * 2, level: 'WARN' }).subscribe({
      next: (items) => {
        this.summaryPrevious.set(
            items.map((it) => ({
              ...it,
              count: Math.max(0, Math.round(it.count / 2)),
            })),
        );
      },
      error: () => this.summaryPrevious.set([]),
    });

    // Eventos recientes (INFO incluido para tendencia)
    this.api
        .getRecentEvents({ level: 'WARN', hours, limit: 500 })
        .subscribe({
          next: (items) => {
            this.recentEvents.set(items);
            this.loading.set(false);
          },
          error: () => {
            this.recentEvents.set([]);
            this.loading.set(false);
          },
        });
  }

  private hoursForRange(r: Range): number {
    return r === '24h' ? 24 : r === '7d' ? 168 : 720;
  }

  labelFor(eventType: string): string {
    return eventTypeLabel(eventType);
  }

  classes(level: LogLevel) {
    return levelClasses(level);
  }

  /** Color de fondo del badge por nivel. */
  levelBadgeBg(level: LogLevel): string {
    switch (level) {
      case 'INFO':  return '#d1fae5';
      case 'WARN':  return '#fef3c7';
      case 'ERROR': return '#fee2e2';
      case 'DEBUG': return '#e2e8f0';
      default:      return '#e2e8f0';
    }
  }

  /** Color de texto del badge por nivel. */
  levelBadgeFg(level: LogLevel): string {
    switch (level) {
      case 'INFO':  return '#047857';
      case 'WARN':  return '#b45309';
      case 'ERROR': return '#b91c1c';
      case 'DEBUG': return '#475569';
      default:      return '#475569';
    }
  }

  /** Porcentaje del nivel dado respecto al total (para barra de KPI). */
  levelPct(level: LogLevel): number {
    const total = this.totalEvents();
    if (total === 0) return 0;
    const count = this.countsByLevel()[level] || 0;
    return (count / total) * 100;
  }

  /** Toggle expand del evento con id. */
  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  /**
   * Toggle del mensaje largo in-place (sin abrir el panel de detalle JSON).
   * stopPropagation evita que el click burbujee y dispare el toggleExpand
   * de la fila entera.
   */
  toggleMessage(id: number, ev: MouseEvent): void {
    ev.stopPropagation();
    this.messageExpanded.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** True si el mensaje del evento supera el umbral de preview. */
  isMessageLong(ev: LogEventItem): boolean {
    return !!ev.message && ev.message.length > this.MESSAGE_PREVIEW_LIMIT;
  }

  /** Recorta el mensaje a MESSAGE_PREVIEW_LIMIT chars añadiendo ellipsis. */
  truncateMessage(msg: string): string {
    if (msg.length <= this.MESSAGE_PREVIEW_LIMIT) return msg;
    return msg.substring(0, this.MESSAGE_PREVIEW_LIMIT) + '…';
  }

  /** Incrementar limit en 30 para "mostrar más". */
  showMore(): void {
    this.displayLimit.update((n) => n + 30);
  }

  /** True si el evento tiene data no vacía. */
  hasData(ev: LogEventItem): boolean {
    const data = ev.data as unknown;
    if (data === null || data === undefined) return false;
    if (typeof data === 'string') {
      const s = data as string;
      const t = s.trim();
      return t !== '' && t !== '{}' && t !== 'null';
    }
    if (typeof data === 'object') {
      return Object.keys(data as object).length > 0;
    }
    return true;
  }

  /** Formatea data (puede venir como string o como object). */
  formatData(ev: LogEventItem): string {
    const raw = ev.data as unknown;
    if (raw === null || raw === undefined) return '';
    let data: unknown = raw;
    if (typeof data === 'string') {
      const asStr = data as string;
      try {
        data = JSON.parse(asStr);
      } catch {
        return asStr;
      }
    }
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }

  /** Descarga el summary agregado en CSV (el rango actual del dashboard). */
  exportSummary(): void {
    const hours = this.hoursForRange(this.range());
    this.api.exportSummaryCsv({ hours, level: 'WARN' });
  }

  /**
   * Construye los queryParams para navegar al listado de llamadas filtrado.
   *
   * - `has_event_type`: filtra llamadas que tengan ese tipo de evento
   * - `event_phase`: si el item tiene fase, la incluye para mayor precisión
   * - `from`/`to`: arrastra el rango temporal actual del dashboard
   */
  drillParams(item: EventSummaryItem): Record<string, string> {
    const params: Record<string, string> = {
      has_event_type: item.event_type,
    };
    if (item.phase) {
      params['event_phase'] = item.phase;
    }

    // Arrastrar rango temporal
    const now = new Date();
    const hours = this.hoursForRange(this.range());
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
    params['from'] = from.toISOString();
    params['to'] = now.toISOString();

    return params;
  }
}