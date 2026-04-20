import { Agente, AgenteInsights, Supervisor } from '../models/domain.models';

// Genera evolución 12 semanas alrededor de una base
const genEvol = (base: number, range = 8): number[] =>
  Array.from({ length: 12 }, (_, i) =>
    Math.round(base + Math.sin(i * 0.7) * range * 0.6 + (Math.random() - 0.5) * range)
  );

const arcPreset = {
  bajaTension: [70, 58, 45, 40, 55, 70, 82, 88],
  acompana: [55, 60, 68, 70, 72, 75, 78, 82],
  plana: [70, 72, 70, 73, 72, 74, 73, 72],
  tensa: [60, 55, 48, 40, 35, 42, 55, 65],
};

export const SUPERVISORES: Supervisor[] = [
  {
    id: 'sup_aurelia', nombre: 'Aurelia Romano', foto: 'https://i.pravatar.cc/160?img=47',
    pais: 'Italia', equipo: 'Equipo Italia · Norte', antiguedad: '6 años',
    nLlamadas: 1247, nAgentes: 5, scoreMedio: 86, cxMedio: 88, delta: 4,
    tendencia: genEvol(86, 6),
    especializacion: 'Perfumería premium · Cuentas VIP',
    alertasAbiertas: 1, coachingPendiente: 3, cargaPct: 24,
    dims: { saludo: 92, empatia: 88, eficiencia: 84, claridad: 87, producto: 91, cierre: 85 },
    topTemas: [
      { tema: 'Pedidos nuevos', pct: 38 },
      { tema: 'Info producto', pct: 24 },
      { tema: 'Recurrentes', pct: 20 },
      { tema: 'Reclamaciones', pct: 12 },
      { tema: 'Otros', pct: 6 },
    ],
  },
  {
    id: 'sup_martina', nombre: 'Martina Conti', foto: 'https://i.pravatar.cc/160?img=45',
    pais: 'Italia', equipo: 'Equipo Italia · Sur', antiguedad: '4 años',
    nLlamadas: 1102, nAgentes: 3, scoreMedio: 79, cxMedio: 82, delta: 2,
    tendencia: genEvol(79, 7),
    especializacion: 'Post-venta · Reclamaciones',
    alertasAbiertas: 2, coachingPendiente: 5, cargaPct: 21,
    dims: { saludo: 84, empatia: 82, eficiencia: 78, claridad: 80, producto: 77, cierre: 76 },
    topTemas: [
      { tema: 'Reclamaciones', pct: 34 },
      { tema: 'Devoluciones', pct: 26 },
      { tema: 'Seguimiento', pct: 18 },
      { tema: 'Info producto', pct: 14 },
      { tema: 'Otros', pct: 8 },
    ],
  },
  {
    id: 'sup_javier', nombre: 'Javier Morales', foto: 'https://i.pravatar.cc/160?img=33',
    pais: 'España', equipo: 'Equipo España', antiguedad: '8 años',
    nLlamadas: 1389, nAgentes: 3, scoreMedio: 82, cxMedio: 80, delta: -1,
    tendencia: genEvol(82, 5),
    especializacion: 'Cosmética · Farmacias',
    alertasAbiertas: 3, coachingPendiente: 2, cargaPct: 26,
    dims: { saludo: 86, empatia: 78, eficiencia: 88, claridad: 82, producto: 80, cierre: 78 },
    topTemas: [
      { tema: 'Pedidos nuevos', pct: 30 },
      { tema: 'Info producto', pct: 26 },
      { tema: 'Reclamaciones', pct: 20 },
      { tema: 'Devoluciones', pct: 14 },
      { tema: 'Otros', pct: 10 },
    ],
  },
  {
    id: 'sup_elena', nombre: 'Elena Rodríguez', foto: 'https://i.pravatar.cc/160?img=5',
    pais: 'España', equipo: 'Equipo España · Prestige', antiguedad: '3 años',
    nLlamadas: 824, nAgentes: 2, scoreMedio: 88, cxMedio: 91, delta: 7,
    tendencia: genEvol(88, 4),
    especializacion: 'Clientes VIP · Upselling',
    alertasAbiertas: 0, coachingPendiente: 1, cargaPct: 16,
    dims: { saludo: 94, empatia: 92, eficiencia: 84, claridad: 90, producto: 88, cierre: 92 },
    topTemas: [
      { tema: 'Pedidos nuevos', pct: 42 },
      { tema: 'Recurrentes', pct: 28 },
      { tema: 'Info producto', pct: 16 },
      { tema: 'Reclamaciones', pct: 8 },
      { tema: 'Otros', pct: 6 },
    ],
  },
  {
    id: 'sup_radu', nombre: 'Radu Popescu', foto: 'https://i.pravatar.cc/160?img=68',
    pais: 'Rumanía', equipo: 'Equipo Rumanía', antiguedad: '5 años',
    nLlamadas: 678, nAgentes: 3, scoreMedio: 71, cxMedio: 72, delta: -3,
    tendencia: genEvol(71, 10),
    especializacion: 'Prospección · Mercado emergente',
    alertasAbiertas: 4, coachingPendiente: 7, cargaPct: 13,
    dims: { saludo: 76, empatia: 68, eficiencia: 74, claridad: 70, producto: 68, cierre: 72 },
    topTemas: [
      { tema: 'Prospección', pct: 36 },
      { tema: 'Seguimiento', pct: 24 },
      { tema: 'Info producto', pct: 18 },
      { tema: 'Reclamaciones', pct: 14 },
      { tema: 'Otros', pct: 8 },
    ],
  },
];

