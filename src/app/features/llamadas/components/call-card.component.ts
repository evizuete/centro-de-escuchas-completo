import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Llamada } from '../../../core/models/domain.models';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge.component';
import { TagComponent } from '../../../shared/components/tag.component';
import { TipoTagComponent } from './tipo-tag.component';
import { EstadoTagComponent } from './estado-tag.component';
import { sentimentColor } from '../../../core/services/style.utils';

@Component({
  selector: 'app-call-card',
  standalone: true,
  imports: [CommonModule, ScoreBadgeComponent, TagComponent, TipoTagComponent, EstadoTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="call-card" (click)="open.emit(llamada().id)">
      <div class="call-card__ribbon" [style.background]="ribbonColor()"></div>

      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
        <app-estado-tag [estado]="llamada().estado" />
        <span style="font-size: 10px; color: #94a3b8; font-feature-settings: 'tnum';">
          {{ llamada().id.slice(0, 7) }}
        </span>
      </div>

      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 10px;">
        <div style="flex: 1; min-width: 0; text-align: left;">
          <div style="font-size: 15px; font-weight: 700; color: #0f172a;">{{ llamada().cliente }}</div>
          <div style="font-size: 12px; color: #64748b;">{{ llamada().empresa }}</div>
          @if (llamada().subcategoria) {
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px; font-style: italic;">
              {{ llamada().subcategoria }}
            </div>
          }
        </div>
        <app-tipo-tag [tipo]="llamada().tipo" />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 10px;">
        <div class="mini-stat">
          <app-score-badge [value]="llamada().score" size="sm" />
          <span class="mini-stat__label">Valoración</span>
        </div>
        <div class="mini-stat">
          <app-score-badge [value]="llamada().cx" size="sm" />
          <span class="mini-stat__label">Experiencia</span>
        </div>
        <div class="mini-stat">
          <app-score-badge [value]="llamada().agente" size="sm" />
          <span class="mini-stat__label">Agente</span>
        </div>
      </div>

      <div style="font-size: 12px; color: #475569; line-height: 1.45; text-align: left; margin-bottom: 10px; min-height: 36px;">
        {{ llamada().resumen }}
      </div>

      <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
        <app-tag variant="slate">⏱ {{ llamada().duracion }}</app-tag>
        <app-tag variant="slate">👤 {{ llamada().agenteId }}</app-tag>
        @if (llamada().riesgos > 0) {
          <app-tag variant="red">⚠ {{ llamada().riesgos }}</app-tag>
        }
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9;">
        <span style="font-size: 12px; font-weight: 600;" [style.color]="sentColor()">{{ llamada().sentimiento }}</span>
        <span
          style="font-size: 13px; font-weight: 700; font-feature-settings: 'tnum';"
          [style.color]="llamada().facturacion < 0 ? '#dc2626' : '#0f172a'"
        >{{ llamada().facturacion === 0 ? '—' : '€' + llamada().facturacion.toFixed(2) }}</span>
      </div>
    </button>
  `,
})
export class CallCardComponent {
  llamada = input.required<Llamada>();
  open = output<string>();

  sentColor = computed<string>(() => sentimentColor(this.llamada().sentimiento));
  ribbonColor = computed<string>(() => {
    const e = this.llamada().estado;
    if (e === 'A REVISAR') return '#f59e0b';
    if (e === 'EN REVISIÓN') return '#3b82f6';
    if (e === 'REVISADO') return '#22c55e';
    return '#94a3b8';
  });
}
