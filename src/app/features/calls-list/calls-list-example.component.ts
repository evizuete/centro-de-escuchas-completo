import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { EventsApiService } from '../../core/services/events-api.service';
import { EventCountsBadgeComponent } from '../../shared/components/event-counts-badge/event-counts-badge.component';
import { ActiveFilterChipComponent } from '../../shared/components/active-filter-chip/active-filter-chip.component';
import { EventCountsBatch } from '../../core/models/events.models';

/**
 * EJEMPLO de lista de llamadas con badge + drill-down.
 *
 * Adapta a tu CallsListComponent existente:
 *   1. Añade <app-active-filter-chip /> en la cabecera para mostrar el
 *      filtro activo cuando llegas desde el dashboard drill-down
 *   2. Lee los queryParams (has_event_type, event_phase, from, to) y los
 *      pasa a tu CallsApiService como params de GET /api/calls
 *   3. Añade la columna del badge al final de cada fila
 */

interface Llamada {
  call_id: string;
  agent_id: string;
  duration_s: number;
  sentiment: string;
}

@Component({
  selector: 'app-calls-list',
  standalone: true,
  imports: [
    CommonModule,
    EventCountsBadgeComponent,
    ActiveFilterChipComponent,
  ],
  template: `
    <div class="p-4 space-y-4">
      <!-- Chip con filtro drill-down activo (si lo hay) -->
      <app-active-filter-chip />

      <!-- Tabla de llamadas -->
      <div class="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-4 py-3">
          <h2 class="text-sm font-semibold text-slate-900">
            Llamadas
            <span class="ml-2 text-xs text-slate-500">
              ({{ calls().length }})
            </span>
          </h2>
        </div>

        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="text-left px-4 py-2">ID</th>
              <th class="text-left px-4 py-2">Agente</th>
              <th class="text-right px-4 py-2">Duración</th>
              <th class="text-left px-4 py-2">Sentimiento</th>
              <th class="text-left px-4 py-2">Eventos</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (call of calls(); track call.call_id) {
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-2 font-mono text-xs text-slate-600">
                  {{ call.call_id.substring(0, 12) }}…
                </td>
                <td class="px-4 py-2">{{ call.agent_id }}</td>
                <td class="px-4 py-2 text-right tabular-nums">
                  {{ formatDuration(call.duration_s) }}
                </td>
                <td class="px-4 py-2">{{ call.sentiment }}</td>
                <td class="px-4 py-2">
                  <app-event-counts-badge
                    [counts]="countsByCall()[call.call_id]"
                  />
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class CallsListExampleComponent implements OnInit {
  private api = inject(EventsApiService);
  private route = inject(ActivatedRoute);

  calls = signal<Llamada[]>([]);
  countsByCall = signal<EventCountsBatch>({});

  private queryParams = toSignal(
    this.route.queryParams.pipe(map((qp) => qp)),
    { initialValue: {} as Record<string, any> },
  );

  constructor() {
    // Cuando cambian queryParams (drill-down desde dashboard), recargamos
    effect(() => {
      const qp = this.queryParams();
      this.loadCalls(qp);
    });

    // Batch counts cuando haya llamadas
    effect(() => {
      const ids = this.calls().map((c) => c.call_id);
      if (ids.length > 0) {
        this.loadCounts(ids);
      } else {
        this.countsByCall.set({});
      }
    });
  }

  ngOnInit(): void {
    // effect() del constructor reacciona al primer queryParams emitido.
  }

  /**
   * AQUÍ es donde adaptas a tu CallsApiService real. Lo importante es
   * propagar TODOS los queryParams al backend sin filtrar: desde v33
   * /api/calls acepta has_event_type, event_phase, from, to.
   */
  private loadCalls(queryParams: Record<string, any>): void {
    // Sustituir por: this.callsApi.list({ ...queryParams }).subscribe(...)
    //
    // Params nuevos que ahora viajan al backend desde el drill-down:
    //   has_event_type: 'llm_json_parse_error'
    //   event_phase:    'phase5b'
    //   from:           '2026-04-13T00:00:00Z'
    //   to:             '2026-04-20T00:00:00Z'
    console.log('[calls-list] recargar con params:', queryParams);
    this.calls.set([]);
  }

  private loadCounts(callIds: string[]): void {
    this.api.getCountsByCall(callIds).subscribe({
      next: (res) => this.countsByCall.set(res),
      error: () => this.countsByCall.set({}),
    });
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
