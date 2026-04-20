import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TagVariant = 'default' | 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate' | 'gray';
export type TagSize = 'sm' | 'md';

interface TagStyle {
  bg: string;
  fg: string;
  border: string;
}

const VARIANTS: Record<TagVariant, TagStyle> = {
  default: { bg: '#f1f5f9', fg: '#475569', border: '#e2e8f0' },
  blue:    { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  green:   { bg: '#f0fdf4', fg: '#15803d', border: '#bbf7d0' },
  red:     { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' },
  amber:   { bg: '#fffbeb', fg: '#b45309', border: '#fde68a' },
  purple:  { bg: '#faf5ff', fg: '#7c3aed', border: '#e9d5ff' },
  slate:   { bg: '#f8fafc', fg: '#334155', border: '#e2e8f0' },
  gray:    { bg: '#f1f5f9', fg: '#475569', border: '#e2e8f0' },
};

@Component({
  selector: 'app-tag',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      [style.background]="style().bg"
      [style.color]="style().fg"
      [style.border]="'1px solid ' + style().border"
      [style.padding]="size() === 'sm' ? '2px 8px' : '4px 10px'"
      [style.fontSize.px]="size() === 'sm' ? 11 : 12"
      style="display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;
             font-weight: 600; letter-spacing: 0.2px; white-space: nowrap;"
    >
      <ng-content />
    </span>
  `,
})
export class TagComponent {
  variant = input<TagVariant>('default');
  size = input<TagSize>('sm');

  style = computed<TagStyle>(() => VARIANTS[this.variant()]);
}