export const AGENTES: Agente[] = [
  { id: 'cc_ita4', nombre: 'Giuliana Esposito', foto: 'https://i.pravatar.cc/160?img=49', supervisorId: 'sup_aurelia', pais: 'Italia', rol: 'Senior', antiguedad: '5 años', turno: 'Mañana', nLlamadas: 187, score: 95, cx: 96, delta: 3, facturacion: 14820, tendencia: genEvol(95, 3), dims: { saludo: 96, empatia: 92, eficiencia: 95, claridad: 93, producto: 96, cierre: 97 }, firmaEmocional: arcPreset.acompana, resolucionMedia: '7:28', topTemas: ['Pedidos nuevos', 'Info producto', 'Recurrentes'], idiomas: ['IT', 'ES', 'EN'] },
  { id: 'cc_ita2', nombre: 'Stefano Moretti', foto: 'https://i.pravatar.cc/160?img=52', supervisorId: 'sup_aurelia', pais: 'Italia', rol: 'Senior', antiguedad: '4 años', turno: 'Tarde', nLlamadas: 164, score: 87, cx: 89, delta: 2, facturacion: 11240, tendencia: genEvol(87, 5), dims: { saludo: 90, empatia: 85, eficiencia: 88, claridad: 86, producto: 92, cierre: 84 }, firmaEmocional: arcPreset.plana, resolucionMedia: '8:42', topTemas: ['Info producto', 'Pedidos nuevos'], idiomas: ['IT', 'EN'] },
  { id: 'cc_ita14', nombre: 'Valentina Ricci', foto: 'https://i.pravatar.cc/160?img=44', supervisorId: 'sup_aurelia', pais: 'Italia', rol: 'Junior', antiguedad: '1 año', turno: 'Mañana', nLlamadas: 124, score: 68, cx: 72, delta: -4, facturacion: 6820, tendencia: genEvol(68, 8), dims: { saludo: 74, empatia: 62, eficiencia: 70, claridad: 68, producto: 66, cierre: 70 }, firmaEmocional: arcPreset.tensa, resolucionMedia: '11:20', topTemas: ['Reclamaciones', 'Devoluciones'], idiomas: ['IT'] },
  { id: 'cc_ita7', nombre: 'Luca Ferretti', foto: 'https://i.pravatar.cc/160?img=60', supervisorId: 'sup_aurelia', pais: 'Italia', rol: 'Middle', antiguedad: '2 años', turno: 'Tarde', nLlamadas: 143, score: 84, cx: 86, delta: 5, facturacion: 9880, tendencia: genEvol(84, 5), dims: { saludo: 88, empatia: 84, eficiencia: 82, claridad: 86, producto: 84, cierre: 80 }, firmaEmocional: arcPreset.bajaTension, resolucionMedia: '8:10', topTemas: ['Reclamaciones', 'Info producto'], idiomas: ['IT', 'EN'] },
  { id: 'cc_ita11', nombre: 'Chiara Fontana', foto: 'https://i.pravatar.cc/160?img=20', supervisorId: 'sup_aurelia', pais: 'Italia', rol: 'Middle', antiguedad: '2 años', turno: 'Mañana', nLlamadas: 138, score: 82, cx: 84, delta: 1, facturacion: 9420, tendencia: genEvol(82, 6), dims: { saludo: 86, empatia: 88, eficiencia: 78, claridad: 82, producto: 80, cierre: 78 }, firmaEmocional: arcPreset.acompana, resolucionMedia: '9:14', topTemas: ['Recurrentes', 'Pedidos nuevos'], idiomas: ['IT', 'EN', 'FR'] },

  { id: 'cc_ita5', nombre: 'Francesca Lombardi', foto: 'https://i.pravatar.cc/160?img=41', supervisorId: 'sup_martina', pais: 'Italia', rol: 'Senior', antiguedad: '3 años', turno: 'Mañana', nLlamadas: 172, score: 85, cx: 88, delta: 3, facturacion: 10640, tendencia: genEvol(85, 4), dims: { saludo: 88, empatia: 90, eficiencia: 82, claridad: 84, producto: 82, cierre: 84 }, firmaEmocional: arcPreset.bajaTension, resolucionMedia: '8:34', topTemas: ['Reclamaciones', 'Devoluciones'], idiomas: ['IT', 'EN'] },
  { id: 'cc_ita8', nombre: 'Alessandro Greco', foto: 'https://i.pravatar.cc/160?img=11', supervisorId: 'sup_martina', pais: 'Italia', rol: 'Middle', antiguedad: '2 años', turno: 'Tarde', nLlamadas: 156, score: 76, cx: 80, delta: 0, facturacion: 8120, tendencia: genEvol(76, 6), dims: { saludo: 80, empatia: 78, eficiencia: 74, claridad: 76, producto: 72, cierre: 74 }, firmaEmocional: arcPreset.plana, resolucionMedia: '10:22', topTemas: ['Devoluciones', 'Seguimiento'], idiomas: ['IT'] },
  { id: 'cc_ita10', nombre: 'Giulia Marino', foto: 'https://i.pravatar.cc/160?img=32', supervisorId: 'sup_martina', pais: 'Italia', rol: 'Junior', antiguedad: '10 meses', turno: 'Mañana', nLlamadas: 98, score: 72, cx: 76, delta: 4, facturacion: 5240, tendencia: genEvol(72, 7), dims: { saludo: 78, empatia: 76, eficiencia: 68, claridad: 72, producto: 68, cierre: 70 }, firmaEmocional: arcPreset.acompana, resolucionMedia: '11:50', topTemas: ['Devoluciones', 'Info producto'], idiomas: ['IT', 'EN'] },

  { id: 'cc_esp2', nombre: 'Carlos Navarro', foto: 'https://i.pravatar.cc/160?img=13', supervisorId: 'sup_javier', pais: 'España', rol: 'Senior', antiguedad: '6 años', turno: 'Mañana', nLlamadas: 196, score: 78, cx: 80, delta: -2, facturacion: 9460, tendencia: genEvol(78, 8), dims: { saludo: 82, empatia: 75, eficiencia: 80, claridad: 78, producto: 74, cierre: 79 }, firmaEmocional: arcPreset.plana, resolucionMedia: '9:28', topTemas: ['Devoluciones', 'Info producto'], idiomas: ['ES', 'EN'] },
  { id: 'cc_esp1', nombre: 'María Herrera', foto: 'https://i.pravatar.cc/160?img=9', supervisorId: 'sup_javier', pais: 'España', rol: 'Middle', antiguedad: '3 años', turno: 'Tarde', nLlamadas: 168, score: 83, cx: 82, delta: 2, facturacion: 10120, tendencia: genEvol(83, 5), dims: { saludo: 86, empatia: 82, eficiencia: 84, claridad: 82, producto: 80, cierre: 82 }, firmaEmocional: arcPreset.acompana, resolucionMedia: '8:52', topTemas: ['Pedidos nuevos', 'Info producto'], idiomas: ['ES', 'EN', 'FR'] },
  { id: 'cc_esp4', nombre: 'David Ortiz', foto: 'https://i.pravatar.cc/160?img=14', supervisorId: 'sup_javier', pais: 'España', rol: 'Junior', antiguedad: '1 año', turno: 'Mañana', nLlamadas: 142, score: 74, cx: 72, delta: 6, facturacion: 6840, tendencia: genEvol(74, 9), dims: { saludo: 80, empatia: 68, eficiencia: 78, claridad: 74, producto: 72, cierre: 70 }, firmaEmocional: arcPreset.acompana, resolucionMedia: '10:12', topTemas: ['Pedidos nuevos', 'Reclamaciones'], idiomas: ['ES'] },

  { id: 'cc_esp7', nombre: 'Laura Sánchez', foto: 'https://i.pravatar.cc/160?img=16', supervisorId: 'sup_elena', pais: 'España', rol: 'Senior', antiguedad: '4 años', turno: 'Mañana', nLlamadas: 178, score: 91, cx: 94, delta: 5, facturacion: 13840, tendencia: genEvol(91, 3), dims: { saludo: 94, empatia: 92, eficiencia: 88, claridad: 92, producto: 90, cierre: 92 }, firmaEmocional: arcPreset.bajaTension, resolucionMedia: '7:48', topTemas: ['Pedidos nuevos', 'Recurrentes'], idiomas: ['ES', 'EN', 'IT'] },
  { id: 'cc_esp5', nombre: 'Ignacio Ramos', foto: 'https://i.pravatar.cc/160?img=59', supervisorId: 'sup_elena', pais: 'España', rol: 'Middle', antiguedad: '2 años', turno: 'Tarde', nLlamadas: 134, score: 86, cx: 89, delta: 4, facturacion: 10620, tendencia: genEvol(86, 4), dims: { saludo: 90, empatia: 88, eficiencia: 82, claridad: 86, producto: 86, cierre: 88 }, firmaEmocional: arcPreset.acompana, resolucionMedia: '8:22', topTemas: ['Pedidos nuevos', 'Info producto'], idiomas: ['ES', 'EN'] },

  { id: 'cc_rou1', nombre: 'Andreea Mihai', foto: 'https://i.pravatar.cc/160?img=36', supervisorId: 'sup_radu', pais: 'Rumanía', rol: 'Senior', antiguedad: '4 años', turno: 'Mañana', nLlamadas: 148, score: 78, cx: 80, delta: 1, facturacion: 7240, tendencia: genEvol(78, 6), dims: { saludo: 82, empatia: 78, eficiencia: 80, claridad: 78, producto: 74, cierre: 76 }, firmaEmocional: arcPreset.plana, resolucionMedia: '9:14', topTemas: ['Prospección', 'Seguimiento'], idiomas: ['RO', 'EN'] },
  { id: 'cc_rou3', nombre: 'Andrei Popescu', foto: 'https://i.pravatar.cc/160?img=51', supervisorId: 'sup_radu', pais: 'Rumanía', rol: 'Junior', antiguedad: '8 meses', turno: 'Tarde', nLlamadas: 112, score: 54, cx: 58, delta: -6, facturacion: 2840, tendencia: genEvol(54, 10), dims: { saludo: 60, empatia: 48, eficiencia: 52, claridad: 58, producto: 55, cierre: 54 }, firmaEmocional: arcPreset.tensa, resolucionMedia: '12:38', topTemas: ['Prospección', 'Reclamaciones'], idiomas: ['RO'] },
  { id: 'cc_rou5', nombre: 'Cristina Ionescu', foto: 'https://i.pravatar.cc/160?img=40', supervisorId: 'sup_radu', pais: 'Rumanía', rol: 'Middle', antiguedad: '2 años', turno: 'Mañana', nLlamadas: 126, score: 74, cx: 75, delta: 2, facturacion: 5860, tendencia: genEvol(74, 6), dims: { saludo: 78, empatia: 74, eficiencia: 76, claridad: 74, producto: 70, cierre: 72 }, firmaEmocional: arcPreset.acompana, resolucionMedia: '10:04', topTemas: ['Seguimiento', 'Info producto'], idiomas: ['RO', 'EN'] },
];

