import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/services/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
      },
      {
        path: 'llamadas',
        loadComponent: () =>
          import('./features/llamadas/llamadas-page.component').then((m) => m.LlamadasPageComponent),
      },
      {
        path: 'llamadas/:id',
        loadComponent: () =>
          import('./features/call-detail/call-detail-page.component').then((m) => m.CallDetailPageComponent),
      },
      {
        path: 'supervisores',
        loadComponent: () =>
          import('./features/supervisores/pages/supervisores-global.component').then((m) => m.SupervisoresGlobalComponent),
      },
      {
        path: 'supervisores/:id',
        loadComponent: () =>
          import('./features/supervisores/pages/supervisor-detalle.component').then((m) => m.SupervisorDetalleComponent),
      },
      {
        path: 'agentes/:id',
        loadComponent: () =>
          import('./features/supervisores/pages/agente-perfil.component').then((m) => m.AgentePerfilComponent),
      },
      {
        path: 'admin/pipeline-health',
        loadComponent: () =>
            import('./features/pipeline-health/pipeline-health.component')
                .then(m => m.PipelineHealthComponent),
        title: 'Salud del pipeline',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
