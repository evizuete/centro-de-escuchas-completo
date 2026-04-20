import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleLlamada } from '../../../core/models/domain.models';
import { TagComponent } from '../../../shared/components/tag.component';

@Component({
  selector: 'app-tab-recomendaciones',
  standalone: true,
  imports: [CommonModule, TagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="section-title">Recomendaciones accionables</h2>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        @for (r of d().recomendaciones; track $index) {
          <div
            class="reco-card"
            [style.borderLeftColor]="borderColor(r.nivel)"
          >
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <app-tag [variant]="r.nivel === 'ALTA' ? 'red' : r.nivel === 'MEDIA' ? 'amber' : 'blue'">{{ r.nivel }}</app-tag>
              <span style="font-size: 13px; font-weight: 700; color: #0f172a;">{{ r.tipo }}</span>
            </div>
            <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 4px; line-height: 1.5;">{{ r.titulo }}</div>
            <div style="font-size: 13px; color: #64748b; line-height: 1.5;">{{ r.detalle }}</div>
          </div>
        }
      </div>
    </div>
  `,
})
export class TabRecomendacionesComponent {
  d = input.required<DetalleLlamada>();

  borderColor(nivel: string): string {
    if (nivel === 'ALTA') return '#ef4444';
    if (nivel === 'MEDIA') return '#f59e0b';
    return '#3b82f6';
  }
}
