import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Llamada } from '../../../core/models/domain.models';
import { EmotionArcComponent } from '../../../shared/components/emotion-arc.component';
import { IconComponent } from '../../../shared/components/icon.component';
import { TagComponent } from '../../../shared/components/tag.component';
import { TipoTagComponent } from './tipo-tag.component';
import { EstadoTagComponent } from './estado-tag.component';
import { scoreColor } from '../../../core/services/style.utils';

@Component({
  selector: 'app-inbox-row',
  standalone: true,
  imports: [CommonModule, EmotionArcComponent, IconComponent, TagComponent, TipoTagComponent, EstadoTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
        class="inbox-row"
        [class.inbox-row--selected]="selected()"
        (click)="select.emit(llamada().id)"
    >
      <div class="inbox-row__unread-dot" [style.opacity]="llamada().no_leida ? 1 : 0"></div>
      @if (llamada().pinned) {
        <app-icon name="pin" [size]="13" color="#f59e0b" />
      }
      <!-- Avatar iniciales (del agente) -->
      <div
          style="width: 36px; height: 36px; border-radius: 999px;
               background: #f1f5f9; color: #64748b;
               display: flex; align-items: center; justify-content: center;
               font-weight: 700; font-size: 12px; flex: none;"
      >{{ initials() }}</div>

      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span
              style="font-size: 13px; color: #0f172a;"
              [style.fontWeight]="llamada().no_leida ? 700 : 600"
          >{{ llamada().agenteId || '—' }}</span>
          <app-tipo-tag [tipo]="llamada().tipo" [subcategoria]="llamada().categoria" />
          <span style="font-size: 11px; color: #94a3b8; margin-left: auto;">{{ llamada().duracion }}</span>
        </div>
        <div
            style="font-size: 12px; color: #64748b; margin-top: 3px;
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
        >
          <span style="color: #334155; font-weight: 500;">{{ llamada().subcategoria || '—' }}</span>
          <!--·
          <span style="font-feature-settings: 'tnum';">{{ llamada().dialedNumber || '—' }}</span>
          @if (llamada().resumen) {
            · {{ llamada().resumen }}
          } -->
        </div>
        <div style="display: flex; gap: 8px; margin-top: 6px; align-items: center;">
          <app-estado-tag [estado]="llamada().estado" />
          @if (llamada().riesgos > 0) {
            <app-tag variant="red">⚠ {{ llamada().riesgos }} riesgo{{ llamada().riesgos > 1 ? 's' : '' }}</app-tag>
          }
          <div style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
            <app-emotion-arc [data]="llamada().emoji_arc" [width]="52" [height]="16" color="#3b82f6" />
            <div
                [style.background]="colors().bg"
                [style.color]="colors().fg"
                [style.border]="'1px solid ' + colors().border"
                style="width: 28px; height: 22px; border-radius: 6px;
                     font-size: 11px; font-weight: 700; font-feature-settings: 'tnum';
                     display: flex; align-items: center; justify-content: center;"
            >{{ llamada().score }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class InboxRowComponent {
  llamada = input.required<Llamada>();
  selected = input<boolean>(false);
  select = output<string>();

  colors = computed(() => scoreColor(this.llamada().score));

  /**
   * Iniciales del agente para el avatar.
   *
   * Soporta varios formatos de agenteId:
   *   - "cc_esp_03"     → "CE"  (separador '_')
   *   - "juan.perez"    → "JP"  (separador '.')
   *   - "Juan Pérez"    → "JP"  (separador ' ')
   *   - "cc_esp"        → "CE"
   *   - ""/undefined    → "?"
   */
  initials = computed<string>(() => {
    const id = this.llamada().agenteId;
    if (!id) return '?';
    // Dividir por cualquier separador común y tomar las dos primeras "palabras"
    const parts = id.split(/[\s._-]+/).filter((p) => p.length > 0);
    if (parts.length === 0) return '?';
    return parts
        .slice(0, 2)
        .map((p) => p[0]!.toUpperCase())
        .join('');
  });
}