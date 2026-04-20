import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleLlamada } from '../../../core/models/domain.models';

interface Nota {
  autor: string;
  texto: string;
  fecha: string;
  color: string;
}

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

        <div style="display: flex; flex-direction: column; gap: 10px;">
          @for (n of notas; track $index) {
            <div class="note-card" [style.borderLeftColor]="n.color" style="position: relative;">
              <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 4px;">
                <button
                  type="button"
                  title="Editar"
                  style="width: 26px; height: 26px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0; color: #64748b;"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Borrar"
                  style="width: 26px; height: 26px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0; color: #64748b;"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px; padding-right: 64px;">{{ n.autor }}</div>
              <div style="font-size: 13px; color: #334155; line-height: 1.5; margin-bottom: 6px;">{{ n.texto }}</div>
              <div style="font-size: 11px; color: #94a3b8;">{{ n.fecha }}</div>
            </div>
          }
        </div>
      </div>

      <aside>
        <div class="card">
          <div class="aside-block__title">AÑADIR UNA NOTA</div>
          <textarea
            [value]="draft()"
            (input)="onDraftInput($event)"
            placeholder="Añadir una nota sobre esta llamada…"
            style="width: 100%; min-height: 110px; margin-top: 8px;
                   padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;
                   font-size: 13px; font-family: inherit; resize: vertical;"
          ></textarea>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <span style="font-size: 11px; color: #94a3b8;">{{ draft().length }} caracteres</span>
            <button type="button" class="btn btn--primary" [disabled]="!draft().trim()">Guardar nota</button>
          </div>
        </div>
      </aside>
    </div>
  `,
})
export class TabNotasComponent {
  d = input.required<DetalleLlamada>();
  readonly draft = signal<string>('');

  readonly notas: Nota[] = [
    { autor: 'María Gómez', texto: 'Cliente pregunta sobre la disponibilidad de productos, agente proporciona información detallada.', fecha: '18 Abr 2026, 12:45', color: '#22c55e' },
    { autor: 'Juan Pérez', texto: 'Agente ofrece un descuento del 10% en la próxima compra, cliente agradece la oferta.', fecha: '18 Abr 2026, 12:30', color: '#3b82f6' },
    { autor: 'Juan Pérez', texto: 'Cliente menciona que es su primera compra y está interesada en productos para el hogar.', fecha: '18 Abr 2026, 12:15', color: '#3b82f6' },
  ];

  onDraftInput(e: Event): void {
    this.draft.set((e.target as HTMLTextAreaElement).value);
  }
}
