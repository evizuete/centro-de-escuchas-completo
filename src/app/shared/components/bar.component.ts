import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [style.height.px]="height()"
      style="background: #f1f5f9; border-radius: 999px; overflow: hidden; flex: 1;"
    >
      <div
        [style.width.%]="pct()"
        [style.background]="color()"
        style="height: 100%; border-radius: 999px; transition: width 0.4s;"
      ></div>
    </div>
  `,
})
export class BarComponent {
  value = input.required<number>();
  max = input<number>(100);
  color = input<string>('#3b82f6');
  height = input<number>(6);

  pct = computed<number>(() => Math.min(100, Math.max(0, (this.value() / this.max()) * 100)));
}
