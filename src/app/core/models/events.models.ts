/**
 * Tipos TypeScript paralelos a los modelos del backend (pipeline_log).
 *
 * El backend devuelve los eventos desde /api/calls/{id}/events y similares.
 * Mantener esta interfaz sincronizada con `LogEventItem` en
 * backend/app/routers/events.py.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEventItem {
  id: number;
  call_id: string;
  ts: string;                  // ISO datetime
  level: LogLevel;
  phase: string | null;
  event_type: string;
  message: string | null;
  data: Record<string, any> | null;
  duration_ms: number | null;
}

export interface EventsTimelineResponse {
  call_id: string;
  events: LogEventItem[];
  total: number;
  counts_by_level: Partial<Record<LogLevel, number>>;
}

export interface EventSummaryItem {
  event_type: string;
  level: LogLevel;
  phase: string | null;
  count: number;
  last_seen: string;           // ISO datetime
}

/** Respuesta del endpoint batch nuevo /api/events/counts-by-call */
export interface EventCountsBatch {
  [callId: string]: Partial<Record<LogLevel, number>>;
}

/** Descripciones humanas para event_types más comunes, para tooltips
 *  y mensajes en la UI. Añadir aquí cuando añadas nuevos eventos al
 *  backend/pipeline/persistence/event_types.py. */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  // Fase 2
  asr_transcription_started: 'Transcripción iniciada',
  asr_transcription_completed: 'Transcripción completada',
  asr_language_detected: 'Idioma detectado',
  asr_low_confidence: 'Transcripción de baja confianza',

  // LLM
  llm_call_completed: 'Llamada LLM completada',
  llm_json_parse_error: 'Error parseando JSON del LLM',
  llm_json_parse_recovered: 'JSON recuperado tras fixes',
  llm_truncated_response: 'Respuesta LLM truncada',

  // Fase 5
  moments_identified: 'Momentos identificados',

  // Síntesis
  voice_sample_insufficient: 'Muestra de voz insuficiente',
  voice_cloned: 'Voz clonada',
  voice_clone_cached: 'Voz reutilizada de caché',
  voice_generic_fallback: 'Usando voz genérica',
  dialogue_chunk_created: 'Chunk de diálogo creado',
  dialogue_chunk_failed: 'Chunk de diálogo falló',
  dialogue_voice_segments_missing: 'Sin separación de canales en chunk',
  dialogue_hard_cut: 'Corte duro sin silencio natural',
  tts_tag_applied: 'Tag de audio aplicado',
  tts_tag_blocked: 'Tag de audio bloqueado',
  tts_tag_summary: 'Resumen de tags de audio',
  audio_generated: 'Audio generado',
  audio_skipped: 'Síntesis saltada',

  // Pipeline
  call_started: 'Llamada iniciada',
  call_completed: 'Llamada completada',
  call_failed: 'Error en llamada',
  phase_completed: 'Fase completada',
};

/** Devuelve una etiqueta humana para un event_type. */
export function eventTypeLabel(eventType: string): string {
  return EVENT_TYPE_LABELS[eventType] || eventType;
}

/** Devuelve las clases Tailwind para colorear según level. */
export function levelClasses(level: LogLevel): {
  dot: string;
  bg: string;
  border: string;
  text: string;
  badge: string;
} {
  switch (level) {
    case 'ERROR':
      return {
        dot: 'bg-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        badge: 'bg-red-100 text-red-800',
      };
    case 'WARN':
      return {
        dot: 'bg-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        badge: 'bg-amber-100 text-amber-800',
      };
    case 'INFO':
      return {
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        badge: 'bg-emerald-100 text-emerald-800',
      };
    default:
      return {
        dot: 'bg-slate-400',
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-700',
        badge: 'bg-slate-100 text-slate-700',
      };
  }
}
