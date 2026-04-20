import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleLlamada } from '../../../core/models/domain.models';
import { BarComponent } from '../../../shared/components/bar.component';
import { TagComponent } from '../../../shared/components/tag.component';

@Component({
  selector: 'app-tab-analisis',
  standalone: true,
  imports: [CommonModule, BarComponent, TagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="section-title">Análisis de la llamada</h2>

      <div class="grid grid--3">
        <div class="card">
          <div class="aside-block__title">CALIDAD DE AUDIO — SNR</div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
            <span style="color: #1d4ed8; font-weight: 600; font-size: 13px;">Agente</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; font-size: 14px; font-feature-settings: 'tnum';">19.2 dB</span>
              <app-tag variant="green">Buena</app-tag>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 1px solid #f1f5f9;">
            <span style="color: #15803d; font-weight: 600; font-size: 13px;">Cliente</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; font-size: 14px; font-feature-settings: 'tnum';">16.8 dB</span>
              <app-tag variant="green">Buena</app-tag>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="aside-block__title">DISTRIBUCIÓN DEL HABLA</div>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 12px; color: #1d4ed8; width: 60px; font-weight: 600;">Agente</span>
              <app-bar [value]="52" color="#3b82f6" />
              <span style="font-size: 12px; font-weight: 700; min-width: 32px; text-align: right; font-feature-settings: 'tnum';">52%</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 12px; color: #15803d; width: 60px; font-weight: 600;">Cliente</span>
              <app-bar [value]="38" color="#22c55e" />
              <span style="font-size: 12px; font-weight: 700; min-width: 32px; text-align: right; font-feature-settings: 'tnum';">38%</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 12px; color: #64748b; width: 60px; font-weight: 600;">Silencio</span>
              <app-bar [value]="8" color="#94a3b8" />
              <span style="font-size: 12px; font-weight: 700; min-width: 32px; text-align: right; font-feature-settings: 'tnum';">8%</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 12px; color: #b45309; width: 60px; font-weight: 600;">Double</span>
              <app-bar [value]="2" color="#f59e0b" />
              <span style="font-size: 12px; font-weight: 700; min-width: 32px; text-align: right; font-feature-settings: 'tnum';">2%</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="aside-block__title">TIEMPOS OPERATIVOS</div>
          <div style="display: flex; gap: 16px; margin-top: 10px;">
            <div>
              <div style="font-size: 22px; font-weight: 700; color: #0f172a; font-feature-settings: 'tnum';">42s</div>
              <div style="font-size: 11px; color: #64748b;">Tiempo en cola</div>
              <app-tag variant="green">Normal</app-tag>
            </div>
            <div>
              <div style="font-size: 22px; font-weight: 700; color: #0f172a; font-feature-settings: 'tnum';">18s</div>
              <div style="font-size: 11px; color: #64748b;">Sin atención activa</div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="section-subtitle" style="margin-top: 22px;">Riesgos detectados</h3>
      <div class="card" style="border-left: 3px solid #3b82f6;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">Seguimiento Marketing</div>
            <div style="font-size: 13px; color: #475569; line-height: 1.5;">
              La derivación al dpto. de marketing no quedó con fecha comprometida. Riesgo de caída de la oportunidad si no hay seguimiento.
            </div>
          </div>
          <app-tag variant="blue">BAJA</app-tag>
        </div>
      </div>

      <h3 class="section-subtitle" style="margin-top: 22px;">Insights comerciales</h3>
      <div class="grid grid--3">
        <div class="card">
          <div class="aside-block__title" style="color: #1d4ed8;">Nuevo cliente</div>
          <div style="font-size: 13px; color: #475569; margin: 6px 0; line-height: 1.5;">Primera compra con potencial de recurrencia alta</div>
          <div style="font-size: 20px; font-weight: 700; color: #0f172a; font-feature-settings: 'tnum';">€87,55</div>
        </div>
        <div class="card">
          <div class="aside-block__title" style="color: #15803d;">Upsell exitoso</div>
          <div style="font-size: 13px; color: #475569; margin: 6px 0; line-height: 1.5;">Testers incluidos como incentivo de fidelización</div>
        </div>
        <div class="card">
          <div class="aside-block__title" style="color: #7c3aed;">Oportunidad marketing</div>
          <div style="font-size: 13px; color: #475569; margin: 6px 0; line-height: 1.5;">Cliente interesada en material de marca — potencial embajadora</div>
        </div>
      </div>
    </div>
  `,
})
export class TabAnalisisComponent {
  d = input.required<DetalleLlamada>();
}
