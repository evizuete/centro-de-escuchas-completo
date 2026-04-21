import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleLlamada } from '../../../core/models/domain.models';
import { IconComponent } from '../../../shared/components/icon.component';
import { TagComponent } from '../../../shared/components/tag.component';

@Component({
  selector: 'app-tab-coaching',
  standalone: true,
  imports: [CommonModule, IconComponent, TagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; gap: 20px;">
        <div>
          <h2 class="section-title">Coaching highlights</h2>
          <div class="card__subtitle">Selecciona fragmentos para enviar al agente como feedback formativo</div>
        </div>
        <button
            type="button"
            class="btn btn--primary"
            [disabled]="true"
            title="Envío al agente — pendiente de implementar (próximamente)"
        >
          <app-icon name="send" [size]="13" />
          Enviar {{ selected().length > 0 ? selected().length + ' highlight' + (selected().length > 1 ? 's' : '') : 'al agente' }}
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        @for (h of d().coachingHighlights; track $index; let i = $index) {
          <div
              class="coach-card"
              [class.coach-card--positivo]="h.tipo === 'positivo'"
              [class.coach-card--mejora]="h.tipo === 'mejora'"
              [class.coach-card--selected]="isSelected(i)"
              (click)="toggle(i)"
          >
            <input
                type="checkbox"
                [checked]="isSelected(i)"
                readonly
                [style.accentColor]="h.tipo === 'positivo' ? '#22c55e' : '#f59e0b'"
                style="width: 16px; height: 16px;"
            />
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <app-tag [variant]="h.tipo === 'positivo' ? 'green' : 'amber'">
                  {{ h.tipo === 'positivo' ? '✓ A replicar' : '⚠ A mejorar' }}
                </app-tag>
                <span style="font-size: 12px; color: #64748b; font-feature-settings: 'tnum'; font-weight: 600;">{{ h.t }}</span>
              </div>
              <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 3px;">{{ h.titulo }}</div>
              <div style="font-size: 13px; color: #475569; line-height: 1.5;">{{ h.descripcion }}</div>
            </div>
            <button
                type="button"
                class="btn btn--ghost"
                style="flex: none;"
                (click)="$event.stopPropagation()"
                title="Reproducir fragmento de audio (próximamente)"
                disabled
            >
              <app-icon name="play" [size]="12" /> Fragmento
            </button>
          </div>
        }

        @if (d().coachingHighlights.length === 0) {
          <div style="padding: 28px 16px; text-align: center; color: #94a3b8; font-size: 13px;
                      background: #fafafa; border: 1px dashed #e2e8f0; border-radius: 10px;">
            No se han detectado highlights de coaching para esta llamada.
          </div>
        }
      </div>

      <div style="margin-top: 22px; padding: 12px 14px; background: #f8fafc;
                  border: 1px dashed #cbd5e1; border-radius: 8px;
                  font-size: 12.5px; color: #64748b; line-height: 1.5;">
        <b style="color: #475569;">Pendiente:</b> envío real al agente y agrupación cross-llamada
        de patrones. Estas funciones se activarán cuando producto defina el flujo.
      </div>
    </div>
  `,
})
export class TabCoachingComponent {
  d = input.required<DetalleLlamada>();
  readonly selected = signal<number[]>([]);

  isSelected(i: number): boolean {
    return this.selected().includes(i);
  }

  toggle(i: number): void {
    this.selected.update((arr) => (arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]));
  }
}