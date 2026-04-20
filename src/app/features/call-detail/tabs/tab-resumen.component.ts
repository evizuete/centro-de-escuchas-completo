import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleLlamada } from '../../../core/models/domain.models';
import { TagComponent } from '../../../shared/components/tag.component';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-tab-resumen',
  standalone: true,
  imports: [CommonModule, TagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="detail-layout">
      <!-- Columna izquierda -->
      <div>
        <h2 class="section-title">Resumen ejecutivo</h2>
        <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 18px;">
          Teresa Dipolito, propietaria de L'Atelier dei Capelli en Nápoles, contacta para realizar su
          primer pedido de Yodeyma. El agente gestionó la llamada de forma ejemplar: acogió calurosamente
          a la nueva cliente, asesoró sobre los productos más vendidos, aplicó correctamente la política
          de testers para pedidos superiores a €80 y facilitó material de marketing adicional. La llamada
          finalizó con alta satisfacción y pedido confirmado.
        </p>
        <h3 class="section-subtitle">Datos clave</h3>
        <ul class="bullet-list">
          <li>Primer pedido: <b>€87,55 (4 perfumes)</b></li>
          <li>Productos: Rosa Nera, Mediterráneo, Vanille Intense, Blue Ocean</li>
          <li>Testers gratuitos incluidos (umbral €80 superado)</li>
          <li>Pedido nº <b>ITA-2026-18847</b></li>
          <li>Envío a: Via Caracciolo 45, 80121 Nápoles</li>
          <li>Solicitud de material de marketing derivada a dpto. marketing</li>
        </ul>
      </div>

      <!-- Aside -->
      <aside class="detail-aside">
        <div class="aside-block">
          <div class="aside-block__title">INTERACCIÓN</div>
          <div class="__aside-row">
            <span style="color: #94a3b8;">Canal</span>
            <span style="color: #0f172a; font-weight: 600;">{{ d().interaccion.canal }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 4px 0; border-bottom: 1px dashed #f1f5f9; gap: 8px;">
            <span style="color: #94a3b8;">Agente</span>
            <button
              type="button"
              (click)="openAgente.emit('cc_ita4')"
              style="background: transparent; border: none; padding: 0; cursor: pointer;
                     color: #1d4ed8; font-weight: 500; font-size: 12px; text-decoration: underline;
                     text-underline-offset: 2px; display: inline-flex; align-items: center; gap: 4px;
                     font-family: inherit;"
              title="Ver ficha del agente"
            >
              {{ d().interaccion.agente }}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 17L17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </button>
          </div>
          <div class="__aside-row">
            <span style="color: #94a3b8;">Inicio</span>
            <span style="color: #0f172a; font-weight: 600;">{{ d().interaccion.inicio }}</span>
          </div>
          <div class="__aside-row">
            <span style="color: #94a3b8;">Duración</span>
            <span style="color: #0f172a; font-weight: 600;">{{ d().interaccion.duracion }}</span>
          </div>
          <div class="__aside-row">
            <span style="color: #94a3b8;">Espera</span>
            <span style="color: #0f172a; font-weight: 600;">{{ d().interaccion.espera }}</span>
          </div>
        </div>

        <div class="aside-block">
          <div class="aside-block__title">CLASIFICACIÓN</div>
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px; margin-bottom: 6px;">
            <span
              [style.background]="tipoColor() + '18'"
              [style.color]="tipoColor()"
              style="font-size: 10px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; padding: 3px 7px; border-radius: 4px;"
            >{{ d().tipo || '—' }}</span>
            <span style="font-size: 11px; color: #64748b;">→</span>
            <span style="font-size: 12px; font-weight: 600; color: #0f172a;">{{ d().subcategoria || '—' }}</span>
          </div>
          @if (d().marca) {
            <div style="font-size: 11px; color: #64748b;">
              Marca: <span style="color: #0f172a; font-weight: 600;">{{ d().marca }}</span>
            </div>
          }
        </div>

        <div class="aside-block">
          <div class="aside-block__title">PRODUCTOS MENCIONADOS</div>
          <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px;">
            @for (p of d().productos; track $index) {
              <span
                style="display: inline-flex; align-items: center; gap: 5px;
                       padding: 3px 8px; background: #eff6ff; border-radius: 10px;
                       font-size: 11px; color: #1e40af; font-weight: 600;
                       border: 1px solid #dbeafe;"
              >
                {{ p.nombre }}
                @if (p.formato) {
                  <span style="font-size: 10px; color: #3b82f6; font-weight: 500; opacity: 0.8;">{{ p.formato }}</span>
                }
              </span>
            }
          </div>
        </div>

        @if (d().incidencias.length > 0) {
          <div class="aside-block" style="border-color: #fecaca; background: #fffbfb;">
            <div class="aside-block__title" style="color: #b91c1c;">INCIDENCIAS</div>
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
              @for (inc of d().incidencias; track $index) {
                <div style="display: flex; gap: 8px; align-items: flex-start; font-size: 12.5px; color: #7f1d1d; line-height: 1.4;">
                  <span style="color: #dc2626; font-weight: 700; flex: none; margin-top: 1px;">!</span>
                  <span>{{ inc }}</span>
                </div>
              }
            </div>
          </div>
        }

        <div class="aside-block">
          <div class="aside-block__title">SENTIMIENTO</div>
          <div
            style="font-size: 14px; font-weight: 700; margin: 6px 0 8px;"
            [style.color]="isNegative() ? '#b45309' : '#15803d'"
          >{{ d().sentimiento }}</div>
          <div style="display: flex; gap: 5px; flex-wrap: wrap;">
            @for (t of d().tags; track t) {
              <app-tag [variant]="isNegative() ? 'amber' : 'green'">{{ t }}</app-tag>
            }
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .__aside-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 4px 0;
      border-bottom: 1px dashed #f1f5f9;
    }
  `],
})
export class TabResumenComponent {
  private data = inject(DataService);
  d = input.required<DetalleLlamada>();
  openAgente = output<string>();

  tipoColor = computed<string>(() => this.data.getTipoColor(this.d().tipo));
  isNegative = computed<boolean>(() => this.d().sentimiento.toLowerCase().includes('neg'));
}
