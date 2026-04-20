# Centro de Escuchas — Yodeyma (Angular 19)

Implementación completa en Angular 19 del diseño del **Centro de Escucha de Yodeyma**: login simulado SSO Microsoft, dashboard con KPIs y visualizaciones, gestión de llamadas con 3 vistas y búsqueda semántica, detalle de llamada con 8 tabs (transcripción con waveform triple, momentos emocionales, coaching, calidad, análisis, recomendaciones y notas), y módulo de supervisores a 3 niveles (global, detalle de supervisor, perfil de agente con 4 sub-tabs).

## Stack

- **Angular 19** — standalone components, signals, nuevo control flow `@if / @for / @switch`, `input()` / `output()` / `computed()`
- **TypeScript strict** + `strictTemplates`
- **SCSS global** con la variante *Clean* del diseño portada fielmente
- **Sin dependencias de UI externas** — todas las visualizaciones (donut, radar, sparkline, heatmap, arco emocional, waveform de 3 estilos, gráfico emocional) se dibujan en SVG inline

## Puesta en marcha

```bash
npm install
npm start
```

La app arranca en http://localhost:4200. Redirige a `/login`; al pulsar "Continuar con Microsoft" simula el flujo OAuth (spinner de 900 ms) y entra al dashboard.

## Rutas

| Ruta | Guard | Componente |
|------|-------|-----------|
| `/login` | loginGuard | LoginComponent |
| `/dashboard` | authGuard | DashboardPageComponent |
| `/llamadas` | authGuard | LlamadasPageComponent |
| `/llamadas/:id` | authGuard | CallDetailPageComponent |
| `/supervisores` | authGuard | SupervisoresGlobalComponent |
| `/supervisores/:id` | authGuard | SupervisorDetalleComponent |
| `/agentes/:id` | authGuard | AgentePerfilComponent |

## Estructura

```
src/app/
├── app.component.ts          # raíz con router-outlet
├── app.config.ts             # providers (router + zone)
├── app.routes.ts             # rutas + guards + lazy loading
│
├── core/
│   ├── models/domain.models.ts   # tipos del dominio
│   └── services/
│       ├── auth.service.ts            # login simulado (sessionStorage)
│       ├── auth.guard.ts              # authGuard + loginGuard
│       ├── data.service.ts            # punto único de acceso a mocks
│       ├── dashboard.data.ts          # mock de KPIs, llamadas, detalle
│       ├── supervisores.data.ts       # 5 supervisores + 16 agentes + insights
│       ├── taxonomia.data.ts          # taxonomía CRM + catálogo Yodeyma
│       └── style.utils.ts             # scoreColor, tToSec, fmtSec
│
├── shared/components/          # 9 componentes reutilizables
│   ├── icon.component.ts        # 32 íconos SVG
│   ├── logo.component.ts        # frasco Yodeyma
│   ├── score-badge.component.ts # pill circular con color por rango
│   ├── sparkline.component.ts   # mini gráfico tendencia
│   ├── donut.component.ts       # donut de sentimiento
│   ├── radar.component.ts       # radar con overlay dashed
│   ├── bar.component.ts         # barra horizontal
│   ├── emotion-arc.component.ts # arco emocional mini
│   └── tag.component.ts         # pill con 7 variantes
│
├── layout/
│   ├── main-layout.component.ts # shell (sidebar + router-outlet)
│   └── sidebar/sidebar.component.ts
│
└── features/
    ├── login/login.component.ts              # Constellation con 40 nodos animados
    │
    ├── dashboard/
    │   ├── dashboard-page.component.ts       # 6 KPIs + 3 filas de cards
    │   └── components/
    │       ├── kpi-card.component.ts
    │       ├── trend-chart.component.ts      # 4 semanas, 3 series
    │       ├── heatmap.component.ts          # Día×hora, 3 vistas
    │       ├── quality-radar.component.ts    # Radar + tabla comparativa
    │       └── call-quick-row.component.ts
    │
    ├── llamadas/
    │   ├── llamadas-page.component.ts        # 3 vistas + búsqueda semántica
    │   └── components/
    │       ├── tipo-tag.component.ts         # pill CRM por taxonomía
    │       ├── estado-tag.component.ts
    │       ├── mini-kpi.component.ts
    │       ├── inbox-row.component.ts
    │       ├── inbox-preview.component.ts
    │       └── call-card.component.ts
    │
    ├── call-detail/
    │   ├── call-detail-page.component.ts     # Orquestador + 8 tabs
    │   └── tabs/
    │       ├── tab-resumen.component.ts
    │       ├── tab-transcripcion.component.ts # waveform triple + pins
    │       ├── tab-momentos.component.ts      # gráfico emocional cliente vs agente
    │       ├── tab-coaching.component.ts      # selección múltiple
    │       ├── tab-calidad.component.ts
    │       ├── tab-analisis.component.ts
    │       ├── tab-recomendaciones.component.ts
    │       └── tab-notas.component.ts
    │
    └── supervisores/pages/
        ├── supervisores-global.component.ts  # Ranking + heatmap org + top/bottom
        ├── supervisor-detalle.component.ts   # Nivel 2: detalle de supervisor
        └── agente-perfil.component.ts        # Nivel 3: 4 sub-tabs
```

