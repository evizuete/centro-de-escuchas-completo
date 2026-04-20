import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EventsApiService } from '../../../core/services/events-api.service';
import {
  eventTypeLabel,
  LogEventItem,
  LogLevel,
  levelClasses,
} from '../../../core/models/events.models';

/**
 * Timeline de eventos estructurados de una llamada.
 *
 * Uso:
 *   <app-events-timeline [callId]="call.call_id" />
 *
 * Carga automáticamente los eventos al recibir callId. Permite filtrar
 * por nivel mínimo y expandir el payload JSON de cada evento.
 */
@Component({
  selector: 'app-events-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <!-- Header con filtro de nivel -->
      <div
        class="flex items-center justify-between border-b border-slate-200 px-4 py-3"
      >
        <h3 class="text-sm font-semibold text-slate-900">
          Timeline de la llamada
          @if (!loading() && events().length > 0) {
            <span class="ml-2 text-xs text-slate-500">
              {{ events().length }}
              evento{{ events().length === 1 ? '' : 's' }}
            </span>
          }
        </h3>

        <div class="flex items-center gap-2">
          <label class="text-xs text-slate-600">Nivel mínimo:</label>
          <select
            class="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
            [ngModel]="levelFilter()"
            (ngModelChange)="levelFilter.set($event)"
          >
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>

          <button
            type="button"
            class="rounded border border-slate-300 bg-white p-1 text-slate-600 hover:bg-slate-50"
            (click)="exportCsv()"
            title="Exportar timeline completa a CSV"
            [disabled]="loading() || events().length === 0"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="p-6 text-center text-sm text-slate-500">
          Cargando timeline...
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="p-6 text-center text-sm text-red-600">
          {{ error() }}
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && !error() && events().length === 0) {
        <div class="p-6 text-center text-sm text-slate-500">
          Sin eventos registrados para esta llamada.
        </div>
      }

      <!-- Eventos -->
      @if (!loading() && events().length > 0) {
        <div class="divide-y divide-slate-100">
          @for (ev of events(); track ev.id) {
            <div class="px-4 py-3 flex gap-3">
              <!-- Dot + línea vertical -->
              <div class="flex flex-col items-center">
                <div
                  class="w-2.5 h-2.5 rounded-full ring-2 ring-white"
                  [class]="classes(ev.level).dot"
                ></div>
              </div>

              <!-- Contenido -->
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2 flex-wrap">
                  <span class="text-xs text-slate-500 tabular-nums">
                    {{ ev.ts | date: 'HH:mm:ss.SSS' }}
                  </span>
                  <span
                    class="text-xs font-mono rounded px-1.5 py-0.5"
                    [class]="classes(ev.level).badge"
                  >
                    {{ ev.level }}
                  </span>
                  @if (ev.phase) {
                    <span class="text-xs text-slate-500 font-mono">
                      {{ ev.phase }}
                    </span>
                  }
                  <span class="text-sm font-medium text-slate-900">
                    {{ label(ev.event_type) }}
                  </span>
                </div>

                @if (ev.message) {
                  <p class="mt-0.5 text-sm text-slate-600">
                    {{ ev.message }}
                  </p>
                }

                <!-- Payload data (expandible) -->
                @if (hasData(ev)) {
                  <button
                    type="button"
                    class="mt-1 text-xs text-indigo-600 hover:underline"
                    (click)="toggleExpand(ev.id)"
                  >
                    {{ isExpanded(ev.id) ? 'Ocultar detalle' : 'Ver detalle' }}
                  </button>

                  @if (isExpanded(ev.id)) {
                    <pre
                      class="mt-2 rounded bg-slate-50 p-2 text-xs overflow-x-auto font-mono text-slate-700"
                    >{{ formatData(ev.data) }}</pre>
                  }
                }

                @if (ev.duration_ms !== null) {
                  <span class="mt-1 inline-block text-xs text-slate-400">
                    ⏱ {{ ev.duration_ms }}ms
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class EventsTimelineComponent {
  private api = inject(EventsApiService);

  /** ID de la llamada cuyos eventos se muestran. */
  callId = input.required<string>();

  levelFilter = signal<LogLevel>('INFO');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  events = signal<LogEventItem[]>([]);
  private expandedIds = signal<Set<number>>(new Set());

  constructor() {
    // Recarga cuando cambia callId o el filtro
    effect(() => {
      const cid = this.callId();
      const lvl = this.levelFilter();
      if (cid) this.load(cid, lvl);
    });
  }

  private load(callId: string, level: LogLevel): void {
    this.loading.set(true);
    this.error.set(null);
    this.events.set([]);
    this.expandedIds.set(new Set());

    this.api.getCallEvents(callId, { level }).subscribe({
      next: (res) => {
        this.events.set(res.events);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail ||
            err?.message ||
            'Error cargando eventos',
        );
        this.loading.set(false);
      },
    });
  }

  label(eventType: string): string {
    return eventTypeLabel(eventType);
  }

  classes(level: LogLevel) {
    return levelClasses(level);
  }

  hasData(ev: LogEventItem): boolean {
    return ev.data !== null && Object.keys(ev.data).length > 0;
  }

  isExpanded(id: number): boolean {
    return this.expandedIds().has(id);
  }

  toggleExpand(id: number): void {
    const s = new Set(this.expandedIds());
    if (s.has(id)) s.delete(id);
    else s.add(id);
    this.expandedIds.set(s);
  }

  formatData(data: Record<string, any> | null): string {
    if (!data) return '';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }

  /** Exporta la timeline completa de esta llamada a CSV. */
  exportCsv(): void {
    const cid = this.callId();
    if (!cid) return;
    this.api.exportCallTimelineCsv(cid, { level: this.levelFilter() });
  }
}
