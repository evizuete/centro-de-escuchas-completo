import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CallsApiService } from '../../core/services/calls-api.service';
import { DetalleLlamada } from '../../core/models/domain.models';
import { IconComponent } from '../../shared/components/icon.component';
import { TagComponent } from '../../shared/components/tag.component';
import { ScoreBadgeComponent } from '../../shared/components/score-badge.component';
import { TabResumenComponent } from './tabs/tab-resumen.component';
import { TabTranscripcionComponent } from './tabs/tab-transcripcion.component';
import { TabMomentosComponent } from './tabs/tab-momentos.component';
import { TabCoachingComponent } from './tabs/tab-coaching.component';
import { TabCalidadComponent } from './tabs/tab-calidad.component';
import { TabAnalisisComponent } from './tabs/tab-analisis.component';
import { TabRecomendacionesComponent } from './tabs/tab-recomendaciones.component';
import { TabNotasComponent } from './tabs/tab-notas.component';

type TabId =
    | 'resumen' | 'transcripcion' | 'momentos' | 'coaching'
    | 'calidad' | 'analisis' | 'recomendaciones' | 'notas';

interface TabDef { id: TabId; label: string; nuevo?: boolean; }

@Component({
  selector: 'app-call-detail-page',
  standalone: true,
  imports: [
    CommonModule, IconComponent, TagComponent, ScoreBadgeComponent,
    TabResumenComponent, TabTranscripcionComponent, TabMomentosComponent,
    TabCoachingComponent, TabCalidadComponent, TabAnalisisComponent,
    TabRecomendacionesComponent, TabNotasComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      @if (loading() && !detalle()) {
        <div style="padding: 40px; text-align: center; color: #64748b;">Cargando llamada…</div>
      }

      @if (error()) {
        <div style="padding: 40px; text-align: center; color: #dc2626;">
          {{ error() }}
          <div style="margin-top: 12px;">
            <button type="button" class="btn btn--ghost" (click)="back()">Volver</button>
          </div>
        </div>
      }

      @if (detalle(); as d) {
        <!-- Topbar -->
        <div class="detail-topbar">
          <button type="button" class="btn btn--ghost" (click)="back()">
            <app-icon name="back" [size]="14" /> Volver
          </button>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; color: #94a3b8; font-feature-settings: 'tnum'; font-family: monospace;">
              {{ d.id }}
            </span>
            <app-tag variant="green">PROCESSED</app-tag>
          </div>
          <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
            <span style="font-size: 12px; color: #64748b;">{{ d.interaccion.agente }}</span>
            <span style="font-size: 12px; color: #94a3b8;">{{ d.interaccion.duracion }}</span>
            <button type="button" class="btn btn--ghost">
              <app-icon name="phone" [size]="13" /> Contactar agente
            </button>
          </div>
        </div>

        <!-- Header -->
        <div class="detail-header">
          <div style="flex: 1; min-width: 0;">
            <app-tag variant="blue">{{ d.categoria }}</app-tag>
            <h1
                style="margin: 8px 0 2px; font-size: 26px; font-weight: 700; color: #0f172a;
                       font-feature-settings: 'tnum'; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;"
            >{{ d.dialedNumber || '—' }}</h1>
            <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
              {{ headerSubtitle() }}
            </div>
            <div style="font-size: 13px; color: #334155; line-height: 1.5; max-width: 620px;">{{ headerDescription() }}</div>
          </div>
          <div style="display: flex; gap: 12px;">
            <app-score-badge [value]="d.score" [label]="'VALORACIÓN\nLLAMADA'" size="lg" />
            <app-score-badge [value]="d.cx" [label]="'EXPERIENCIA\nCLIENTE'" size="lg" />
            <app-score-badge [value]="d.complejidad" label="COMPLEJIDAD" size="lg" />
            <app-score-badge [value]="d.agente" [label]="'CALIDAD\nAGENTE'" size="lg" />
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          @for (t of tabs; track t.id) {
            <button
                type="button"
                class="tab"
                [class.tab--active]="tab() === t.id"
                (click)="tab.set(t.id)"
            >
              {{ t.label }}
              @if (t.nuevo) {
                <span class="tab__new">nuevo</span>
              }
            </button>
          }
        </div>

        <!-- Contenido -->
        @switch (tab()) {
          @case ('resumen')        { <app-tab-resumen [d]="d" (openAgente)="openAgente($event)" /> }
          @case ('transcripcion')  { <app-tab-transcripcion [d]="d" /> }
          @case ('momentos')       { <app-tab-momentos [d]="d" /> }
          @case ('coaching')       { <app-tab-coaching [d]="d" /> }
          @case ('calidad')        { <app-tab-calidad [d]="d" /> }
          @case ('analisis')       { <app-tab-analisis [d]="d" /> }
          @case ('recomendaciones'){ <app-tab-recomendaciones [d]="d" /> }
          @case ('notas')          { <app-tab-notas [d]="d" /> }
        }
      }
    </div>
  `,
})
export class CallDetailPageComponent {
  private api = inject(CallsApiService);
  private router = inject(Router);

  /** Viene por `withComponentInputBinding` desde la ruta `/llamadas/:id`. */
  id = input<string>('');

  readonly detalle = signal<DetalleLlamada | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Subtítulo del header: "campaign · dispositionCode".
   * Omite los trozos vacíos para no mostrar "— · —" o separadores sueltos.
   */
  readonly headerSubtitle = computed<string>(() => {
    const d = this.detalle();
    if (!d) return '';
    const parts = [d.campaign, d.dispositionCode].filter((p) => !!p && p.trim().length > 0);
    return parts.join(' · ') || '—';
  });

  /**
   * Texto corto para la cabecera. Prefiere `oneLineSummary` (generado por
   * phase5c_taxonomy en el backend). Si está vacío (llamadas viejas o sin
   * taxonomía), cae al `resumen` largo recortado a 200 chars con ellipsis.
   */
  readonly headerDescription = computed<string>(() => {
    const d = this.detalle();
    if (!d) return '';
    const short = (d.oneLineSummary || '').trim();
    if (short) return short;
    const long = (d.resumen || '').trim();
    if (long.length <= 200) return long;
    return long.substring(0, 200).trimEnd() + '…';
  });

  readonly tab = signal<TabId>('resumen');
  readonly tabs: TabDef[] = [
    { id: 'resumen',        label: 'Resumen' },
    { id: 'transcripcion',  label: 'Transcripción' },
    { id: 'momentos',       label: 'Momentos' },
    { id: 'coaching',       label: 'Coaching', nuevo: true },
    { id: 'calidad',        label: 'Calidad agente' },
    { id: 'analisis',       label: 'Análisis' },
    { id: 'recomendaciones',label: 'Recomendaciones' },
    { id: 'notas',          label: 'Notas' },
  ];

  constructor() {
    // Cada vez que cambia el :id de la ruta, recarga el detalle.
    effect(() => {
      const callId = this.id();
      if (!callId) {
        this.detalle.set(null);
        return;
      }
      this.loading.set(true);
      this.error.set(null);
      this.api.getDetail(callId).subscribe({
        next: (d) => {
          this.detalle.set(d);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.detalle.set(null);
          const status = err?.status;
          if (status === 404) {
            this.error.set(`Llamada ${callId} no encontrada`);
          } else {
            this.error.set('No se pudo cargar la llamada');
          }
          console.error('[call-detail] error cargando /api/calls/:id', err);
        },
      });
    });
  }

  back(): void {
    this.router.navigate(['/llamadas']);
  }

  openAgente(agenteId: string): void {
    this.router.navigate(['/agentes', agenteId], { queryParams: { from: 'call', callId: this.id() } });
  }
}