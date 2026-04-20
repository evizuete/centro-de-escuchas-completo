// Tipos del dominio Centro de Escuchas

export type TipoCaso = 'Reclamación' | 'Incidencia' | 'Solicitud' | 'Sugerencia';

export interface TaxonomiaTipo {
  color: string;
  subs: string[];
}

export interface Catalogo {
  version: string;
  marcas: string[];
  categorias: string[];
  formatos: string[];
  cosmetica: string[];
  perfumeriaTotal: number;
  perfumeriaDestacados: string[];
}

export interface KpiLlamadas {
  value: number;
  delta: string;
  spark: number[];
}
export interface KpiDuracion { value: string; cola: string; }
export interface KpiScore { value: number; delta: number | string; }
export interface KpiFacturacion { value: string; delta: string; }
export interface KpiRiesgos { value: number; toReview: number; }

export interface DashboardKpis {
  llamadas: KpiLlamadas;
  duracionMedia: KpiDuracion;
  saludMedia: KpiScore;
  experienciaCliente: KpiScore;
  facturacion: KpiFacturacion;
  riesgosAltos: KpiRiesgos;
}

export interface SentimentSeg {
  label: string;
  value: number;
  color: string;
}

export interface TopTema {
  tema: string;
  pct: number;
  count: number;
}

export interface DistribucionSub {
  sub: string;
  n: number;
}

export interface DistribucionTipo {
  tipo: TipoCaso;
  pct: number;
  count: number;
  color: string;
  topSub: DistribucionSub[];
}

export interface Tendencias {
  score: number[];
  cx: number[];
  sentimiento: number[];
  volumen: number[];
}

export interface Alerta {
  nivel: 'ALTA' | 'MEDIA' | 'BAJA';
  tipo: string;
  texto: string;
  agente: string;
  hace: string;
}

export interface Dims {
  saludo: number;
  empatia: number;
  eficiencia: number;
  claridad: number;
  producto: number;
  cierre: number;
}

export interface AgenteCalidad {
  id: string;
  nombre: string;
  score: number;
  dims: Dims;
}

export interface Llamada {
  id: string;
  cliente: string;
  empresa: string;
  ciudad: string;
  categoria: string;
  tipo: TipoCaso;
  subcategoria: string;
  subcategoriaExtra?: string;
  marca: string;
  estado: 'A REVISAR' | 'EN REVISIÓN' | 'REVISADO' | 'NO APLICA';
  score: number;
  cx: number;
  agente: number;
  sentimiento: string;
  duracion: string;
  agenteId: string;
  facturacion: number;
  riesgos: number;
  fecha: string;
  resumen: string;
  no_leida: boolean;
  pinned: boolean;
  emoji_arc: number[];
}

export interface Producto {
  nombre: string;
  marca?: string;
  formato?: string;
  categoria?: string;
}

export interface HeatmapPunto {
  t: string;
  emocion: string;
  intensidad: number;
  evento: string;
}

export interface Momento {
  t: string;
  tipo: string;
  actor: 'Cliente' | 'Agente';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  texto: string;
}

export interface Transcripcion {
  actor: 'AGENTE' | 'CLIENTE';
  ini: string;
  fin: string;
  sentimiento: string;
  es: string;
  orig: string;
  ppm: number;
  hz: number;
  conf: number;
}

export interface CalidadDimsCall {
  saludo: number;
  empatia: number;
  eficiencia: number;
  claridad: number;
  conocimiento: number;
  cierre: number;
}

export interface CoachingHighlight {
  t: string;
  titulo: string;
  descripcion: string;
  tipo: 'positivo' | 'mejora';
}

export interface Recomendacion {
  nivel: 'ALTA' | 'MEDIA' | 'BAJA';
  tipo: string;
  titulo: string;
  detalle: string;
}

export interface AnalisisAudio {
  snr_agente_db: number | null;
  snr_cliente_db: number | null;
}
export interface AnalisisHabla {
  agente_pct: number | null;
  cliente_pct: number | null;
  silencio_pct: number | null;
  double_talk_pct: number | null;
}
export interface AnalisisTiempos {
  cola_s: number | null;
  espera_s: number | null;
  hold_count: number | null;
}
export interface AnalisisRiesgos {
  churn: number | null;
  complaint: number | null;
  escalation: number | null;
  count: number;
}
export interface AnalisisCall {
  audio: AnalisisAudio;
  habla: AnalisisHabla;
  tiempos: AnalisisTiempos;
  riesgos: AnalisisRiesgos;
}

export interface DetalleLlamada {
  id: string;
  cliente: string;
  empresa: string;
  ciudad: string;
  categoria: string;
  tipo: TipoCaso;
  subcategoria: string;
  marca: string;
  resumen: string;
  score: number;
  cx: number;
  complejidad: number;
  agente: number;
  interaccion: {
    canal: string;
    agente: string;
    inicio: string;
    duracion: string;
    espera: string;
  };
  productos: Producto[];
  sentimiento: string;
  tags: string[];
  incidencias: string[];
  heatmapLlamada: HeatmapPunto[];
  heatmapAgente: HeatmapPunto[];
  momentos: Momento[];
  transcripcion: Transcripcion[];
  calidadDims: CalidadDimsCall;
  observaciones: string[];
  coachingHighlights: CoachingHighlight[];
  recomendaciones: Recomendacion[];
  /**
   * Datos operativos/técnicos (SNR, distribución del habla, tiempos, riesgos).
   * Opcional: el backend lo marca `null` si aún no hay pipeline poblado.
   */
  analisis?: AnalisisCall | null;
}

