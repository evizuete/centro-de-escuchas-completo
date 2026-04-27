import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef,
  OnDestroy, computed, effect, inject, input, signal, viewChild, viewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { DetalleLlamada } from '../../../core/models/domain.models';
import { IconComponent } from '../../../shared/components/icon.component';
import { TagComponent } from '../../../shared/components/tag.component';
import { fmtSec, tToSec } from '../../../core/services/style.utils';
import { TranscripcionService } from '../../../core/services/transcripcion.service';

type LangMode = 'es-orig' | 'es' | 'orig';
type WavStyle = 'bars' | 'dual' | 'blocks';
type AudioLang = 'original' | 'traducida';

const N_BARS = 96;
const PRIO_COLOR: Record<string, string> = {
  ALTA: '#dc2626', MEDIA: '#f59e0b', BAJA: '#64748b',
};

/**
 * Si el usuario ha hecho scroll manualmente en los últimos USER_SCROLL_GRACE_MS
 * milisegundos, suspendemos el scroll automático al turno activo para no
 * luchar contra su intención.
 */
const USER_SCROLL_GRACE_MS = 2500;

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
  styles: [`
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  template: `
    <div>
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <div>
            <h2 class="section-title" style="margin: 0;">Transcripción</h2>
            <div class="card__subtitle">{{ d().transcripcion.length }} intervenciones · {{ d().interaccion.duracion }} total</div>
          </div>
          <!-- Chip "Sospechosa" — se muestra solo cuando la Fase 2 marcó la
               transcripción como sospechosamente corta (ratio palabras/duración
               muy bajo). El supervisor lo ve de un vistazo para priorizar
               revisión manual. Tooltip con las razones concretas. -->
          @if (d().transcriptSuspicious) {
            <span
                class="chip-suspicious"
                [title]="suspiciousTooltip()"
                style="display: inline-flex; align-items: center; gap: 4px;
                       padding: 3px 8px; border-radius: 999px;
                       font-size: 10px; font-weight: 700; letter-spacing: 0.4px;
                       text-transform: uppercase;
                       background: #fef3c7; color: #92400e;
                       border: 1px solid #fde68a; cursor: help;"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1.5 L11 10.5 L1 10.5 Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/>
                <rect x="5.4" y="4.8" width="1.2" height="3" rx="0.4" fill="currentColor"/>
                <rect x="5.4" y="8.4" width="1.2" height="1.2" rx="0.4" fill="currentColor"/>
              </svg>
              Sospechosa
            </span>
          }
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
                [disabled]="!hasOriginal()"
                (click)="switchAudio('original')"
                [title]="hasOriginal() ? 'Audio original' : 'Audio original no disponible'"
            ><app-icon name="play" [size]="11" /> Original</button>

            <!-- "Traducida" / "Traducir" — si translatedAudio es null, el botón
                 cambia a estilo ámbar y, al pulsar, dispara la generación TTS
                 vía backend. Una vez recibida la presigned URL, vuelve a su
                 comportamiento normal de toggle. -->
            <button
                type="button"
                class="seg__btn"
                [class.seg__btn--active]="audioLang() === 'traducida' && !necesitaGenerarTraduccion()"
                [disabled]="generandoTraduccion()"
                (click)="onTraducidaClick()"
                [title]="
                  generandoTraduccion()
                    ? 'Generando audio traducido…'
                    : (necesitaGenerarTraduccion()
                        ? 'Generar audio traducido (TTS)'
                        : 'Audio traducido')
                "
                [style.background]="
                  necesitaGenerarTraduccion() && !generandoTraduccion() ? '#f59e0b' : null
                "
                [style.color]="
                  necesitaGenerarTraduccion() && !generandoTraduccion() ? '#fff' : null
                "
                [style.borderColor]="
                  necesitaGenerarTraduccion() && !generandoTraduccion() ? '#d97706' : null
                "
            >
              @if (generandoTraduccion()) {
                <span
                    style="display: inline-block; width: 10px; height: 10px;
                           border: 2px solid currentColor; border-right-color: transparent;
                           border-radius: 50%; animation: spin 0.7s linear infinite;
                           margin-right: 4px; vertical-align: middle;"
                    aria-hidden="true"
                ></span>
                Generando…
              } @else if (necesitaGenerarTraduccion()) {
                <app-icon name="play" [size]="11" /> Traducir
              } @else {
                <app-icon name="play" [size]="11" /> Traducida
              }
            </button>
          </div>
        </div>
      </div>

      <!-- Elementos <audio> ocultos. Mantenemos ambos cargados en paralelo para
           que el toggle Original/Traducida sea instantáneo y preservamos
           currentTime copiándolo entre ellos. -->
      <audio
          #audioOrig
          [src]="d().originalAudio || null"
          preload="metadata"
          (loadedmetadata)="onLoadedMetadata('original', $event)"
          (timeupdate)="onTimeUpdate('original')"
          (play)="onPlayStateChange('original', true)"
          (pause)="onPlayStateChange('original', false)"
          (ended)="onAudioEnded()"
          style="display: none;"
      ></audio>
      <audio
          #audioTrad
          [src]="effectiveTranslatedAudio() || null"
          preload="metadata"
          (loadedmetadata)="onLoadedMetadata('traducida', $event)"
          (timeupdate)="onTimeUpdate('traducida')"
          (play)="onPlayStateChange('traducida', true)"
          (pause)="onPlayStateChange('traducida', false)"
          (ended)="onAudioEnded()"
          style="display: none;"
      ></audio>

      <!-- Reproductor — pegado arriba mientras el usuario scrollea la lista de turnos -->
      <div
          class="card"
          style="padding: 16px; margin-bottom: 14px; position: sticky; top: 0;
                 z-index: 5; background: #fff;"
      >
        @if (!hasAnyAudio()) {
          <span
              style="position: absolute; top: 10px; right: 10px;
                   padding: 2px 8px; border-radius: 4px; font-size: 10px;
                   font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
                   background: #fef3c7; color: #92400e; border: 1px solid #fde68a;"
              title="El backend aún no ha expuesto las URLs de audio para esta llamada."
          >Audio no disponible</span>
        }
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <button
                type="button"
                (click)="togglePlay()"
                [disabled]="!hasAnyAudio()"
                style="width: 36px; height: 36px; border-radius: 50%; background: #3b82f6;
                     border: none; color: #fff; cursor: pointer;
                     display: flex; align-items: center; justify-content: center;"
                [style.opacity]="hasAnyAudio() ? 1 : 0.4"
                [style.cursor]="hasAnyAudio() ? 'pointer' : 'not-allowed'"
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
                {{ fmt(curSec()) }} / {{ fmt(totalSec()) }}
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
                [style.left.%]="totalSec() > 0 ? (curSec() / totalSec()) * 100 : 0"
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
            <span>{{ fmt(0) }}</span>
            <span>{{ fmt(totalSec() * 0.25) }}</span>
            <span>{{ fmt(totalSec() * 0.5) }}</span>
            <span>{{ fmt(totalSec() * 0.75) }}</span>
            <span>{{ fmt(totalSec()) }}</span>
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
            <button type="button" (click)="seekTo(curSec() - 15)" [disabled]="!hasAnyAudio()"
                    style="background: none; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #475569;">⟲ 15s</button>
            <button type="button" (click)="seekTo(curSec() + 15)" [disabled]="!hasAnyAudio()"
                    style="background: none; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #475569;">15s ⟳</button>
            <button type="button" (click)="cycleRate()" [disabled]="!hasAnyAudio()"
                    style="background: none; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #475569; font-feature-settings: 'tnum';"
                    [title]="'Velocidad — ' + playbackRate().toFixed(2) + 'x'"
            >{{ playbackRate().toFixed(playbackRate() === 1 ? 1 : 2) }}x</button>
          </div>
          <div style="font-size: 10px; color: #94a3b8;">
            <span style="color: #dc2626; font-weight: 700;">●</span> {{ countAlta() }} alta ·
            <span style="color: #f59e0b; font-weight: 700; margin-left: 6px;">●</span> {{ countMedia() }} media ·
            <span style="color: #64748b; font-weight: 700; margin-left: 6px;">●</span> {{ countBaja() }} baja
          </div>
        </div>
      </div>

      <!-- Búsqueda — resalta coincidencias en los textos visibles según el toggle ES/ORI -->
      <div style="position: relative; margin-bottom: 14px; display: flex; gap: 8px; align-items: center;">
        <div style="position: relative; flex: 1;">
          <input
              class="search-bar__input"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px 8px 34px; width: 100%;"
              placeholder="Buscar en la transcripción…"
              [value]="query()"
              (input)="onQueryInput($event)"
              (keydown.escape)="query.set('')"
              (keydown.enter)="jumpToMatch($any($event).shiftKey ? -1 : 1)"
          />
          <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%);">
            <app-icon name="search" [size]="14" color="#94a3b8" />
          </div>
          @if (query()) {
            <button
                type="button"
                (click)="query.set('')"
                title="Limpiar búsqueda (Esc)"
                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
                       background: none; border: none; cursor: pointer; color: #94a3b8;
                       font-size: 14px; padding: 2px 6px; line-height: 1;"
            >✕</button>
          }
        </div>
        @if (query()) {
          <div
              style="display: flex; align-items: center; gap: 6px; font-size: 12px;
                     color: #64748b; font-feature-settings: 'tnum'; flex: none;"
          >
            <span>{{ matchCount() }} {{ matchCount() === 1 ? 'coincidencia' : 'coincidencias' }}</span>
            @if (matchCount() > 0) {
              <button
                  type="button"
                  (click)="jumpToMatch(-1)"
                  title="Anterior (Shift+Enter)"
                  style="background: none; border: 1px solid #e2e8f0; border-radius: 6px;
                         padding: 2px 6px; cursor: pointer; color: #475569; font-size: 12px;"
              >↑</button>
              <button
                  type="button"
                  (click)="jumpToMatch(1)"
                  title="Siguiente (Enter)"
                  style="background: none; border: 1px solid #e2e8f0; border-radius: 6px;
                         padding: 2px 6px; cursor: pointer; color: #475569; font-size: 12px;"
              >↓</button>
            }
          </div>
        }
      </div>

      <!-- Burbujas. Scroll local (no del documento) para no mover el reproductor
           pegado arriba. max-height en calc() es aproximado: deja el alto del
           reproductor + barra de búsqueda visibles y el resto para los turnos. -->
      <div
          #bubblesContainer
          (scroll)="onUserScroll()"
          style="display: flex; flex-direction: column; gap: 8px;
                 max-height: calc(100vh - 380px); min-height: 300px;
                 overflow-y: auto; padding-right: 4px;"
      >
        @for (t of d().transcripcion; track $index; let i = $index) {
          <div
              #bubble
              class="transcript-bubble"
              [class.transcript-bubble--agent]="t.actor === 'AGENTE'"
              [class.transcript-bubble--client]="t.actor === 'CLIENTE'"
              [class.transcript-bubble--current]="isCurrent(t.ini, t.fin)"
              (click)="onBubbleClick(t.ini)"
              [style.cursor]="hasAnyAudio() ? 'pointer' : 'default'"
              [attr.data-idx]="i"
          >
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
              <button
                  type="button"
                  (click)="$event.stopPropagation(); seekTo(toSec(t.ini))"
                  [disabled]="!hasAnyAudio()"
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
              <div style="font-size: 14px; color: #0f172a; line-height: 1.5;">
                @for (seg of highlight(t.es); track $index) {
                  @if (seg.match) {
                    <mark style="background: #fef08a; color: #0f172a; padding: 0 2px; border-radius: 2px;">{{ seg.text }}</mark>
                  } @else {
                    <span>{{ seg.text }}</span>
                  }
                }
              </div>
            }
            @if (lang() === 'es-orig' || lang() === 'orig') {
              <div
                  style="font-size: 13px; color: #64748b; font-style: italic; line-height: 1.5;"
                  [style.marginTop.px]="lang() === 'es-orig' ? 6 : 0"
              >
                @for (seg of highlight(t.orig); track $index) {
                  @if (seg.match) {
                    <mark style="background: #fef08a; color: #0f172a; padding: 0 2px; border-radius: 2px;">{{ seg.text }}</mark>
                  } @else {
                    <span>{{ seg.text }}</span>
                  }
                }
              </div>
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
export class TabTranscripcionComponent implements AfterViewInit, OnDestroy {
  d = input.required<DetalleLlamada>();

  private readonly transcripcionSvc = inject(TranscripcionService);

  readonly lang = signal<LangMode>('es-orig');
  readonly audioLang = signal<AudioLang>('original');
  readonly wavStyle = signal<WavStyle>('dual');
  readonly playing = signal<boolean>(false);
  /**
   * Posición de reproducción actual, en segundos. Se alimenta desde el evento
   * `timeupdate` del <audio> activo (y de forma más suave vía rAF durante
   * la reproducción, para que la playhead de la waveform no "salte").
   */
  readonly curSec = signal<number>(0);
  readonly hoverMom = signal<number | null>(null);
  readonly playbackRate = signal<number>(1);
  /** Texto del buscador. Resalta coincidencias en las burbujas (no filtra). */
  readonly query = signal<string>('');
  /**
   * Índice de la burbuja a la que apuntamos con ↑/↓ del buscador. Se mueve
   * por las que tienen al menos 1 coincidencia. -1 cuando no hay búsqueda.
   */
  private cursorMatchIdx = -1;
  /**
   * Duración en segundos obtenida del <audio> cargado. Si ninguno lo ha
   * reportado aún, usamos el string de metadata como fallback.
   */
  readonly audioDurationSec = signal<number>(0);

  /**
   * Override en runtime de `d().translatedAudio` cuando el usuario solicita
   * la generación del audio traducido. `null` significa "usa el del input".
   * Se resetea al cambiar de llamada.
   */
  private readonly translatedAudioOverride = signal<string | null>(null);

  /** True mientras se está llamando al backend para generar el audio TTS. */
  readonly generandoTraduccion = signal<boolean>(false);

  /** URL efectiva del audio traducido (override > input). */
  readonly effectiveTranslatedAudio = computed<string>(() =>
      (this.translatedAudioOverride() ?? this.d().translatedAudio ?? '').trim()
  );

  /** True cuando aún no hay audio traducido y hay que generarlo. */
  readonly necesitaGenerarTraduccion = computed<boolean>(
      () => !this.effectiveTranslatedAudio()
  );

  /**
   * Tooltip humano del chip "Sospechosa". Traduce los códigos de razón que
   * vienen del backend a texto legible. Si no hay razones catalogadas, da
   * un mensaje genérico explicando qué significa el flag.
   */
  readonly suspiciousTooltip = computed<string>(() => {
    const reasons = this.d().transcriptSuspiciousReasons || [];
    const intro = 'Transcripción posiblemente incompleta — ratio palabras/duración muy bajo. ';
    if (reasons.length === 0) {
      return intro + 'Revísala manualmente contrastando con el audio.';
    }
    const labels: Record<string, string> = {
      language_mismatch: 'idioma detectado distinto del esperado',
      low_snr_agent: 'canal del agente con ruido alto (SNR bajo)',
      low_snr_client: 'canal del cliente con ruido alto (SNR bajo)',
      channel_imbalance: 'desbalance de turnos entre canales',
      unknown: 'causa no catalogada',
    };
    const human = reasons.map((r) => labels[r] ?? r).join(' · ');
    return `${intro}Causas detectadas: ${human}.`;
  });

  /** Duración final (prioriza la del <audio>, cae a la metadata). */
  readonly totalSec = computed<number>(() => {
    const fromAudio = this.audioDurationSec();
    if (fromAudio > 0) return fromAudio;
    return durationToSec(this.d().interaccion.duracion);
  });

  readonly hasOriginal = computed<boolean>(() => !!(this.d().originalAudio || '').trim());
  readonly hasTranslated = computed<boolean>(() => !!this.effectiveTranslatedAudio());
  readonly hasAnyAudio = computed<boolean>(() => this.hasOriginal() || this.hasTranslated());

  readonly langs: [LangMode, string][] = [
    ['es-orig', 'ES + ORI'],
    ['es', 'ES'],
    ['orig', 'ORI'],
  ];

  wavEl = viewChild<ElementRef<HTMLDivElement>>('wavEl');
  audioOrigEl = viewChild<ElementRef<HTMLAudioElement>>('audioOrig');
  audioTradEl = viewChild<ElementRef<HTMLAudioElement>>('audioTrad');
  bubblesContainer = viewChild<ElementRef<HTMLDivElement>>('bubblesContainer');
  bubbles = viewChildren<ElementRef<HTMLDivElement>>('bubble');

  momentos = computed(() => this.d().momentos);
  momSecs = computed<number[]>(() => this.momentos().map((m) => tToSec(m.t)));

  hoverMomData = computed(() => {
    const i = this.hoverMom();
    return i === null ? null : this.momentos()[i];
  });

  /** Timestamp del último scroll manual del usuario (0 si nunca). */
  private lastUserScrollMs = 0;
  /**
   * Timestamp hasta el que debemos ignorar eventos de scroll del contenedor,
   * porque estamos haciendo un `scrollIntoView` automático. Sin esto, el
   * evento `scroll` disparado por nuestro propio auto-scroll se contabilizaría
   * como "scroll del usuario" y suspendería los siguientes auto-scrolls.
   */
  private autoScrollUntilMs = 0;
  /** Índice de la burbuja activa la última vez que hicimos auto-scroll. */
  private lastAutoScrolledIdx = -1;
  private rafId: number | null = null;

  constructor() {
    // Effect: cada vez que cambia el índice de la burbuja activa, si procede
    // hacer scroll automático, lo hacemos. Reaccionamos a `curSec` + `transcripcion`.
    effect(() => {
      const idx = this.activeBubbleIdx();
      if (idx < 0) return;
      if (idx === this.lastAutoScrolledIdx) return;
      // Respeta el scroll manual reciente del usuario.
      if (Date.now() - this.lastUserScrollMs < USER_SCROLL_GRACE_MS) return;
      this.scrollBubbleIntoViewIfNeeded(idx);
      this.lastAutoScrolledIdx = idx;
    });

    // Effect: al cambiar el id de la llamada (nuevos `d()`), reseteamos el
    // estado del reproductor para no heredar posiciones de llamadas previas.
    effect(() => {
      // Tocar d() para que el effect se re-ejecute al cambiar de llamada.
      this.d();
      this.curSec.set(0);
      this.audioDurationSec.set(0);
      this.playing.set(0 as unknown as boolean); // placate strict-bool types
      this.playing.set(false);
      this.lastAutoScrolledIdx = -1;
      // Reset del estado del botón "Traducir" — la URL generada para una
      // llamada no tiene sentido en otra.
      this.translatedAudioOverride.set(null);
      this.generandoTraduccion.set(false);
    });
  }

  ngAfterViewInit(): void {
    // El <audio> ya queda enlazado al DOM por Angular; los listeners están
    // declarados en el template. Nada que hacer aquí por ahora.
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  // ----- Waveforms: bars / dual / blocks ------------------------------------

  bars = computed(() => {
    const cur = this.curSec();
    return Array.from({ length: N_BARS }, (_, i) => {
      const h = 2 + Math.abs(Math.sin(i * 0.42 + 1.1)) * 24;
      const played = (i / N_BARS) * this.totalSec() < cur;
      return { h, played };
    });
  });

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

  blockSegments = computed(() => {
    const cur = this.curSec();
    const total = this.totalSec() || 1;
    return this.d().transcripcion.map((t) => {
      const ini = tToSec(t.ini), fin = tToSec(t.fin);
      const w = ((fin - ini) / total) * 100;
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

  /**
   * Índice del turno de la transcripción que contiene `curSec`, o -1 si
   * ninguno. Lo usamos para el scroll automático (effect arriba) y para
   * la burbuja resaltada (`isCurrent` hace lo mismo por string, pero este
   * devuelve directamente el índice).
   */
  activeBubbleIdx = computed<number>(() => {
    const s = this.curSec();
    const ts = this.d().transcripcion;
    for (let i = 0; i < ts.length; i++) {
      if (s >= tToSec(ts[i].ini) && s < tToSec(ts[i].fin)) return i;
    }
    return -1;
  });

  // ----- Helpers de plantilla -----------------------------------------------

  prioColor(p: string): string { return PRIO_COLOR[p] ?? '#64748b'; }
  fmt(s: number): string { return fmtSec(s); }
  toSec(t: string): number { return tToSec(t); }
  isCurrent(ini: string, fin: string): boolean {
    const s = this.curSec();
    return s >= tToSec(ini) && s < tToSec(fin);
  }

  // ----- Búsqueda ------------------------------------------------------------

  onQueryInput(e: Event): void {
    this.query.set((e.target as HTMLInputElement).value);
    this.cursorMatchIdx = -1;  // reset cursor al cambiar el término
  }

  /**
   * Normaliza una cadena para comparación: minúsculas y sin acentos (NFD
   * descompone "á" en "a" + combining mark, y el regex quita los marks).
   * Así "accion" encuentra "acción" y "napoli" encuentra "Nápoli".
   */
  private normalize(s: string): string {
    return (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Trocea `text` en segmentos `{text, match}` según la query. El template
   * pinta los match con <mark>. Preserva el texto original (con acentos)
   * aunque la comparación se haga sobre la versión normalizada.
   *
   * Devolvemos [{text, match:false}] cuando no hay búsqueda para simplificar
   * el template (siempre itera segmentos).
   */
  highlight(text: string): ReadonlyArray<{ text: string; match: boolean }> {
    const q = this.query().trim();
    if (!q || !text) return [{ text: text || '', match: false }];

    const hay = this.normalize(text);
    const needle = this.normalize(q);
    if (!needle) return [{ text, match: false }];

    const out: { text: string; match: boolean }[] = [];
    let i = 0;
    while (i < hay.length) {
      const j = hay.indexOf(needle, i);
      if (j < 0) {
        out.push({ text: text.slice(i), match: false });
        break;
      }
      if (j > i) out.push({ text: text.slice(i, j), match: false });
      out.push({ text: text.slice(j, j + needle.length), match: true });
      i = j + needle.length;
    }
    return out;
  }

  /**
   * Índices de burbujas con al menos una coincidencia en los campos visibles
   * según el toggle `lang`. Se recalcula como signal derivado para que
   * `matchCount` y `jumpToMatch` compartan la misma lista.
   */
  readonly matchingIdxs = computed<number[]>(() => {
    const q = this.query().trim();
    if (!q) return [];
    const needle = this.normalize(q);
    if (!needle) return [];
    const l = this.lang();
    const checkEs = l === 'es-orig' || l === 'es';
    const checkOrig = l === 'es-orig' || l === 'orig';
    return this.d().transcripcion.reduce<number[]>((acc, t, idx) => {
      const matchEs = checkEs && this.normalize(t.es).includes(needle);
      const matchOr = checkOrig && this.normalize(t.orig).includes(needle);
      if (matchEs || matchOr) acc.push(idx);
      return acc;
    }, []);
  });

  matchCount = computed<number>(() => this.matchingIdxs().length);

  /**
   * Salta a la siguiente/anterior burbuja con coincidencia. `dir` = +1 o -1.
   * Usa el contenedor de burbujas para hacer el scroll local (no del doc).
   */
  jumpToMatch(dir: number): void {
    const idxs = this.matchingIdxs();
    if (idxs.length === 0) return;
    // Si no hay cursor aún, arranca en el primero/último según dirección.
    if (this.cursorMatchIdx < 0) {
      this.cursorMatchIdx = dir > 0 ? 0 : idxs.length - 1;
    } else {
      this.cursorMatchIdx = (this.cursorMatchIdx + dir + idxs.length) % idxs.length;
    }
    const bubbleIdx = idxs[this.cursorMatchIdx];
    const bubbleRefs = this.bubbles();
    if (bubbleIdx < 0 || bubbleIdx >= bubbleRefs.length) return;
    // Usamos la misma ventana de auto-scroll que el sync del audio.
    this.autoScrollUntilMs = Date.now() + 700;
    bubbleRefs[bubbleIdx].nativeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ----- Control del reproductor --------------------------------------------

  /** Devuelve el HTMLAudioElement actualmente activo (o null si no hay ninguno). */
  private activeAudio(): HTMLAudioElement | null {
    const which = this.audioLang();
    const ref = which === 'original' ? this.audioOrigEl() : this.audioTradEl();
    return ref?.nativeElement ?? null;
  }

  /** El audio "inactivo" — útil para mantenerlo silenciado/pausado. */
  private inactiveAudio(): HTMLAudioElement | null {
    const which = this.audioLang();
    const ref = which === 'original' ? this.audioTradEl() : this.audioOrigEl();
    return ref?.nativeElement ?? null;
  }

  togglePlay(): void {
    const a = this.activeAudio();
    if (!a) return;
    if (a.paused) {
      a.play().catch((err) => {
        console.warn('[transcripcion] play() rechazado', err);
      });
    } else {
      a.pause();
    }
  }

  /**
   * Cambio de idioma del reproductor. Preserva la posición (tu requisito):
   * copiamos currentTime del activo al nuevo y, si estaba reproduciendo,
   * arrancamos el nuevo tras pausar el anterior.
   */
  switchAudio(to: AudioLang): void {
    if (to === this.audioLang()) return;
    // Si no hay fuente para el destino, no permitir el cambio.
    if (to === 'original' && !this.hasOriginal()) return;
    if (to === 'traducida' && !this.hasTranslated()) return;

    const prev = this.activeAudio();
    const wasPlaying = prev ? !prev.paused : false;
    const t = prev?.currentTime ?? this.curSec();

    prev?.pause();
    this.audioLang.set(to);

    // Esperar al ciclo de detección para que `activeAudio()` devuelva el nuevo.
    queueMicrotask(() => {
      const next = this.activeAudio();
      if (!next) return;
      try {
        next.currentTime = Math.min(t, next.duration || t);
      } catch {
        /* ignore setCurrentTime errors si el audio aún no está listo */
      }
      next.playbackRate = this.playbackRate();
      if (wasPlaying) {
        next.play().catch(() => { /* autoplay bloqueado: el botón queda en pause */ });
      }
    });
  }

  /**
   * Click en el botón "Traducida / Traducir":
   * - Si ya hay audio traducido → comportamiento normal (cambiar de pista).
   * - Si no lo hay → llama al backend, guarda la presigned URL y, una vez
   *   disponible, conmuta a la pista traducida.
   */
  async onTraducidaClick(): Promise<void> {
    if (this.generandoTraduccion()) return;

    if (!this.necesitaGenerarTraduccion()) {
      this.switchAudio('traducida');
      return;
    }

    this.generandoTraduccion.set(true);
    try {
      const { presignedUrl } = await firstValueFrom(
          this.transcripcionSvc.generarAudioTraducido(this.d().id),
      );
      this.translatedAudioOverride.set(presignedUrl);

      // Esperar a que Angular renderice el nuevo [src] en <audio #audioTrad>
      // antes de pedir el switch (si no, hasTranslated() ya es true pero el
      // elemento aún no tiene la fuente cargada en el DOM).
      queueMicrotask(() => this.switchAudio('traducida'));
    } catch (err) {
      console.error('[transcripcion] Error generando audio traducido', err);
    } finally {
      this.generandoTraduccion.set(false);
    }
  }

  seekTo(sec: number): void {
    const total = this.totalSec();
    const clamped = Math.max(0, Math.min(total || sec, sec));
    const a = this.activeAudio();
    if (a) {
      try { a.currentTime = clamped; } catch { /* ignore */ }
    }
    this.curSec.set(clamped);
  }

  onWavClick(e: MouseEvent): void {
    const el = this.wavEl()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    this.seekTo(frac * this.totalSec());
  }

  onBubbleClick(ini: string): void {
    if (!this.hasAnyAudio()) return;
    this.seekTo(tToSec(ini));
  }

  cycleRate(): void {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const cur = this.playbackRate();
    const next = rates[(rates.indexOf(cur) + 1) % rates.length];
    this.playbackRate.set(next);
    const a = this.activeAudio();
    if (a) a.playbackRate = next;
  }

  // ----- Listeners del <audio> ----------------------------------------------

  onLoadedMetadata(which: AudioLang, e: Event): void {
    const a = e.target as HTMLAudioElement;
    if (!a) return;
    // Solo actualizamos totalSec si es del audio activo (los dos pueden
    // tener duraciones diferentes; por ejemplo el TTS suele ser ligeramente
    // más largo o más corto que el original).
    if (which === this.audioLang() && Number.isFinite(a.duration)) {
      this.audioDurationSec.set(a.duration);
    }
  }

  onTimeUpdate(which: AudioLang): void {
    if (which !== this.audioLang()) return;
    const a = this.activeAudio();
    if (!a) return;
    this.curSec.set(a.currentTime);
  }

  onPlayStateChange(which: AudioLang, isPlaying: boolean): void {
    if (which !== this.audioLang()) return;
    this.playing.set(isPlaying);

    // rAF loop para una playhead más fluida que los ~4Hz de `timeupdate`.
    if (isPlaying) this.startRafLoop();
    else this.stopRafLoop();
  }

  onAudioEnded(): void {
    this.playing.set(false);
    this.stopRafLoop();
  }

  private startRafLoop(): void {
    if (this.rafId !== null) return;
    const tick = () => {
      const a = this.activeAudio();
      if (a && !a.paused) {
        this.curSec.set(a.currentTime);
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopRafLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // ----- Scroll de burbujas --------------------------------------------------

  onUserScroll(): void {
    // Ignora el evento si fue disparado por nuestro propio scrollIntoView.
    if (Date.now() < this.autoScrollUntilMs) return;
    this.lastUserScrollMs = Date.now();
  }

  private scrollBubbleIntoViewIfNeeded(idx: number): void {
    const bubbleRefs = this.bubbles();
    const container = this.bubblesContainer()?.nativeElement;
    if (!container) return;
    if (idx < 0 || idx >= bubbleRefs.length) return;

    const el = bubbleRefs[idx].nativeElement;

    // Calculamos posición de la burbuja relativa al contenedor (no al viewport).
    // Si está fuera de la franja visible del contenedor, la centramos dentro.
    const cRect = container.getBoundingClientRect();
    const bRect = el.getBoundingClientRect();
    const margin = 40;

    const above = bRect.top < cRect.top + margin;
    const below = bRect.bottom > cRect.bottom - margin;
    if (!above && !below) return;

    // Marcamos ~700ms de ventana de "estoy haciendo auto-scroll" para que
    // el listener (scroll) de `onUserScroll` ignore los eventos que dispara
    // este mismo `scrollIntoView`. El smooth-scroll suele tardar 300-500ms.
    this.autoScrollUntilMs = Date.now() + 700;

    // scrollIntoView con block:'nearest' respeta contenedores con overflow
    // y no arrastra al documento padre. Más robusto que tocar scrollTop
    // a mano cuando el contenedor está anidado en layouts con transform/sticky.
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}