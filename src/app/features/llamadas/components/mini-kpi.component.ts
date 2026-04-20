import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-mini-kpi',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mini-kpi"
      [class.mini-kpi--danger]="danger()"
      [class.mini-kpi--warn]="warn()"
    >
      <div class="mini-kpi__value-row">
        <app-icon [name]="icon()" [size]="15" [color]="iconColor()" />
        <span class="mini-kpi__value">{{ value() }}</span>
        @if (delta()) {
          <span
            style="font-size: 10px; font-weight: 600;"
            [style.color]="delta()!.startsWith('-') ? '#dc2626' : '#15803d'"
          >{{ delta() }}</span>
        }
        @if (sub()) {
          <span style="font-size: 10px; color: #94a3b8; font-weight: 500;">{{ sub() }}</span>
        }
      </div>
      <div class="mini-kpi__label">{{ label() }}</div>
    </div>
  `,
})
export class MiniKpiComponent {
  icon = input.required<IconName>();
  iconColor = input.required<string>();
  value = input.required<string | number>();
  label = input.required<string>();
  delta = input<string | null>(null);
  sub = input<string | null>(null);
  danger = input<boolean>(false);
  warn = input<boolean>(false);
}
