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
}

export interface Supervisor {
  id: string;
  nombre: string;
  foto: string;
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
  foto: string;
  supervisorId: string;
  pais: string;
  rol: 'Senior' | 'Middle' | 'Junior';
  antiguedad: string;
  turno: string;
  nLlamadas: number;
  score: number;
  cx: number;
  delta: number;
  facturacion: number;
  tendencia: number[];
  dims: Dims;
  firmaEmocional: number[];
  resolucionMedia: string;
  topTemas: string[];
  idiomas: string[];
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
export interface AgenteInsights {
  fortalezas: AgenteFortaleza[];
  mejoras: AgenteFortaleza[];
  momentosBrillantes: AgenteMomentoBrillante[];
  patronesRiesgo: AgentePatronRiesgo[];
  coachingRecibido: AgenteCoaching[];
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
  detalleLlamada: DetalleLlamada;
}
