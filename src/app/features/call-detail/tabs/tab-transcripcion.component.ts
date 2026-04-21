import { ChangeDetectionStrategy, Component, computed, input, signal, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleLlamada } from '../../../core/models/domain.models';
import { IconComponent } from '../../../shared/components/icon.component';
import { TagComponent } from '../../../shared/components/tag.component';
import { fmtSec, tToSec } from '../../../core/services/style.utils';

type LangMode = 'es-orig' | 'es' | 'orig';
type WavStyle = 'bars' | 'dual' | 'blocks';
type AudioLang = 'original' | 'traducida';

const N_BARS = 96;
const PRIO_COLOR: Record<string, string> = {
  ALTA: '#dc2626', MEDIA: '#f59e0b', BAJA: '#64748b',
};

/** "mm:ss" o "hh:mm:ss" → segundos. Devuelve 0 si no se puede parsear. */
function durationToSec(s: string | undefined | null): number {
  if (!s) return 0;
  const parts = s.split(':').map((x) => parseInt(x, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

@Component({
  selector: 'app-tab-transcripcion',
  standalone: true,
  imports: [CommonModule, IconComponent, TagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 class="section-title" style="margin: 0;">Transcripción</h2>
          <div class="card__subtitle">{{ d().transcripcion.length }} intervenciones · {{ d().interaccion.duracion }} total</div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <div class="seg seg--sm">
            @for (l of langs; track l[0]) {
              <button
                  type="button"
                  class="seg__btn"
                  [class.seg__btn--active]="lang() === l[0]"
                  (click)="lang.set(l[0])"
              >{{ l[1] }}</button>
            }
          </div>
          <div class="seg seg--sm">
            <button
                type="button"
                class="seg__btn"
                [class.seg__btn--active]="audioLang() === 'original'"
                (click)="audioLang.set('original')"
            ><app-icon name="play" [size]="11" /> Original</button>
            <button
                type="button"
                class="seg__btn"
                [class.seg__btn--active]="audioLang() === 'traducida'"
                (click)="audioLang.set('traducida')"
            ><app-icon name="play" [size]="11" /> Traducida</button>
          </div>
        </div>
      </div>

      <!-- Reproductor (DEMO — audio aún no servido por backend) -->
      <div class="card" style="padding: 16px; margin-bottom: 14px; position: relative;">
        <span
            style="position: absolute; top: 10px; right: 10px;
                 padding: 2px 8px; border-radius: 4px; font-size: 10px;
                 font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
                 background: #fef3c7; color: #92400e; border: 1px solid #fde68a;"
            title="Visualización de demostración. La reproducción real se activará cuando el backend exponga los WAV."
        >Demo</span>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <button
                type="button"
                (click)="playing.set(!playing())"
                style="width: 36px; height: 36px; border-radius: 50%; background: #3b82f6;
                     border: none; color: #fff; cursor: pointer;
                     display: flex; align-items: center; justify-content: center;"
                title="Reproducción real pendiente — solo simula el progreso"
            >
              <app-icon [name]="playing() ? 'pause' : 'play'" [size]="14" color="#fff" />
            </button>
            <div>
              <div style="font-size: 13px; font-weight: 600; color: #0f172a;">
                {{ audioLang() === 'original' ? 'Audio original' : 'Audio sintetizado en español' }}
                <span
                    style="margin-left: 8px; font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 4px;"
                    [style.background]="audioLang() === 'original' ? '#fef3c7' : '#dbeafe'"
                    [style.color]="audioLang() === 'original' ? '#92400e' : '#1e40af'"
                >{{ audioLang() === 'original' ? 'IDIOMA FUENTE' : 'IA · voz sintetizada' }}</span>
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px; font-feature-settings: 'tnum';">
                {{ fmt(curSec()) }} / {{ d().interaccion.duracion || '—' }}
              </div>
            </div>
          </div>
          <!-- Selector estilo waveform -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Vista</span>
            <div class="seg seg--sm">
              <button
                  type="button"
                  class="seg__btn"
                  [class.seg__btn--active]="wavStyle() === 'bars'"
                  (click)="wavStyle.set('bars')"
                  title="Barras"
              >
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <rect x="0" y="3" width="1.5" height="4" fill="currentColor" />
                  <rect x="3" y="1" width="1.5" height="8" fill="currentColor" />
                  <rect x="6" y="4" width="1.5" height="3" fill="currentColor" />
                  <rect x="9" y="2" width="1.5" height="6" fill="currentColor" />
                </svg>
              </button>
              <button
                  type="button"
                  class="seg__btn"
                  [class.seg__btn--active]="wavStyle() === 'dual'"
                  (click)="wavStyle.set('dual')"
                  title="Cliente / Agente"
              >
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                  <path d="M0 6 Q 3 2 7 6 T 14 6" stroke="currentColor" stroke-width="1.2" fill="none" />
                  <path d="M0 6 Q 3 10 7 6 T 14 6" stroke="currentColor" stroke-width="1.2" fill="none" opacity="0.5" />
                </svg>
              </button>
              <button
                  type="button"
                  class="seg__btn"
                  [class.seg__btn--active]="wavStyle() === 'blocks'"
                  (click)="wavStyle.set('blocks')"
                  title="Bloques"
              >
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <rect x="0" y="2" width="4" height="6" fill="currentColor" />
                  <rect x="5" y="2" width="2" height="6" fill="currentColor" opacity="0.5" />
                  <rect x="8" y="2" width="3" height="6" fill="currentColor" />
                  <rect x="12" y="2" width="2" height="6" fill="currentColor" opacity="0.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Waveform + momentos overlay -->
        <div style="position: relative; padding-top: 22px;">
          <!-- Pins de momentos -->
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 20px; pointer-events: none;">
            @for (m of momentos(); track $index; let i = $index) {
              <div
                  style="position: absolute; top: 0; transform: translateX(-50%); pointer-events: auto; cursor: pointer;"
                  [style.left.%]="(momSecs()[i] / totalSec()) * 100"
                  (mouseenter)="hoverMom.set(i)"
                  (mouseleave)="hoverMom.set(null)"
                  (click)="seekTo(momSecs()[i])"
                  [title]="m.t + ' · ' + m.texto"
              >
                <div
                    [style.background]="prioColor(m.prioridad)"
                    [style.transform]="hoverMom() === i ? 'scale(1.15)' : 'scale(1)'"
                    [style.boxShadow]="hoverMom() === i ? '0 3px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'"
                    style="width: 18px; height: 18px; border-radius: 50%; color: #fff;
                         font-size: 10px; font-weight: 700;
                         display: flex; align-items: center; justify-content: center;
                         border: 2px solid #fff;
                         transition: transform 0.15s, box-shadow 0.15s;"
                >{{ i + 1 }}</div>
              </div>
            }
          </div>

          <!-- Waveform -->
          <div
              #wavEl
              (click)="onWavClick($event)"
              [style.height.px]="wavStyle() === 'dual' ? 52 : 36"
              style="position: relative; cursor: pointer;"
          >
            <!-- bars -->
            @if (wavStyle() === 'bars') {
              <div style="display: flex; align-items: flex-end; gap: 1.5px; height: 100%;">
                @for (b of bars(); track $index) {
                  <div
                      [style.height.px]="b.h"
                      [style.background]="b.played ? '#3b82f6' : '#dbeafe'"
                      style="flex: 1; border-radius: 2px;"
                  ></div>
                }
              </div>
            }

            <!-- dual -->
            @if (wavStyle() === 'dual') {
              <div style="position: relative; height: 100%;">
                <div style="display: flex; align-items: flex-end; gap: 1.5px; height: 50%; padding-bottom: 1px;">
                  @for (b of dualCli(); track $index) {
                    <div
                        [style.height.px]="b.h"
                        [style.background]="b.played ? '#15803d' : '#bbf7d0'"
                        style="flex: 1; border-radius: 1.5px 1.5px 0 0;"
                    ></div>
                  }
                </div>
                <div style="display: flex; align-items: flex-start; gap: 1.5px; height: 50%; padding-top: 1px;">
                  @for (b of dualAg(); track $index) {
                    <div
                        [style.height.px]="b.h"
                        [style.background]="b.played ? '#1d4ed8' : '#bfdbfe'"
                        style="flex: 1; border-radius: 0 0 1.5px 1.5px;"
                    ></div>
                  }
                </div>
                <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #e2e8f0;"></div>
                <div style="position: absolute; left: -4px; top: 2px; font-size: 8px; color: #15803d; font-weight: 700; letter-spacing: 0.3px; transform: translateX(-100%);">CLI</div>
                <div style="position: absolute; left: -4px; bottom: 2px; font-size: 8px; color: #1d4ed8; font-weight: 700; letter-spacing: 0.3px; transform: translateX(-100%);">AG</div>
              </div>
            }

            <!-- blocks -->
            @if (wavStyle() === 'blocks') {
              <div style="display: flex; gap: 1.5px; height: 100%; align-items: center;">
                @for (blk of blockSegments(); track $index) {
                  <div
                      [style.width.%]="blk.w"
                      [style.height]="blk.current ? '100%' : '70%'"
                      [style.background]="blk.bg"
                      [style.opacity]="blk.played || blk.current ? 1 : 0.7"
                      style="border-radius: 3px; transition: all 0.15s;"
                      [title]="blk.title"
                  ></div>
                }
              </div>
            }

            <!-- Playhead -->
            <div
                [style.left.%]="(curSec() / totalSec()) * 100"
                style="position: absolute; top: -4px; bottom: -4px; width: 2px;
                     background: #0f172a; transform: translateX(-50%);
                     pointer-events: none; box-shadow: 0 0 0 3px rgba(15,23,42,0.1);"
            >
              <div style="position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
                          width: 0; height: 0; border-left: 4px solid transparent;
                          border-right: 4px solid transparent; border-top: 5px solid #0f172a;"></div>
            </div>
          </div>

          <!-- Eje temporal -->
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; margin-top: 6px; font-feature-settings: 'tnum';">
            <span>00:00</span><span>02:30</span><span>05:00</span><span>07:30</span><span>10:10</span>
          </div>

          <!-- Tooltip -->
          @if (hoverMom() !== null && hoverMomData(); as mh) {
            <div
                [style.left.%]="(momSecs()[hoverMom()!] / totalSec()) * 100"
                style="position: absolute; top: 26px; transform: translateX(-50%);
                     background: #0f172a; color: #fff;
                     padding: 8px 10px; border-radius: 6px;
                     font-size: 11px; line-height: 1.4; max-width: 240px; z-index: 10;
                     box-shadow: 0 4px 14px rgba(0,0,0,0.2); pointer-events: none;"
            >
              <div style="font-size: 10px; color: #cbd5e1; font-feature-settings: 'tnum'; margin-bottom: 2px;">
                {{ mh.t }} · {{ mh.tipo }} · {{ mh.prioridad }}
              </div>
              <div>{{ mh.texto }}</div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 4px; font-style: italic;">Click para saltar aquí</div>
            </div>
          }
        </div>

        <!-- Controles -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
          <div style="display: flex; gap: 6px;">
            <button type="button" (click)="seekTo(curSec() - 15)"
                    style="background: none; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #475569;">⟲ 15s</button>
            <button type="button" (click)="seekTo(curSec() + 15)"
                    style="background: none; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #475569;">15s ⟳</button>
            <button type="button"
                    style="background: none; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #475569;">1.0x</button>
          </div>
          <div style="font-size: 10px; color: #94a3b8;">
            <span style="color: #dc2626; font-weight: 700;">●</span> {{ countAlta() }} alta ·
            <span style="color: #f59e0b; font-weight: 700; margin-left: 6px;">●</span> {{ countMedia() }} media ·
            <span style="color: #64748b; font-weight: 700; margin-left: 6px;">●</span> {{ countBaja() }} baja
          </div>
        </div>
      </div>

      <!-- Búsqueda -->
      <div style="position: relative; margin-bottom: 14px;">
        <input
            class="search-bar__input"
            style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px 8px 34px; width: 100%;"
            placeholder="Buscar en la transcripción…"
        />
        <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%);">
          <app-icon name="search" [size]="14" color="#94a3b8" />
        </div>
      </div>

      <!-- Burbujas -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        @for (t of d().transcripcion; track $index) {
          <div
              class="transcript-bubble"
              [class.transcript-bubble--agent]="t.actor === 'AGENTE'"
              [class.transcript-bubble--client]="t.actor === 'CLIENTE'"
              [class.transcript-bubble--current]="isCurrent(t.ini, t.fin)"
          >
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
              <button
                  type="button"
                  (click)="seekTo(toSec(t.ini))"
                  title="Saltar a este punto"
                  style="background: none; border: none; padding: 0; cursor: pointer; color: #3b82f6; display: flex; align-items: center;"
              >
                <app-icon name="play" [size]="11" color="#3b82f6" />
              </button>
              <span
                  style="font-size: 11px; font-weight: 700; letter-spacing: 0.3px;"
                  [style.color]="t.actor === 'AGENTE' ? '#1d4ed8' : '#15803d'"
              >{{ t.actor }}</span>
              <span style="font-size: 11px; color: #94a3b8; font-feature-settings: 'tnum';">{{ t.ini }} – {{ t.fin }}</span>
              <app-tag variant="slate">{{ t.sentimiento }}</app-tag>
            </div>
            @if (lang() === 'es-orig' || lang() === 'es') {
              <div style="font-size: 14px; color: #0f172a; line-height: 1.5;">{{ t.es }}</div>
            }
            @if (lang() === 'es-orig' || lang() === 'orig') {
              <div
                  style="font-size: 13px; color: #64748b; font-style: italic; line-height: 1.5;"
                  [style.marginTop.px]="lang() === 'es-orig' ? 6 : 0"
              >{{ t.orig }}</div>
            }
            <div style="display: flex; gap: 10px; margin-top: 6px; font-size: 10px; color: #94a3b8;">
              <span>{{ t.ppm }} ppm</span><span>·</span>
              <span>{{ t.hz }} Hz</span><span>·</span>
              <span>confidence {{ t.conf }}%</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class TabTranscripcionComponent {
  d = input.required<DetalleLlamada>();

  readonly lang = signal<LangMode>('es-orig');
  readonly audioLang = signal<AudioLang>('original');
  readonly wavStyle = signal<WavStyle>('dual');
  readonly playing = signal<boolean>(false);
  readonly curSec = signal<number>(90);
  readonly hoverMom = signal<number | null>(null);

  /** Duración total en segundos, derivada de d().interaccion.duracion. */
  readonly totalSec = computed<number>(() => durationToSec(this.d().interaccion.duracion));
  readonly langs: [LangMode, string][] = [
    ['es-orig', 'ES + ORI'],
    ['es', 'ES'],
    ['orig', 'ORI'],
  ];

  wavEl = viewChild<ElementRef<HTMLDivElement>>('wavEl');

  momentos = computed(() => this.d().momentos);
  momSecs = computed<number[]>(() => this.momentos().map((m) => tToSec(m.t)));

  hoverMomData = computed(() => {
    const i = this.hoverMom();
    return i === null ? null : this.momentos()[i];
  });

  // Bars mode
  bars = computed(() => {
    const cur = this.curSec();
    return Array.from({ length: N_BARS }, (_, i) => {
      const h = 2 + Math.abs(Math.sin(i * 0.42 + 1.1)) * 24;
      const played = (i / N_BARS) * this.totalSec() < cur;
      return { h, played };
    });
  });

  // Dual mode
  dualCli = computed(() => {
    const cur = this.curSec();
    return Array.from({ length: N_BARS }, (_, i) => {
      const h = 2 + Math.abs(Math.sin(i * 0.45 + 0.6)) * 22;
      const played = (i / N_BARS) * this.totalSec() < cur;
      return { h, played };
    });
  });
  dualAg = computed(() => {
    const cur = this.curSec();
    return Array.from({ length: N_BARS }, (_, i) => {
      const h = 2 + Math.abs(Math.cos(i * 0.38 + 1.8)) * 22;
      const played = (i / N_BARS) * this.totalSec() < cur;
      return { h, played };
    });
  });

  // Blocks mode
  blockSegments = computed(() => {
    const cur = this.curSec();
    return this.d().transcripcion.map((t) => {
      const ini = tToSec(t.ini), fin = tToSec(t.fin);
      const w = ((fin - ini) / this.totalSec()) * 100;
      const played = cur >= fin;
      const current = cur >= ini && cur < fin;
      const isAg = t.actor === 'AGENTE';
      const col = isAg ? '#1d4ed8' : '#15803d';
      const bg = played ? col : current ? col : isAg ? '#bfdbfe' : '#bbf7d0';
      return { w, played, current, bg, title: `${t.actor} · ${t.ini}–${t.fin}` };
    });
  });

  countAlta = computed(() => this.momentos().filter((m) => m.prioridad === 'ALTA').length);
  countMedia = computed(() => this.momentos().filter((m) => m.prioridad === 'MEDIA').length);
  countBaja = computed(() => this.momentos().filter((m) => m.prioridad === 'BAJA').length);

  prioColor(p: string): string { return PRIO_COLOR[p] ?? '#64748b'; }
  fmt(s: number): string { return fmtSec(s); }
  toSec(t: string): number { return tToSec(t); }
  isCurrent(ini: string, fin: string): boolean {
    const s = this.curSec();
    return s >= tToSec(ini) && s < tToSec(fin);
  }

  seekTo(sec: number): void {
    this.curSec.set(Math.max(0, Math.min(this.totalSec(), sec)));
  }

  onWavClick(e: MouseEvent): void {
    const el = this.wavEl()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    this.seekTo(frac * this.totalSec());
  }
}