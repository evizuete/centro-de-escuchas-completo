import { Injectable, signal } from '@angular/core';
import {
  Agente, AgenteInsights, DashboardData, DetalleLlamada, Llamada, Supervisor, TaxonomiaTipo, TipoCaso,
} from '../models/domain.models';
import { MOCK_DASHBOARD } from './dashboard.data';
import { AGENTES, AGENTE_INSIGHTS, SUPERVISORES } from './supervisores.data';
import { CATALOGO, TAXONOMIA_CASOS } from './taxonomia.data';

@Injectable({ providedIn: 'root' })
export class DataService {
  // Datos estáticos expuestos como signals de solo lectura
  readonly dashboard = signal<DashboardData>(MOCK_DASHBOARD);
  readonly supervisores = signal<Supervisor[]>(SUPERVISORES);
  readonly agentes = signal<Agente[]>(AGENTES);

  readonly taxonomia = TAXONOMIA_CASOS;
  readonly catalogo = CATALOGO;

  // Helpers
  getLlamadas(): Llamada[] {
    return this.dashboard().llamadas;
  }

  getLlamada(id: string): Llamada | undefined {
    return this.dashboard().llamadas.find((l) => l.id === id);
  }

  getDetalleLlamada(_id: string): DetalleLlamada {
    // En mock solo hay un detalle completo. Se devuelve independientemente del id.
    return this.dashboard().detalleLlamada;
  }

  getSupervisor(id: string): Supervisor | undefined {
    return SUPERVISORES.find((s) => s.id === id);
  }

  getAgente(id: string): Agente | undefined {
    return AGENTES.find((a) => a.id === id);
  }

  getAgentesDeSupervisor(supervisorId: string): Agente[] {
    return AGENTES.filter((a) => a.supervisorId === supervisorId);
  }

  getAgenteInsights(id: string): AgenteInsights {
    return AGENTE_INSIGHTS[id] ?? AGENTE_INSIGHTS['default'];
  }

  getTipoColor(tipo: TipoCaso | string): string {
    return (this.taxonomia as Record<string, TaxonomiaTipo>)[tipo]?.color ?? '#64748b';
  }
}
