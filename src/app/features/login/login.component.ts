import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '../../shared/components/logo.component';
import { AuthService } from '../../core/services/auth.service';

interface NodeSeed {
  bx: number;
  by: number;
  size: number;
  type: 'hot' | 'warm' | 'cool';
  phase: number;
}

interface PositionedNode {
  x: number;
  y: number;
  size: number;
  type: 'hot' | 'warm' | 'cool';
  pulse: number;
}

interface Conn {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-stage" (click)="onStageClick($event)">
      <div class="login-stage__scaled" [style.transform]="'scale(' + fitScale() + ')'">
        <div style="width: 100%; height: 100%;">
          <div
            style="width: 100%; height: 100%;
                   background: linear-gradient(135deg, #0d1117 0%, #1a1410 100%);
                   color: #fff; display: flex;
                   font-family: 'Inter', -apple-system, sans-serif;
                   position: relative; overflow: hidden;"
          >
            <!-- Constelación de fondo -->
            <svg style="position: absolute; inset: 0; width: 100%; height: 100%;"
                 viewBox="0 0 100 100" preserveAspectRatio="none">
              @for (c of conns(); track $index) {
                <line
                  [attr.x1]="c.x1" [attr.y1]="c.y1" [attr.x2]="c.x2" [attr.y2]="c.y2"
                  stroke="#c9a961" stroke-width="0.05" [attr.opacity]="c.opacity"
                  vector-effect="non-scaling-stroke"
                />
              }
              @for (n of positioned(); track $index) {
                <g>
                  <circle
                    [attr.cx]="n.x" [attr.cy]="n.y"
                    [attr.r]="n.size * 0.15 * n.pulse"
                    [attr.fill]="colorFor(n.type)"
                    opacity="0.8"
                  />
                  <circle
                    [attr.cx]="n.x" [attr.cy]="n.y"
                    [attr.r]="n.size * 0.4 * n.pulse"
                    [attr.fill]="colorFor(n.type)"
                    opacity="0.15"
                  />
                </g>
              }
            </svg>

            <!-- Vignette -->
            <div style="position: absolute; inset: 0;
                        background: radial-gradient(ellipse at 70% 50%, transparent 0%, rgba(13,17,23,0.5) 70%, rgba(13,17,23,0.9) 100%);
                        pointer-events: none;"></div>

            <!-- Lado izquierdo -->
            <div style="flex: 1; padding: 40px 50px; position: relative;
                        display: flex; flex-direction: column; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <app-logo [color]="'#fff'" [size]="28" />
                <div style="display: flex; flex-direction: column; line-height: 1;">
                  <span style="font-size: 17px; font-weight: 700; color: #fff; letter-spacing: 1.5px; font-family: Georgia, serif;">YODEYMA</span>
                  <span style="font-size: 9px; color: rgba(255,255,255,0.6); letter-spacing: 2.5px; margin-top: 4px; font-weight: 500; text-transform: uppercase;">Centro de escucha</span>
                </div>
              </div>

              <div style="max-width: 460px;">
                <div style="font-size: 11px; color: #c9a961; letter-spacing: 4px; font-weight: 500; margin-bottom: 20px;">
                  ● MAPA DE CONVERSACIONES · HOY
                </div>
                <h1 style="font-size: 56px; font-weight: 200; line-height: 1.05;
                           margin: 0 0 20px; color: #fff;
                           font-family: Georgia, serif; letter-spacing: -1.5px;">
                  Conecta cada<br />conversación.
                </h1>
                <p style="font-size: 15px; color: rgba(255,255,255,0.65); line-height: 1.7;
                          margin: 0; max-width: 380px;">
                  Cada punto es una llamada. Cada línea, un patrón. La inteligencia emerge de la conexión.
                </p>
              </div>

              <div style="display: flex; gap: 32px;">
                <div>
                  <div style="font-size: 24px; font-weight: 200; color: #fff; font-feature-settings: 'tnum'; line-height: 1;">47</div>
                  <div style="font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 2px; margin-top: 4px;">EN CURSO</div>
                </div>
                <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                <div>
                  <div style="font-size: 24px; font-weight: 200; color: #e07856; font-feature-settings: 'tnum'; line-height: 1;">3</div>
                  <div style="font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 2px; margin-top: 4px;">RIESGO ALTO</div>
                </div>
                <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                <div>
                  <div style="font-size: 24px; font-weight: 200; color: #c9a961; font-feature-settings: 'tnum'; line-height: 1;">+12</div>
                  <div style="font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 2px; margin-top: 4px;">VS AYER</div>
                </div>
              </div>
            </div>

            <!-- Card central derecha -->
            <div style="width: 400px; margin: auto 60px auto 0;
                        background: rgba(13,17,23,0.7);
                        backdrop-filter: blur(24px);
                        border: 1px solid rgba(201,169,97,0.2);
                        padding: 40px 38px; border-radius: 8px;
                        position: relative; z-index: 2;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.4);">
              <div style="text-align: right; margin-bottom: 24px;">
                <!-- Status badge -->
                <div style="display: inline-flex; align-items: center; gap: 8px;
                            padding: 6px 11px; border-radius: 100px;
                            background: rgba(34,197,94,0.12);
                            border: 1px solid rgba(34,197,94,0.3);
                            font-size: 11px; color: #86efac; font-weight: 600;
                            letter-spacing: 0.3px;">
                  <span style="position: relative; width: 6px; height: 6px; border-radius: 50%; background: #22c55e;">
                    <span style="position: absolute; inset: -2px; border-radius: 50%; background: #22c55e;
                                 opacity: 0.4; animation: loginPulse 2s ease-in-out infinite;"></span>
                  </span>
                  Sistema operativo
                  <span style="color: rgba(255,255,255,0.4); font-weight: 400;">·</span>
                  <span style="color: rgba(255,255,255,0.6); font-weight: 400; font-feature-settings: 'tnum';">99.9%</span>
                </div>
              </div>

