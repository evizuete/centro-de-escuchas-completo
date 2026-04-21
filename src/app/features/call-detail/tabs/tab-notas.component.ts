import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleLlamada, Nota } from '../../../core/models/domain.models';
import { CallsApiService } from '../../../core/services/calls-api.service';

@Component({
  selector: 'app-tab-notas',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="detail-layout">
      <div>
        <h2 class="section-title">Notas</h2>
        <div class="card__subtitle" style="margin-bottom: 14px;">Comentarios sobre la llamada</div>

        @if (loading()) {
          <div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">
            Cargando notas…
          </div>
        } @else if (loadError()) {
          <div style="padding: 16px; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; font-size: 13px;">
            {{ loadError() }}
          </div>
        } @else if (notas().length === 0) {
          <div style="padding: 28px 16px; text-align: center; color: #94a3b8; font-size: 13px;
                      background: #fafafa; border: 1px dashed #e2e8f0; border-radius: 10px;">
            No hay notas para esta llamada todavía. Añade la primera desde el panel de la derecha.
          </div>
        } @else {
          <div style="display: flex; flex-direction: column; gap: 10px;">
            @for (n of notas(); track n.id) {
              <div class="note-card" [style.borderLeftColor]="n.color" style="position: relative;">
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">{{ n.autor }}</div>
                <div style="font-size: 13px; color: #334155; line-height: 1.5; margin-bottom: 6px;">{{ n.texto }}</div>
                <div style="font-size: 11px; color: #94a3b8;">{{ n.fecha }}</div>
              </div>
            }
          </div>
        }
      </div>

      <aside>
        <div class="card">
          <div class="aside-block__title">AÑADIR UNA NOTA</div>
          <textarea
              [value]="draft()"
              (input)="onDraftInput($event)"
              placeholder="Añadir una nota sobre esta llamada…"
              [disabled]="saving()"
              style="width: 100%; min-height: 110px; margin-top: 8px;
                   padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;
                   font-size: 13px; font-family: inherit; resize: vertical;"
          ></textarea>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <span style="font-size: 11px; color: #94a3b8;">{{ draft().length }} / 4000</span>
            <button
                type="button"
                class="btn btn--primary"
                [disabled]="!draft().trim() || saving()"
                (click)="save()"
            >{{ saving() ? 'Guardando…' : 'Guardar nota' }}</button>
          </div>
          @if (saveError()) {
            <div style="margin-top: 8px; padding: 8px 10px; font-size: 12px;
                        color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca;
                        border-radius: 6px;">
              {{ saveError() }}
            </div>
          }
        </div>
      </aside>
    </div>
  `,
})
export class TabNotasComponent implements OnInit {
  private api = inject(CallsApiService);

  d = input.required<DetalleLlamada>();

  readonly notas = signal<Nota[]>([]);
  readonly draft = signal<string>('');
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);

  constructor() {
    // Recarga las notas si cambia el id de la llamada que entra como input.
    effect(() => {
      const callId = this.d().id;
      if (callId) this.loadNotes(callId);
    });
  }

  ngOnInit(): void {
    // El effect del constructor ya dispara la carga inicial.
  }

  onDraftInput(e: Event): void {
    this.draft.set((e.target as HTMLTextAreaElement).value);
  }

  private loadNotes(callId: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.getNotes(callId).subscribe({
      next: (notas) => {
        this.notas.set(notas);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set('No se pudieron cargar las notas');
        console.error('[tab-notas] error cargando notas', err);
      },
    });
  }

  save(): void {
    const texto = this.draft().trim();
    if (!texto) return;

    this.saving.set(true);
    this.saveError.set(null);

    this.api.addNote(this.d().id, { texto }).subscribe({
      next: (nueva) => {
        // Inserta la nueva nota al principio (más reciente primero)
        this.notas.update((arr) => [nueva, ...arr]);
        this.draft.set('');
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.detail || 'No se pudo guardar la nota';
        this.saveError.set(msg);
        console.error('[tab-notas] error guardando nota', err);
      },
    });
  }
}