import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Llamada } from '../../../core/models/domain.models';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge.component';
import { TagComponent } from '../../../shared/components/tag.component';
import { IconComponent } from '../../../shared/components/icon.component';
import { sentimentColor } from '../../../core/services/style.utils';

@Component({
  selector: 'app-call-quick-row',
  standalone: true,
  imports: [CommonModule, ScoreBadgeComponent, TagComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="call-quick-row" (click)="open.emit(llamada().id)">
      <app-score-badge [value]="llamada().score" size="sm" />
      <div style="flex: 1; min-width: 0; text-align: left;">
        <div style="font-size: 13px; font-weight: 600; color: #0f172a;">{{ llamada().agenteId || '—' }}</div>
        <div style="font-size: 11px; color: #64748b;">{{ subtitle() }}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: #64748b; font-weight: 500;">{{ llamada().categoria.toLowerCase() }}</div>
        <div style="font-size: 11px; font-weight: 600;" [style.color]="sentColor()">{{ llamada().sentimiento }}</div>
      </div>
      <app-tag [variant]="estadoVariant()">
        {{ llamada().estado }}
      </app-tag>
      <app-icon name="chevron" [size]="14" color="#94a3b8" />
    </button>
  `,
})
export class CallQuickRowComponent {
  llamada = input.required<Llamada>();
  open = output<string>();

  sentColor = computed<string>(() => sentimentColor(this.llamada().sentimiento));

  /** Segunda línea: "campaign · dialedNumber", omitiendo los vacíos. */
  subtitle = computed<string>(() => {
    const l = this.llamada();
    const parts = [l.campaign, l.dialedNumber].filter((p) => !!p && p.trim().length > 0);
    return parts.join(' · ') || '—';
  });

  /** Variante de color del tag según el estado de revisión de la llamada. */
  estadoVariant = computed<'amber' | 'blue' | 'green' | 'red'>(() => {
    switch (this.llamada().estado) {
      case 'A REVISAR':    return 'amber';
      case 'EN REVISIÓN':  return 'blue';
      case 'REVISADO':     return 'green';
      case 'NO APLICA':    return 'red';
      default:             return 'blue';
    }
  });
}