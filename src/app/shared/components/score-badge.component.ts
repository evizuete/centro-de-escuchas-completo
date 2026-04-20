import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { scoreColor } from '../../core/services/style.utils';

type Size = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-score-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
      <div
        [style.width.px]="px()"
        [style.height.px]="px()"
        [style.borderRadius.%]="50"
        [style.background]="colors().bg"
        [style.color]="colors().fg"
        [style.border]="'1.5px solid ' + colors().border"
        style="display: flex; align-items: center; justify-content: center; font-weight: 700;
               font-feature-settings: 'tnum';"
        [style.fontSize.px]="fontSize()"
      >
        {{ value() }}
      </div>
      @if (label()) {
        <div
          style="font-size: 10px; color: #64748b; font-weight: 500; text-transform: uppercase;
                 letter-spacing: 0.4px; text-align: center; white-space: pre-line; line-height: 1.25;"
        >
          {{ label() }}
        </div>
      }
    </div>
  `,
})
export class ScoreBadgeComponent {
  value = input.required<number>();
  label = input<string | null>(null);
  size = input<Size>('md');

  px = computed<number>(() => ({ sm: 36, md: 44, lg: 56 })[this.size()]);
  fontSize = computed<number>(() => {
    const s = this.size();
    return s === 'lg' ? 20 : s === 'sm' ? 13 : 16;
  });
  colors = computed(() => scoreColor(this.value()));
}
