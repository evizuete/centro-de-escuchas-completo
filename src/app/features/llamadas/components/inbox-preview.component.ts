import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Llamada } from '../../../core/models/domain.models';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge.component';
import { EmotionArcComponent } from '../../../shared/components/emotion-arc.component';
import { IconComponent } from '../../../shared/components/icon.component';
import { TipoTagComponent } from './tipo-tag.component';
import { sentimentColor } from '../../../core/services/style.utils';

@Component({
  selector: 'app-inbox-preview',
  standalone: true,
  imports: [CommonModule, ScoreBadgeComponent, EmotionArcComponent, IconComponent, TipoTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (llamada(); as l) {
      <div>
        <!-- Header -->
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px;">
          <div
              style="width: 48px; height: 48px; border-radius: 999px;
                   background: #f1f5f9; color: #64748b;
                   display: flex; align-items: center; justify-content: center;
                   font-weight: 700; font-size: 16px; flex: none;"
          >{{ initials() }}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">{{ l.agenteId || '—' }}</h3>
              <app-tipo-tag [tipo]="l.tipo" [subcategoria]="l.subcategoria" />
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              {{ subtitle() }}
            </div>
          </div>
        </div>

        <!-- Score panel -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px;">
          <div class="mini-stat">
            <app-score-badge [value]="l.score" size="sm" />
            <span class="mini-stat__label">Valoración</span>
          </div>
          <div class="mini-stat">
            <app-score-badge [value]="l.cx" size="sm" />
            <span class="mini-stat__label">{{ 'Experiencia\nCliente' }}</span>
          </div>
          <div class="mini-stat">
            <app-score-badge [value]="l.agente" size="sm" />
            <span class="mini-stat__label">Agente</span>
          </div>
        </div>

        <!-- Resumen -->
        <div style="font-size: 12px; color: #334155; line-height: 1.55; margin-bottom: 14px;">{{ l.resumen }}</div>

        <!-- Arco emocional -->
        <div style="margin-bottom: 14px;">
          <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px;">
            Arco emocional
          </div>
          <div style="background: #f8fafc; padding: 10px; border-radius: 8px;">
            <app-emotion-arc [data]="l.emoji_arc" [width]="260" [height]="40" color="#3b82f6" [responsive]="true"/>
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; margin-top: 4px;">
              <span>Inicio</span><span>Medio</span><span>Cierre</span>
            </div>
          </div>
        </div>

        <!-- Metadata -->
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #475569;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Duración</span>
            <span style="font-weight: 600; color: #0f172a;">{{ l.duracion }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Tiempo de espera</span>
            <span style="font-weight: 600; color: #0f172a;">{{ l.tiempoEspera }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Código</span>
            <span style="font-weight: 600; color: #0f172a;">{{ l.dispositionCode || '—' }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Nº marcado</span>
            <span
                style="font-weight: 600; color: #0f172a;
                       font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                       font-feature-settings: 'tnum';"
            >{{ l.dialedNumber || '—' }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Agentes fallidos</span>
            <span style="font-weight: 600; color: #0f172a;">{{ l.agentesFallidos || '—' }}</span>
            <!--<span style="font-weight: 600;" [style.color]="l.facturacion < 0 ? '#dc2626' : '#0f172a'">
              {{ l.facturacion === 0 ? '—' : '€' + l.facturacion.toFixed(2) }}
            </span> -->
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Sentimiento</span>
            <span style="font-weight: 600;" [style.color]="sentColor()">{{ l.sentimiento }}</span>
          </div>
        </div>

        <button
            type="button"
            class="btn btn--primary"
            style="width: 100%; margin-top: 16px; justify-content: center;"
            (click)="open.emit(l.id)"
        >
          Abrir análisis completo <app-icon name="chevron" [size]="15" />
        </button>
      </div>
    } @else {
      <div style="padding: 40px; text-align: center; color: #94a3b8;">Selecciona una llamada</div>
    }
  `,
})
export class InboxPreviewComponent {
  llamada = input<Llamada | null>(null);
  open = output<string>();

  sentColor = computed<string>(() => sentimentColor(this.llamada()?.sentimiento ?? ''));

  /** Subtítulo "campaign · dialedNumber" saltándose los vacíos. */
  subtitle = computed<string>(() => {
    const l = this.llamada();
    if (!l) return '';
    const parts = [l.campaña, l.dialedNumber].filter((p) => !!p && p.trim().length > 0);
    return parts.join(' · ') || '—';
  });

  /**
   * Iniciales del agente para el avatar. Soporta los formatos habituales de
   * agenteId: "cc_esp_03" → "CE", "juan.perez" → "JP", "Juan Pérez" → "JP".
   */
  initials = computed<string>(() => {
    const id = this.llamada()?.agenteId;
    if (!id) return '?';
    const parts = id.split(/[\s._-]+/).filter((p) => p.length > 0);
    if (parts.length === 0) return '?';
    return parts
        .slice(0, 2)
        .map((p) => p[0]!.toUpperCase())
        .join('');
  });
}