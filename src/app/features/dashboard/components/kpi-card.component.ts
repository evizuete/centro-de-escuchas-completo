import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../../shared/components/icon.component';
import { SparklineComponent } from '../../../shared/components/sparkline.component';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, IconComponent, SparklineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpi-card" [style.borderColor]="danger() ? '#fecaca' : null" [style.background]="danger() ? '#fffbfb' : null">
      <!-- Fila 1 — label en 2 líneas (siempre 2 líneas, aunque la segunda esté vacía) -->
      <div
        style="font-size: 10.5px; color: #64748b; font-weight: 600;
               letter-spacing: 0.5px; text-transform: uppercase;
               line-height: 1.25; min-height: 26px;
               display: flex; flex-direction: column; justify-content: flex-start;"
      >
        <div>{{ labelLine1() }}</div>
        <div style="color: #94a3b8; font-weight: 500;">{{ labelLine2() || '\u00A0' }}</div>
      </div>

      <!-- Fila 2 — valor grande + icono a la derecha -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px; gap: 10px;">
        <div
          [style.color]="danger() ? '#dc2626' : '#0f172a'"
          style="font-size: 26px; font-weight: 700; font-feature-settings: 'tnum'; line-height: 1; white-space: nowrap;"
        >
          {{ value() }}
        </div>
        <div
          [style.background]="iconColor() + '14'"
          [style.color]="iconColor()"
          style="width: 30px; height: 30px; border-radius: 8px;
                 display: flex; align-items: center; justify-content: center; flex: none;"
        >
          <app-icon [name]="icon()" [size]="15" [color]="iconColor()" />
        </div>
      </div>

      <!-- Fila 3 — delta + sub/spark · siempre 1 línea -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px; gap: 8px; min-height: 18px;">
        <div
          style="display: flex; align-items: center; gap: 6px; font-size: 11px;
                 line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
        >
          @if (delta()) {
            <span style="font-weight: 700;" [style.color]="deltaColor()">{{ delta() }}</span>
          }
          @if (sub()) {
            <span style="color: #94a3b8; font-weight: 500;">{{ sub() }}</span>
          }
        </div>
        @if (spark()) {
          <app-sparkline [data]="spark()!" [width]="56" [height]="18" [color]="sparkColor() || iconColor()" />
        }
      </div>
    </div>
  `,
})
export class KpiCardComponent {
  icon = input.required<IconName>();
  iconColor = input.required<string>();
  labelLine1 = input.required<string>();
  labelLine2 = input<string>('');
  value = input.required<string | number>();
  delta = input<string | null>(null);
  deltaColor = input<string>('#15803d');
  sub = input<string | null>(null);
  spark = input<number[] | null>(null);
  sparkColor = input<string | null>(null);
  danger = input<boolean>(false);
}