export const AGENTE_INSIGHTS: Record<string, AgenteInsights> = {
  cc_ita4: {
    fortalezas: [
      { titulo: 'Cierres empáticos con clientes enfadados', metrica: '+23% vs media del equipo', ejemplos: 14 },
      { titulo: 'Detección de oportunidades de upsell', metrica: '+18% en cross-sell', ejemplos: 22 },
      { titulo: 'Manejo de clientes VIP italianos', metrica: 'NPS 94 en cuentas Top-50', ejemplos: 31 },
    ],
    mejoras: [
      { titulo: 'Cierre ágil en llamadas > 10min', metrica: '-12% cuando supera umbral', ejemplos: 6 },
    ],
    momentosBrillantes: [
      { callId: '7BEC3F67', titulo: 'Upsell textbook con Teresa Dipolito', descripcion: 'Aplicación perfecta de política de testers al detectar umbral. Replicable como caso de estudio.', score: 92 },
      { callId: 'UB343F4A', titulo: 'Fidelización de cuenta recurrente', descripcion: 'Cierre emocional que refuerza relación de confianza con cliente desde 2022.', score: 87 },
      { callId: '9CC2B71F', titulo: 'Consulta técnica experta', descripcion: 'Profundidad de conocimiento de producto premium. Respuesta en tiempo sin derivar.', score: 84 },
    ],
    patronesRiesgo: [],
    coachingRecibido: [
      { fecha: '2026-03-12', de: 'Aurelia Romano', titulo: 'Reforzar cierre cuando llamada excede 10min', aplicado: true, mejora: '+8pt' },
      { fecha: '2026-02-04', de: 'Aurelia Romano', titulo: 'Mantener formalidad con cuentas Top-50', aplicado: true, mejora: '+5pt' },
    ],
  },
  cc_rou3: {
    fortalezas: [
      { titulo: 'Constancia en horario de tarde', metrica: '0 ausencias en 6 meses', ejemplos: 0 },
    ],
    mejoras: [
      { titulo: 'Tono en llamadas de prospección fría', metrica: '-28% vs media', ejemplos: 12 },
      { titulo: 'Apertura de conversaciones', metrica: 'Saludo por debajo del estándar', ejemplos: 18 },
      { titulo: 'Manejo de objeciones', metrica: 'Abandona seguimiento muy pronto', ejemplos: 9 },
    ],
    momentosBrillantes: [
      { callId: 'BB29D7CE', titulo: 'Compensación proactiva por retraso', descripcion: 'Ofreció 2 testers adicionales sin que el cliente lo pidiera.', score: 72 },
    ],
    patronesRiesgo: [
      { patron: 'Prospección fría', detalle: 'Sistemáticamente baja score en primeras llamadas del día (7 de las últimas 10 < 60 pts)', severidad: 'ALTA' },
      { patron: 'Llamadas > 8 min', detalle: 'Pierde paciencia tras el minuto 8; el cliente percibe tensión', severidad: 'MEDIA' },
    ],
    coachingRecibido: [
      { fecha: '2026-04-10', de: 'Radu Popescu', titulo: 'Script de apertura para prospección', aplicado: false, mejora: null },
      { fecha: '2026-03-22', de: 'Radu Popescu', titulo: 'Técnicas de escucha activa', aplicado: true, mejora: '+3pt' },
    ],
  },
  default: {
    fortalezas: [
      { titulo: 'Resolución en primera llamada', metrica: '+6% vs media', ejemplos: 12 },
      { titulo: 'Claridad comunicativa', metrica: 'Conf. transcripción 96%', ejemplos: 40 },
    ],
    mejoras: [
      { titulo: 'Cierre emocional', metrica: '-4pt vs media del equipo', ejemplos: 5 },
    ],
    momentosBrillantes: [
      { callId: 'A283C12D', titulo: 'Consulta resuelta en 6 min', descripcion: 'Buen manejo de consulta técnica con potencial comercial.', score: 75 },
    ],
    patronesRiesgo: [],
    coachingRecibido: [
      { fecha: '2026-03-18', de: 'Supervisor', titulo: 'Mejorar cierre proactivo', aplicado: true, mejora: '+2pt' },
    ],
  },
};
