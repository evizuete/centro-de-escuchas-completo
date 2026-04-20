import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CallsApiService } from '../../core/services/calls-api.service';
import { Llamada, TipoCaso } from '../../core/models/domain.models';
import { IconComponent, IconName } from '../../shared/components/icon.component';
import { TagComponent } from '../../shared/components/tag.component';
import { MiniKpiComponent } from './components/mini-kpi.component';
import { InboxRowComponent } from './components/inbox-row.component';
import { InboxPreviewComponent } from './components/inbox-preview.component';
import { CallCardComponent } from './components/call-card.component';
import { TipoTagComponent } from './components/tipo-tag.component';
import { EstadoTagComponent } from './components/estado-tag.component';
import { scoreColor, sentimentColor } from '../../core/services/style.utils';

type ViewMode = 'inbox' | 'cards' | 'table';
type EstadoFilter = 'todas' | 'revisar' | 'revision' | 'revisado';

interface TipoChip { key: string; label: string; color: string | null; }
interface EstadoChip { key: EstadoFilter; label: string; cls: string; }
interface ViewOption { mode: ViewMode; icon: IconName; }

@Component({
  selector: 'app-llamadas-page',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent, TagComponent,
    MiniKpiComponent, InboxRowComponent, InboxPreviewComponent, CallCardComponent,
    TipoTagComponent, EstadoTagComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <!-- Header -->
      <header class="page__header">
        <div>
          <h1 class="page__title">Llamadas</h1>
          <div class="page__subtitle">Explora, filtra y analiza todas las conversaciones</div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <app-tag variant="slate">{{ filtered().length }} resultados</app-tag>
          <button type="button" class="btn btn--ghost">
            <app-icon name="download" [size]="14" /> Exportar
          </button>
        </div>
      </header>

      <!-- Mini KPIs -->
      <div class="kpis kpis--slim">
        <app-mini-kpi icon="phone" iconColor="#3b82f6" value="8" label="Hoy" />
        <app-mini-kpi icon="sparkles" iconColor="#f59e0b" value="72" label="Valoración" delta="+4.3%" />
        <app-mini-kpi icon="star" iconColor="#8b5cf6" value="74" label="Experiencia cliente" delta="+2.1%" />
        <app-mini-kpi icon="clock" iconColor="#64748b" value="7:26" label="Duración media" delta="-1.5%" />
        <app-mini-kpi icon="alert" iconColor="#dc2626" value="2" label="Reclamaciones" [danger]="true" sub="25%" />
        <app-mini-kpi icon="alert" iconColor="#f97316" value="3" label="Incidencias" [warn]="true" sub="37%" />
        <app-mini-kpi icon="alert" iconColor="#dc2626" value="1" label="Devoluciones" [danger]="true" sub="12%" />
      </div>

      <!-- Filtros -->
      <div class="filter-bar" style="flex-direction: column; align-items: stretch; gap: 10px;">
        <!-- Fila 1: Tipo + Estado -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
          <span style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; margin-right: 2px;">Tipo:</span>
          @for (chip of tipoChips; track chip.key) {
            <button
              type="button"
              class="chip"
              [class.chip--active]="tipoFilter() === chip.key"
              (click)="tipoFilter.set(chip.key)"
              [style.background]="chipBg(chip)"
              [style.color]="chipFg(chip)"
              [style.borderColor]="chipBorder(chip)"
            >
              @if (chip.color) {
                <span
                  [style.background]="chip.color"
                  style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 5px; vertical-align: middle;"
                ></span>
              }
              {{ chip.label }}
            </button>
          }
          <div style="margin-left: auto; display: flex; gap: 6px;">
            @for (chip of estadoChips; track chip.key) {
              <button
                type="button"
                class="chip"
                [class.chip--active]="estadoFilter() === chip.key"
                [class.chip--amber]="chip.cls === 'amber'"
                [class.chip--blue]="chip.cls === 'blue'"
                [class.chip--green]="chip.cls === 'green'"
                (click)="estadoFilter.set(chip.key)"
              >{{ chip.label }}</button>
            }
          </div>
        </div>

        <!-- Fila 2: Filtros secundarios -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
          <span style="font-size: 11px; color: #94a3b8; font-weight: 500; margin-right: 2px;">Filtrar por:</span>
          <select class="select select--sm"><option>Agente</option></select>
          <select class="select select--sm"><option>Sentimiento</option></select>
          <select class="select select--sm"><option>País</option></select>
          <select class="select select--sm"><option>Marca</option></select>
          <div style="display: inline-flex; align-items: center; gap: 6px; margin-left: 4px;">
            <span style="font-size: 11px; color: #64748b; font-weight: 500;">Desde</span>
            <input type="date" class="select select--sm" value="2026-04-01" style="font-family: inherit;" />
            <span style="font-size: 11px; color: #64748b; font-weight: 500;">Hasta</span>
            <input type="date" class="select select--sm" value="2026-04-18" style="font-family: inherit;" />
            <span style="font-size: 10px; color: #94a3b8; font-style: italic;">(ambos incl.)</span>
          </div>
        </div>
      </div>

      <!-- Search con modo semántico -->
      <div class="search-bar" [class.search-bar--semantic]="semanticMode()">
        <app-icon
          [name]="semanticMode() ? 'brain' : 'search'"
          [size]="16"
          [color]="semanticMode() ? '#8b5cf6' : '#64748b'"
        />
        <input
          class="search-bar__input"
          [value]="query()"
          (input)="onQueryInput($event)"
          [placeholder]="semanticMode()
            ? 'Pregunta en lenguaje natural: \\'llamadas donde el cliente pidió descuento\\' o \\'tono agresivo\\'…'
            : 'Buscar por cliente, empresa o agente…'"
        />
        <button
          type="button"
          class="semantic-toggle"
          [class.semantic-toggle--on]="semanticMode()"
          (click)="semanticMode.set(!semanticMode())"
          title="Búsqueda semántica con IA"
        >
          <app-icon name="sparkles" [size]="13" /> <span>Semántica</span>
        </button>
        <div style="display: flex; gap: 4px; margin-left: 8px; border-left: 1px solid #e2e8f0; padding-left: 8px;">
          @for (v of viewOptions; track v.mode) {
            <button
              type="button"
              class="icon-btn"
              [class.icon-btn--active]="view() === v.mode"
              (click)="view.set(v.mode)"
              [title]="v.mode"
            >
              <app-icon [name]="v.icon" [size]="14" />
            </button>
          }
        </div>
      </div>

      <!-- Sugerencias semánticas -->
      @if (semanticMode()) {
        <div class="semantic-suggestions">
          <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px;">Sugerencias</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            @for (s of suggestions; track s) {
              <button type="button" class="semantic-chip" (click)="query.set(s)">
                <app-icon name="sparkles" [size]="11" /> {{ s }}
              </button>
            }
          </div>
        </div>
      }

      <!-- Vistas -->
      @if (view() === 'inbox') {
        <div class="inbox-layout">
          <div class="inbox-list">
            @for (l of filtered(); track l.id) {
              <app-inbox-row
                [llamada]="l"
                [selected]="selected() === l.id"
                (select)="selected.set($event)"
              />
            }
          </div>
          <div class="inbox-preview">
            <app-inbox-preview [llamada]="previewLlamada()" (open)="openCall($event)" />
          </div>
        </div>
      }

      @if (view() === 'cards') {
        <div class="cards-grid">
          @for (l of filtered(); track l.id) {
            <app-call-card [llamada]="l" (open)="openCall($event)" />
          }
        </div>
      }

      @if (view() === 'table') {
        <div class="card" style="padding: 0; overflow: hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Empresa</th>
                <th>Tipo / Subcategoría</th>
                <th>Estado</th>
                <th style="text-align: right;">Valoración</th>
                <th style="text-align: right;">Experiencia</th>
                <th style="text-align: right;">Agente</th>
                <th>Sentimiento</th>
                <th style="text-align: right;">Duración</th>
                <th style="text-align: right;">€</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (l of filtered(); track l.id) {
                <tr (click)="openCall(l.id)">
                  <td style="font-weight: 600;">{{ l.cliente }}</td>
                  <td style="color: #64748b;">{{ l.empresa }}</td>
                  <td><app-tipo-tag [tipo]="l.tipo" [subcategoria]="l.subcategoria" /></td>
                  <td><app-estado-tag [estado]="l.estado" /></td>
                  <td
                    style="text-align: right; font-weight: 700; font-feature-settings: 'tnum';"
                    [style.color]="scoreFg(l.score)"
                  >{{ l.score }}</td>
                  <td style="text-align: right; font-feature-settings: 'tnum';">{{ l.cx }}</td>
                  <td style="text-align: right; font-feature-settings: 'tnum';">{{ l.agente }}</td>
                  <td>
                    <span
                      style="font-weight: 600; font-size: 12px;"
                      [style.color]="sentFg(l.sentimiento)"
                    >{{ l.sentimiento }}</span>
                  </td>
                  <td style="text-align: right; font-feature-settings: 'tnum'; color: #64748b;">{{ l.duracion }}</td>
                  <td style="text-align: right; font-feature-settings: 'tnum'; font-weight: 600;">
                    {{ l.facturacion === 0 ? '—' : '€' + l.facturacion.toFixed(2) }}
                  </td>
                  <td><app-icon name="chevron" [size]="14" color="#94a3b8" /></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class LlamadasPageComponent implements OnInit {
  private api = inject(CallsApiService);
  private router = inject(Router);

  /**
   * Lista cruda de llamadas recibida del backend. Los filtros de UI
   * (tipo, estado, query) se siguen aplicando en cliente sobre esta
   * lista (ver `filtered`). Cuando el volumen lo requiera, se pueden
   * mover esos filtros al query-param del endpoint.
   */
  readonly llamadas = signal<Llamada[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly view = signal<ViewMode>('inbox');
  readonly estadoFilter = signal<EstadoFilter>('todas');
  readonly tipoFilter = signal<string>('todos');
  readonly query = signal<string>('');
  readonly semanticMode = signal<boolean>(false);
  readonly selected = signal<string>('');

  readonly tipoChips: TipoChip[] = [
    { key: 'todos', label: 'Todos', color: null },
    { key: 'Reclamación', label: 'Reclamación', color: '#dc2626' },
    { key: 'Incidencia', label: 'Incidencia', color: '#ea580c' },
    { key: 'Solicitud', label: 'Solicitud', color: '#2563eb' },
    { key: 'Sugerencia', label: 'Sugerencia', color: '#16a34a' },
  ];
  readonly estadoChips: EstadoChip[] = [
    { key: 'todas', label: 'Todas', cls: '' },
    { key: 'revisar', label: '● A revisar', cls: 'amber' },
    { key: 'revision', label: '● En revisión', cls: 'blue' },
    { key: 'revisado', label: '● Revisado', cls: 'green' },
  ];
  readonly viewOptions: ViewOption[] = [
    { mode: 'inbox', icon: 'inbox' },
    { mode: 'cards', icon: 'grid' },
    { mode: 'table', icon: 'list' },
  ];
  readonly suggestions: string[] = [
    'clientes que pidieron descuento',
    'llamadas con tono frustrado al inicio',
    'oportunidades de upsell no aprovechadas',
    'menciones a competidores',
    'clientes nuevos que dudaron en comprar',
  ];

  readonly filtered = computed<Llamada[]>(() => {
    let list = this.llamadas();
    const ef = this.estadoFilter();
    if (ef === 'revisar') list = list.filter((l) => l.estado === 'A REVISAR');
    if (ef === 'revision') list = list.filter((l) => l.estado === 'EN REVISIÓN');
    if (ef === 'revisado') list = list.filter((l) => l.estado === 'REVISADO');

    const tf = this.tipoFilter();
    if (tf !== 'todos') list = list.filter((l) => l.tipo === (tf as TipoCaso));

    const q = this.query().toLowerCase().trim();
    if (q && !this.semanticMode()) {
      list = list.filter(
        (l) =>
          l.cliente.toLowerCase().includes(q) ||
          l.empresa.toLowerCase().includes(q) ||
          l.resumen.toLowerCase().includes(q) ||
          (l.subcategoria ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  readonly previewLlamada = computed<Llamada | null>(() => {
    const list = this.filtered();
    const sel = this.selected();
    return list.find((l) => l.id === sel) ?? list[0] ?? null;
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    // page_size=200 preserva el modelo client-side de filtrado/ordenación.
    // Cuando se active la paginación real, mover estado/tipo/query a params.
    this.api.list({ page: 1, page_size: 200, sort_by: 'call_timestamp', sort_dir: 'desc' }).subscribe({
      next: (res) => {
        this.llamadas.set(res.items);
        this.loading.set(false);
        // Selecciona por defecto la primera llamada del resultado.
        if (!this.selected() && res.items.length > 0) {
          this.selected.set(res.items[0].id);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar las llamadas');
        console.error('[llamadas] error cargando /api/calls', err);
      },
    });
  }

  onQueryInput(e: Event): void {
    this.query.set((e.target as HTMLInputElement).value);
  }

  chipBg(chip: TipoChip): string | null {
    if (this.tipoFilter() === chip.key && chip.color) return chip.color + '18';
    return null;
  }
  chipFg(chip: TipoChip): string | null {
    if (!chip.color) return null;
    return chip.color;
  }
  chipBorder(chip: TipoChip): string | null {
    if (!chip.color) return null;
    return this.tipoFilter() === chip.key ? chip.color + '40' : chip.color + '30';
  }

  scoreFg(v: number): string { return scoreColor(v).fg; }
  sentFg(s: string): string { return sentimentColor(s); }

  openCall(id: string): void {
    this.router.navigate(['/llamadas', id]);
  }
}
