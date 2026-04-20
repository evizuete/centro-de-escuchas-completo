import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { LogLevel } from '../../../core/models/events.models';

/**
 * Badge que muestra el número de warnings/errors de una llamada.
 *
 * Uso:
 *   <app-event-counts-badge [counts]="{WARN: 2, ERROR: 0}" />
 *   <app-event-counts-badge [counts]="countsByCall[callId]" />
 *
 * Si no hay eventos WARN ni ERROR, no renderiza nada (badge invisible).
 */
@Component({
  selector: 'app-event-counts-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hasErrors()) {
      <span
        class="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-medium"
        [title]="tooltip()"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5v2h2v-2H9zm0-8v6h2V5H9z"
            clip-rule="evenodd"
          />
        </svg>
        {{ counts()?.ERROR }}
      </span>
    }
    @if (hasWarnings()) {
      <span
        class="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium"
        [title]="tooltip()"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
            clip-rule="evenodd"
          />
        </svg>
        {{ counts()?.WARN }}
      </span>
    }
  `,
})
export class EventCountsBadgeComponent {
  /** Counts por nivel. Admite undefined/null para llamadas sin eventos. */
  counts = input<Partial<Record<LogLevel, number>> | undefined>(undefined);

  hasErrors = computed(() => (this.counts()?.ERROR ?? 0) > 0);
  hasWarnings = computed(() => (this.counts()?.WARN ?? 0) > 0);

  tooltip = computed(() => {
    const c = this.counts();
    if (!c) return '';
    const parts: string[] = [];
    if (c.ERROR) parts.push(`${c.ERROR} error${c.ERROR > 1 ? 'es' : ''}`);
    if (c.WARN) parts.push(`${c.WARN} warning${c.WARN > 1 ? 's' : ''}`);
    if (c.INFO) parts.push(`${c.INFO} info`);
    return parts.join(' · ');
  });
}
