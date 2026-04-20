import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  EventCountsBatch,
  EventsTimelineResponse,
  EventSummaryItem,
  LogEventItem,
  LogLevel,
} from '../models/events.models';

/**
 * Service para consumir los endpoints de eventos del backend.
 *
 * Endpoints cubiertos:
 *   GET /api/calls/{call_id}/events
 *   GET /api/events/recent
 *   GET /api/events/summary
 *   POST /api/events/counts-by-call  (batch)
 */
@Injectable({ providedIn: 'root' })
export class EventsApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  /** Timeline completa de una llamada. */
  getCallEvents(
    callId: string,
    opts: { level?: LogLevel; eventType?: string; limit?: number } = {},
  ): Observable<EventsTimelineResponse> {
    let params = new HttpParams();
    if (opts.level) params = params.set('level', opts.level);
    if (opts.eventType) params = params.set('event_type', opts.eventType);
    if (opts.limit) params = params.set('limit', String(opts.limit));

    return this.http.get<EventsTimelineResponse>(
      `${this.base}/api/calls/${encodeURIComponent(callId)}/events`,
      { params },
    );
  }

  /** Eventos recientes cross-llamadas. */
  getRecentEvents(opts: {
    level?: LogLevel;
    eventType?: string;
    phase?: string;
    hours?: number;
    limit?: number;
  } = {}): Observable<LogEventItem[]> {
    let params = new HttpParams();
    if (opts.level) params = params.set('level', opts.level);
    if (opts.eventType) params = params.set('event_type', opts.eventType);
    if (opts.phase) params = params.set('phase', opts.phase);
    if (opts.hours) params = params.set('hours', String(opts.hours));
    if (opts.limit) params = params.set('limit', String(opts.limit));

    return this.http.get<LogEventItem[]>(`${this.base}/api/events/recent`, {
      params,
    });
  }

  /** Agregado por (event_type, level, phase). */
  getSummary(opts: { hours?: number; level?: LogLevel } = {}): Observable<
    EventSummaryItem[]
  > {
    let params = new HttpParams();
    if (opts.hours) params = params.set('hours', String(opts.hours));
    if (opts.level) params = params.set('level', opts.level);

    return this.http.get<EventSummaryItem[]>(
      `${this.base}/api/events/summary`,
      { params },
    );
  }

  /**
   * Batch: counts por llamada para un conjunto de call_ids.
   * Usado por la lista de llamadas para pintar el badge en cada fila
   * sin hacer N requests.
   */
  getCountsByCall(callIds: string[]): Observable<EventCountsBatch> {
    return this.http.post<EventCountsBatch>(
      `${this.base}/api/events/counts-by-call`,
      { call_ids: callIds },
    );
  }

  // ---------------------------------------------------------------------------
  // Export CSV — Excel-ES (separador ;, BOM UTF-8)
  // El backend devuelve el CSV con Content-Disposition: attachment. En vez de
  // abrir una nueva pestaña usamos el patrón blob + anchor para que el filename
  // sugerido por el servidor se respete en el navegador.
  // ---------------------------------------------------------------------------

  /** Exporta el summary agregado. */
  exportSummaryCsv(opts: { hours?: number; level?: LogLevel } = {}): void {
    let params = new HttpParams();
    if (opts.hours) params = params.set('hours', String(opts.hours));
    if (opts.level) params = params.set('level', opts.level);
    this.downloadCsv(`${this.base}/api/events/summary.csv`, params);
  }

  /** Exporta eventos recientes filtrables. */
  exportRecentCsv(opts: {
    level?: LogLevel;
    eventType?: string;
    phase?: string;
    hours?: number;
    limit?: number;
  } = {}): void {
    let params = new HttpParams();
    if (opts.level) params = params.set('level', opts.level);
    if (opts.eventType) params = params.set('event_type', opts.eventType);
    if (opts.phase) params = params.set('phase', opts.phase);
    if (opts.hours) params = params.set('hours', String(opts.hours));
    if (opts.limit) params = params.set('limit', String(opts.limit));
    this.downloadCsv(`${this.base}/api/events/recent.csv`, params);
  }

  /** Exporta la timeline de una llamada. */
  exportCallTimelineCsv(
    callId: string,
    opts: { level?: LogLevel; eventType?: string } = {},
  ): void {
    let params = new HttpParams();
    if (opts.level) params = params.set('level', opts.level);
    if (opts.eventType) params = params.set('event_type', opts.eventType);
    this.downloadCsv(
      `${this.base}/api/calls/${encodeURIComponent(callId)}/events.csv`,
      params,
    );
  }

  /** Dispara descarga de un CSV respetando el filename del servidor. */
  private downloadCsv(url: string, params: HttpParams): void {
    this.http
      .get(url, {
        params,
        responseType: 'blob',
        observe: 'response',
      })
      .subscribe({
        next: (res) => {
          const blob = res.body;
          if (!blob) return;

          // Extraer filename del Content-Disposition
          const disp = res.headers.get('Content-Disposition') || '';
          const match = /filename="?([^";]+)"?/i.exec(disp);
          const filename = match ? match[1] : 'export.csv';

          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        },
        error: (err) => {
          console.error('Error descargando CSV:', err);
        },
      });
  }
}