              <h2 style="font-size: 28px; font-weight: 300; color: #fff;
                         margin: 0 0 8px; font-family: Georgia, serif; letter-spacing: -0.5px;">
                Acceder
              </h2>
              <p style="font-size: 13px; color: rgba(255,255,255,0.55); margin: 0 0 28px;">
                Tu cuenta corporativa te lleva al panel.
              </p>

              <div style="display: flex; flex-direction: column; gap: 10px;">
                <button
                  type="button"
                  (click)="handleLogin()"
                  [disabled]="authenticating()"
                  style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px;
                         padding: 13px 18px; background: rgba(255,255,255,0.08);
                         border: 1px solid rgba(255,255,255,0.15); border-radius: 4px;
                         color: #fff; font-size: 14px; font-weight: 500; cursor: pointer;
                         transition: border-color 0.2s, transform 0.15s;
                         font-family: inherit;"
                  onmouseover="this.style.borderColor='#c9a961'; this.style.transform='translateY(-1px)';"
                  onmouseout="this.style.borderColor='rgba(255,255,255,0.15)'; this.style.transform='translateY(0)';"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <rect x="0" y="0" width="8" height="8" fill="#f25022" />
                    <rect x="10" y="0" width="8" height="8" fill="#7fba00" />
                    <rect x="0" y="10" width="8" height="8" fill="#00a4ef" />
                    <rect x="10" y="10" width="8" height="8" fill="#ffb900" />
                  </svg>
                  <span>Continuar con Microsoft</span>
                </button>
              </div>

              <div style="margin-top: 28px; padding-top: 20px;
                          border-top: 1px solid rgba(255,255,255,0.08);
                          font-size: 11px; color: rgba(255,255,255,0.45); line-height: 1.5;">
                ¿Problemas de acceso?
                <a href="#" style="color: #c9a961; text-decoration: none;" (click)="$event.preventDefault()">Contacta soporte →</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      @if (authenticating()) {
        <div style="position: absolute; inset: 0; background: rgba(13,17,23,0.6);
                    backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center;
                    flex-direction: column; gap: 18px; z-index: 2; color: #fff;
                    font-family: Inter, -apple-system, sans-serif;">
          <div style="width: 32px; height: 32px; border-radius: 50%;
                      border: 2px solid rgba(201,169,97,0.3); border-top-color: #c9a961;
                      animation: spin 0.8s linear infinite;"></div>
          <div style="font-size: 13px; letter-spacing: 2px; color: #c9a961; font-weight: 500;">
            AUTENTICANDO CON MICROSOFT…
          </div>
        </div>
      }
    </div>
  `,
})
export class LoginComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);

  readonly fitScale = signal<number>(1);
  readonly tick = signal<number>(0);
  readonly authenticating = this.auth.authenticating;

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private resizeHandler = () => this.fit();

  // Semilla estable de 40 nodos
  private readonly nodes: NodeSeed[] = Array.from({ length: 40 }, (_, i) => ({
    bx: 5 + ((i * 37) % 90),
    by: 5 + ((i * 71) % 90),
    size: 2 + (i % 4),
    type: i % 5 === 0 ? 'hot' : i % 7 === 0 ? 'warm' : 'cool',
    phase: i * 0.3,
  }));

  positioned = computed<PositionedNode[]>(() => {
    const t = this.tick() * 0.05;
    return this.nodes.map((n) => ({
      x: n.bx + Math.sin(t + n.phase) * 0.8,
      y: n.by + Math.cos(t * 1.3 + n.phase) * 0.6,
      size: n.size,
      type: n.type,
      pulse: 0.7 + Math.sin(t * 2 + n.phase) * 0.3,
    }));
  });

  conns = computed<Conn[]>(() => {
    const pts = this.positioned();
    const out: Conn[] = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i];
        const b = pts[j];
        const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (d < 18) {
          out.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, opacity: (1 - d / 18) * 0.4 });
        }
      }
    }
    return out;
  });

  ngOnInit(): void {
    this.fit();
    window.addEventListener('resize', this.resizeHandler);
    this.intervalId = setInterval(() => this.tick.update((v) => v + 1), 50);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    if (this.intervalId !== null) clearInterval(this.intervalId);
  }

  private fit(): void {
    const sx = window.innerWidth / 1280;
    const sy = window.innerHeight / 780;
    this.fitScale.set(Math.min(1, sx, sy));
  }

  colorFor(type: 'hot' | 'warm' | 'cool'): string {
    return type === 'hot' ? '#e07856' : type === 'warm' ? '#c9a961' : '#7a9eb8';
  }

  /** El stage original captura cualquier click en botón "microsoft"; aquí lo manejamos directo. */
  onStageClick(_e: MouseEvent): void {
    // El click en el botón ya llama handleLogin(); dejamos este handler vacío por compatibilidad.
  }

  handleLogin(): void {
    if (this.authenticating()) return;
    void this.auth.login();
  }
}