## Qué se verifica al ejecutar el proyecto

### Login
- Fondo negro con constelación de 40 nodos animados y conexiones dinámicas entre los cercanos.
- Panel izquierdo con título serif gigante "Conecta cada conversación." y KPIs "47 / 3 / +12".
- Card derecha con status badge pulsante y botón SSO de Microsoft.
- Al pulsarlo aparece overlay "AUTENTICANDO CON MICROSOFT…" con spinner dorado durante 900 ms.

### Dashboard
- 6 KPI cards (Llamadas / Duración / Valoración / Experiencia / Facturación / Riesgos) con la estructura 3-filas del diseño.
- Tendencias 4 semanas con 3 series (Score / Exp. cliente / Sentimiento).
- Donut de sentimiento con leyenda y porcentajes.
- Distribución por tipo CRM con barras y sub-chips coloreados por taxonomía.
- Heatmap emocional 7×12 con 3 vistas conmutables.
- QualityRadar con selector de agente, overlay del promedio y tabla comparativa.
- Lista de llamadas que requieren atención (click → detalle).
- Panel de alertas con niveles ALTA / MEDIA.

### Llamadas
- 7 mini-KPIs slim (Hoy, Valoración, Experiencia, Duración, Reclamaciones, Incidencias, Devoluciones).
- Filtros: tipo CRM (con colores de taxonomía), estado, agente, sentimiento, país, marca, rango de fechas.
- Búsqueda con toggle semántico que muestra 5 chips de sugerencias.
- 3 vistas conmutables: **Inbox** (lista + preview sticky), **Cards** (grid 3 col con ribbon de estado), **Table** (tabla densa).

### Detalle de llamada
Topbar con ID y botón "Contactar agente". Header con 4 score badges grandes (Valoración / Experiencia / Complejidad / Calidad Agente). 8 tabs navegables:

1. **Resumen** — ejecutivo + aside con interacción, clasificación, productos, incidencias, sentimiento y link al agente.
2. **Transcripción** — reproductor con waveform de 3 estilos (bars / dual / blocks), pins de momentos con tooltip, playhead, selector ES/ORI, selector Original/Traducida, burbujas sincronizadas.
3. **Momentos** — gráfico emocional cliente vs agente con overlay, insight automático, listado con intensidad dual.
4. **Coaching** — selección múltiple de highlights con panel de envío.
5. **Calidad agente** — dimensiones + observaciones.
6. **Análisis** — SNR, distribución del habla, tiempos operativos, riesgos, insights comerciales.
7. **Recomendaciones** — lista con niveles.
8. **Notas** — historial + área de nueva nota.

### Supervisores (3 niveles)
- **Global** — 4 KPIs, ranking ordenable con sparklines, mapa de fortalezas 5×6 con escala Excelente/Crítico, Top 5 y Bottom 5 de agentes.
- **Supervisor** — header con foto + resumen IA + 4 métricas, ranking del equipo ordenable, radar vs benchmark, evolución 12 semanas, top temas, coaching pendiente y alertas del equipo.
- **Agente** — header rico con CV de rasgos (Estilo, Especialidad, Fortaleza top, Consistencia), ranking en 3 contextos, 5 KPIs y 4 sub-tabs:
  - Resumen (radar + evolución + temas que domina)
  - Fortalezas (fortalezas / mejoras / momentos brillantes / patrones de riesgo)
  - Coaching (historial timeline + sugerencias IA + progreso)
  - Equipo (posición en su equipo + agentes similares por rol)

## Notas técnicas

- Todos los componentes usan `ChangeDetectionStrategy.OnPush`.
- Estado reactivo con `signal()` / `computed()` — no hay `BehaviorSubject` ni stores.
- Inputs de componente tipados con `input.required<T>()` / `input<T>()`.
- `withComponentInputBinding()` en el router → los parámetros de ruta (`:id`) llegan como `input()` directamente.
- Navegación cruzada: el perfil de agente detecta `queryParams.from=call` para mostrar botón "Volver a la llamada" en lugar del breadcrumb normal.
- Lazy loading de todas las rutas (`loadComponent`).
