import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { eventTypeLabel } from '../../../core/models/events.models';

/**
 * Chip que muestra el filtro drill-down activo en la lista de llamadas.
 *
 * Se alimenta automáticamente de los queryParams de la URL:
 *   ?has_event_type=llm_json_parse_error&event_phase=phase5b&from=...&to=...
 *
 * Si no hay filtro de drill-down activo, no renderiza nada.
 *
 * Uso: colócalo encima de tu tabla de llamadas.
 *
 *   <app-active-filter-chip />
 *   <table>...</table>
 */
@Component({
  selector: 'app-active-filter-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (activeFilter(); as f) {
      <div
        class="mb-3 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2"
      >
        <svg class="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M3 5a1 1 0 0 1 1-1h12a1 1 0 0 1 .8 1.6l-4.3 5.73V15a1 1 0 0 1-.55.89l-3 1.5A1 1 0 0 1 8 16.5v-5.17L3.2 5.6A1 1 0 0 1 3 5z"
            clip-rule="evenodd"
          />
        </svg>

        <span class="text-sm text-indigo-900">
          Filtro activo:
          <span class="font-semibold">{{ f.label }}</span>
          @if (f.phase) {
            <span class="text-indigo-700"> · {{ f.phase }}</span>
          }
          @if (f.rangeLabel) {
            <span class="text-indigo-700"> · {{ f.rangeLabel }}</span>
          }
        </span>

        <button
          type="button"
          class="ml-auto rounded-full p-1 text-indigo-600 hover:bg-indigo-100"
          (click)="clearFilter()"
          title="Quitar filtro"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    }
  `,
})
export class ActiveFilterChipComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private queryParams = toSignal(
    this.route.queryParams.pipe(map((qp) => qp)),
    { initialValue: {} as Record<string, any> },
  );

  activeFilter = computed(() => {
    const qp = this.queryParams();
    const eventType = qp['has_event_type'] as string | undefined;
    if (!eventType) return null;

    const phase = qp['event_phase'] as string | undefined;
    const from = qp['from'] as string | undefined;
    const to = qp['to'] as string | undefined;

    return {
      eventType,
      phase: phase || null,
      label: eventTypeLabel(eventType),
      rangeLabel: this.formatRange(from, to),
      from,
      to,
    };
  });

  clearFilter(): void {
    // Navega a la misma ruta sin los params de drill-down,
    // preservando otros posibles filtros (agente, sentimiento, etc.)
    const current = this.route.snapshot.queryParams;
    const kept: Record<string, any> = {};
    for (const [k, v] of Object.entries(current)) {
      if (!['has_event_type', 'event_phase', 'from', 'to'].includes(k)) {
        kept[k] = v;
      }
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: kept,
      queryParamsHandling: 'replace',
    });
  }

  private formatRange(from?: string, to?: string): string | null {
    if (!from && !to) return null;
    if (!from) return `hasta ${this.shortDate(to)}`;
    if (!to) return `desde ${this.shortDate(from)}`;
    // Calcular duración legible
    const hours = Math.round(
      (new Date(to).getTime() - new Date(from).getTime()) / 3600000,
    );
    if (hours < 48) return `últimas ${hours}h`;
    const days = Math.round(hours / 24);
    return `últimos ${days} días`;
  }

  private shortDate(iso?: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch {
      return iso;
    }
  }
}
