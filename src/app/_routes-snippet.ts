/**
 * Snippet para añadir a tu `src/app/app.routes.ts` existente.
 *
 * Añade estas entradas al array `routes` que ya tienes:
 */

export const EVENTS_ROUTES_SNIPPET = `
import { Routes } from '@angular/router';

export const routes: Routes = [
  // ... tus rutas existentes

  {
    path: 'admin/pipeline-health',
    loadComponent: () =>
      import('./features/pipeline-health/pipeline-health.component')
        .then(m => m.PipelineHealthComponent),
    title: 'Salud del pipeline',
  },

  // Si quieres que el timeline sea una ruta independiente (no embebido en detalle):
  // {
  //   path: 'calls/:id/events',
  //   loadComponent: () =>
  //     import('./shared/components/events-timeline/events-timeline.component')
  //       .then(m => m.EventsTimelineComponent),
  // },
];
`;

/**
 * Y en app.config.ts asegúrate de tener provideHttpClient():
 */
export const APP_CONFIG_SNIPPET = `
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    // ...
  ],
};
`;
