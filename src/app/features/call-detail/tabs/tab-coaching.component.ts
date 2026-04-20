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
        <button type="button" class="btn btn--primary" [disabled]="selected().length === 0">
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
            <button type="button" class="btn btn--ghost" style="flex: none;" (click)="$event.stopPropagation()">
              <app-icon name="play" [size]="12" /> Fragmento
            </button>
          </div>
        }
      </div>

      <div style="margin-top: 22px; padding: 16px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <app-icon name="sparkles" [size]="15" color="#0284c7" />
          <span style="font-size: 12px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.3px;">IA sugiere</span>
        </div>
        <div style="font-size: 13px; color: #0c4a6e; line-height: 1.5;">
          Agrupar este coaching con otras 2 llamadas similares de <b>cc_ita4</b> sobre oportunidades perdidas de
          afiliados. Generaría un patrón más claro para el agente.
        </div>
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
