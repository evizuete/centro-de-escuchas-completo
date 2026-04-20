import { Catalogo, TaxonomiaTipo, TipoCaso } from '../models/domain.models';

export const TAXONOMIA_CASOS: Record<TipoCaso, TaxonomiaTipo> = {
  'Reclamación': {
    color: '#dc2626',
    subs: ['Producto', 'Servicio de transporte', 'Servicio Call Center'],
  },
  'Incidencia': {
    color: '#ea580c',
    subs: [
      'Entrega retrasada', 'Dirección errónea', 'Producto faltante', 'Incidencia de pago',
      'Ausente', 'Envío extraviado', 'Acceso Web', 'Producto erróneo', 'Sin stock',
      'Producto dañado', 'Producto defectuoso de fábrica', 'Rechazo de pedido',
      'Promoción no aplicada', 'Cobro', 'Otras incidencias',
    ],
  },
  'Solicitud': {
    color: '#2563eb',
    subs: [
      'Aplicar descuento', 'Cambio de producto', 'Reenvío de factura', 'Envío material promocional',
      'Añadir producto', 'Modificación reembolso', 'Cancelación gastos envío', 'Modificación datos cliente',
      'Solicitud información', 'Cancelación', 'Traspaso de activos', 'Precio tachado', 'Precio cero',
      '30 DÍAS RIBA', '60 DÍAS RIBA', '120 DÍAS RIBA',
      '30 DÍAS TRANSFERENCIA', '60 DÍAS TRANSFERENCIA', '120 DÍAS TRANSFERENCIA',
      'TRANSFERENCIA ANTICIPADA',
    ],
  },
  'Sugerencia': {
    color: '#16a34a',
    subs: ['Genérica', 'Producto'],
  },
};

export const CATALOGO: Catalogo = {
  version: '1.0',
  marcas: ['Yodeyma', 'Verset', 'Kenfay'],
  categorias: ['perfumería', 'cosmética'],
  formatos: ['15ml', '50ml', '100ml', '125ml'],
  cosmetica: ['Agua micelar', 'Contorno de ojos', 'Crema de cara', 'Crema de manos', 'Sérum'],
  perfumeriaTotal: 127,
  perfumeriaDestacados: [
    'Adriana', 'Bella', 'Black Elixir', 'Blue Ocean', 'Capri', 'Different',
    'Elixir', 'Elegant Night', 'First', 'Rosa Nera', 'Mediterráneo', 'Vanille Intense',
    'Acqua di Rose', 'Display Prestige 30',
  ],
};