export interface Supervisor {
  id: string;
  nombre: string;
  /**
   * URL del avatar. El backend puede devolverlo null (supervisors.avatar_url
   * es nullable), por eso es opcional. En UI usar fallback con iniciales.
   */
  foto?: string;
  pais: string;
  equipo: string;
  antiguedad: string;
  nLlamadas: number;
  nAgentes: number;
  scoreMedio: number;
  cxMedio: number;
  delta: number;
  tendencia: number[];
  especializacion: string;
  alertasAbiertas: number;
  coachingPendiente: number;
  cargaPct: number;
  dims: Dims;
  topTemas: { tema: string; pct: number }[];
}

export interface Agente {
  id: string;
  nombre: string;
  supervisorId: string;
  pais: string;
  nLlamadas: number;
  score: number;
  cx: number;
  delta: number;
  dims: Dims;

  // --- Opcionales: campos que el backend suministra cuando hay datos ------
  /** agents.avatar_url (nullable en BD). */
  foto?: string;
  /** Derivado de agents.joined_date. Texto tipo "3 años". */
  antiguedad?: string;
  /**
   * Derivado de joined_date (<2 Junior, 2-5 Middle, >5 Senior). Si no hay
   * fecha de alta el backend cae a agents.role (string libre), por eso
   * aquí el tipo es string y no un enum cerrado.
   */
  rol?: string;
  /** agents.languages (JSON array). */
  idiomas?: string[];
  /** SUM(calls.facturacion_eur) 30d. */
  facturacion?: number;
  /** agent_insights.tendencia_30d. Array de scores (0-100). */
  tendencia?: number[];
  /** Nombres de las categorías más frecuentes del agente en 30d. */
  topTemas?: string[];
  /** AVG(calls.duration_seconds) formateado "mm:ss". */
  resolucionMedia?: string;

  // --- Sin fuente en BD todavía (pendientes de decisión de producto) ------
  /** TODO: requiere master data de turnos (p.ej. tabla agent_shifts). */
  turno?: string;
  /** TODO: requiere job analítico sobre transcripciones. */
  firmaEmocional?: number[];
}

export interface AgenteFortaleza {
  titulo: string;
  metrica: string;
  ejemplos: number;
}
export interface AgenteMomentoBrillante {
  callId: string;
  titulo: string;
  descripcion: string;
  score: number;
}
export interface AgentePatronRiesgo {
  patron: string;
  detalle: string;
  severidad: 'ALTA' | 'MEDIA' | 'BAJA';
}
export interface AgenteCoaching {
  fecha: string;
  de: string;
  titulo: string;
  aplicado: boolean;
  mejora: string | null;
}
/**
 * Insights del agente para la página de perfil.
 *
 * Los campos `agenteId`, `fortalezas`, `coachingPendientes`, `tendencia`,
 * `topTemas` y `ranking` son los que actualmente devuelve el backend
 * (GET /api/agents/{id}/insights).
 *
 * Los campos `mejoras`, `momentosBrillantes`, `patronesRiesgo` y
 * `coachingRecibido` son los que el diseño UI pide pero **no tienen
 * fuente en BD todavía**. Los templates deben protegerlos con `@if` o
 * fallback a array vacío.
 */
export interface AgenteInsights {
  agenteId?: string;
  /**
   * En el backend actual es `string[]` (frases descriptivas).
   * TS lo deja flexible para soportar ambas formas mientras se cierra
   * el formato con producto.
   */
  fortalezas?: AgenteFortaleza[] | string[];
  coachingPendientes?: unknown[];
  tendencia?: number[];
  topTemas?: { tema: string; pct: number }[] | string[];
  ranking?: { equipo?: number; rol?: number; global?: number };

  // --- Pendientes de decisión de producto ---------------------------------
  /** TODO: formato pendiente — ¿es lo contrario de fortalezas? */
  mejoras?: AgenteFortaleza[];
  /** TODO: derivable de call_moments con criterio por definir. */
  momentosBrillantes?: AgenteMomentoBrillante[];
  /** TODO: posible uso de agent_insights.rasgos. */
  patronesRiesgo?: AgentePatronRiesgo[];
  /** TODO: requiere tabla nueva agent_coaching_sessions. */
  coachingRecibido?: AgenteCoaching[];
}

export interface DashboardData {
  kpis: DashboardKpis;
  sentiment: SentimentSeg[];
  topTemas: TopTema[];
  distribucionTipos: DistribucionTipo[];
  tendencias: Tendencias;
  heatmapEmocional: number[][];
  alertas: Alerta[];
  agentesCalidad: AgenteCalidad[];
  llamadas: Llamada[];
  /**
   * El endpoint /api/dashboard del backend devuelve siempre null aquí;
   * el detalle se obtiene por separado con /api/calls/{id}. El mock lo
   * sigue rellenando para no romper la ruta de detalle mientras se migra.
   */
  detalleLlamada: DetalleLlamada | null;
}
