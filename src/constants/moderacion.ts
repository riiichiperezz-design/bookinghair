// Política de contenido de ECCO. Fuente ÚNICA y reutilizable de categorías,
// acciones y severidad. La usan el panel de moderación y las estadísticas.
// (El ModeradorAPI server-side mantiene una copia espejo en
//  supabase/functions/moderar-audio/categorias.ts — mantener en sync.)

export const CATEGORIAS_MODERACION = {
  EXPLOTACION_SEXUAL_INFANTIL: 'explotacion_sexual_infantil',
  CONTENIDO_SEXUAL_EXPLICITO: 'contenido_sexual_explicito',
  AMENAZAS_VIOLENCIA: 'amenazas_violencia',
  ACOSO_BULLYING: 'acoso_bullying',
  ODIO_DISCRIMINACION: 'odio_discriminacion',
  AUTOLESION_SUICIDIO: 'autolesion_suicidio',
  DATOS_PERSONALES: 'datos_personales',
  SPAM_ESTAFA: 'spam_estafa',
  ACTIVIDADES_ILEGALES: 'actividades_ilegales',
  SUPLANTACION: 'suplantacion',
} as const;

export type CategoriaModeracion =
  (typeof CATEGORIAS_MODERACION)[keyof typeof CATEGORIAS_MODERACION];

/** La acción es el ESTADO al que se lleva el audio. */
export type AccionModeracion = 'rechazado' | 'revision_humana';

export type PoliticaCategoria = {
  accion: AccionModeracion;
  /** Conservar evidencia (gravedad máxima: explotación sexual infantil). */
  conservarEvidencia?: boolean;
  etiqueta: string;
  descripcion: string;
};

export const POLITICA_MODERACION: Record<CategoriaModeracion, PoliticaCategoria> = {
  [CATEGORIAS_MODERACION.EXPLOTACION_SEXUAL_INFANTIL]: {
    accion: 'rechazado',
    conservarEvidencia: true,
    etiqueta: 'Explotación sexual infantil',
    descripcion: 'Gravedad máxima. Rechazar y conservar evidencia.',
  },
  [CATEGORIAS_MODERACION.CONTENIDO_SEXUAL_EXPLICITO]: {
    accion: 'rechazado',
    etiqueta: 'Contenido sexual explícito',
    descripcion: 'Contenido sexual explícito.',
  },
  [CATEGORIAS_MODERACION.AMENAZAS_VIOLENCIA]: {
    accion: 'rechazado',
    etiqueta: 'Amenazas / violencia',
    descripcion: 'Amenazas o incitación a la violencia (revisión humana si es ambiguo).',
  },
  [CATEGORIAS_MODERACION.ACOSO_BULLYING]: {
    accion: 'rechazado',
    etiqueta: 'Acoso / bullying',
    descripcion: 'Acoso o intimidación hacia una persona.',
  },
  [CATEGORIAS_MODERACION.ODIO_DISCRIMINACION]: {
    accion: 'rechazado',
    etiqueta: 'Odio / discriminación',
    descripcion: 'Raza, religión, orientación, género, origen o discapacidad.',
  },
  [CATEGORIAS_MODERACION.AUTOLESION_SUICIDIO]: {
    accion: 'revision_humana',
    etiqueta: 'Autolesión / suicidio',
    descripcion: 'Revisión humana: distinguir petición de ayuda de apología.',
  },
  [CATEGORIAS_MODERACION.DATOS_PERSONALES]: {
    accion: 'rechazado',
    etiqueta: 'Datos personales',
    descripcion: 'Teléfonos, direcciones, redes o datos que identifiquen a alguien.',
  },
  [CATEGORIAS_MODERACION.SPAM_ESTAFA]: {
    accion: 'rechazado',
    etiqueta: 'Spam / estafa',
    descripcion: 'Publicidad, captación a otras plataformas o fraude.',
  },
  [CATEGORIAS_MODERACION.ACTIVIDADES_ILEGALES]: {
    accion: 'rechazado',
    etiqueta: 'Actividades ilegales',
    descripcion: 'Venta de drogas/armas o instrucciones para delinquir.',
  },
  [CATEGORIAS_MODERACION.SUPLANTACION]: {
    accion: 'revision_humana',
    etiqueta: 'Suplantación',
    descripcion: 'Hacerse pasar por otra persona (revisión humana).',
  },
};

// Severidad de menos a más grave (la última es la peor). Se usa para elegir la
// categoría "ganadora" cuando se detectan varias.
export const ORDEN_SEVERIDAD: CategoriaModeracion[] = [
  CATEGORIAS_MODERACION.SUPLANTACION,
  CATEGORIAS_MODERACION.AUTOLESION_SUICIDIO,
  CATEGORIAS_MODERACION.SPAM_ESTAFA,
  CATEGORIAS_MODERACION.DATOS_PERSONALES,
  CATEGORIAS_MODERACION.ACTIVIDADES_ILEGALES,
  CATEGORIAS_MODERACION.ODIO_DISCRIMINACION,
  CATEGORIAS_MODERACION.ACOSO_BULLYING,
  CATEGORIAS_MODERACION.AMENAZAS_VIOLENCIA,
  CATEGORIAS_MODERACION.CONTENIDO_SEXUAL_EXPLICITO,
  CATEGORIAS_MODERACION.EXPLOTACION_SEXUAL_INFANTIL,
];

const PESO_ACCION: Record<AccionModeracion, number> = {
  revision_humana: 1,
  rechazado: 2,
};

function severidad(cat: CategoriaModeracion): [number, number] {
  return [PESO_ACCION[POLITICA_MODERACION[cat].accion], ORDEN_SEVERIDAD.indexOf(cat)];
}

export type ResultadoEvaluacion = {
  decision: 'aprobado' | 'rechazado' | 'revision_humana';
  categoria: CategoriaModeracion | null;
  conservarEvidencia: boolean;
};

/**
 * Dada la lista de categorías detectadas, aplica la acción MÁS SEVERA.
 * Sin categorías → aprobado.
 */
export function evaluarCategorias(
  detectadas: CategoriaModeracion[]
): ResultadoEvaluacion {
  if (detectadas.length === 0) {
    return { decision: 'aprobado', categoria: null, conservarEvidencia: false };
  }
  let peor = detectadas[0];
  for (const c of detectadas) {
    const [a1, a2] = severidad(c);
    const [b1, b2] = severidad(peor);
    if (a1 > b1 || (a1 === b1 && a2 > b2)) peor = c;
  }
  const pol = POLITICA_MODERACION[peor];
  return {
    decision: pol.accion,
    categoria: peor,
    conservarEvidencia: !!pol.conservarEvidencia,
  };
}

/** Etiqueta legible de una categoría (o el texto tal cual si no es categoría). */
export function etiquetaCategoria(slug: string | null): string {
  if (!slug) return 'sin clasificar';
  const pol = (POLITICA_MODERACION as Record<string, PoliticaCategoria>)[slug];
  return pol ? pol.etiqueta : slug;
}
