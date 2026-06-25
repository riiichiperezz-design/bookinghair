// COPIA ESPEJO de src/constants/moderacion.ts (server-side, Deno).
// Mantener en sync con el del cliente. Define la política de contenido de ECCO.

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

export type AccionModeracion = 'rechazado' | 'revision_humana';

type PoliticaCategoria = {
  accion: AccionModeracion;
  conservarEvidencia?: boolean;
};

export const POLITICA_MODERACION: Record<CategoriaModeracion, PoliticaCategoria> = {
  [CATEGORIAS_MODERACION.EXPLOTACION_SEXUAL_INFANTIL]: {
    accion: 'rechazado',
    conservarEvidencia: true,
  },
  [CATEGORIAS_MODERACION.CONTENIDO_SEXUAL_EXPLICITO]: { accion: 'rechazado' },
  [CATEGORIAS_MODERACION.AMENAZAS_VIOLENCIA]: { accion: 'rechazado' },
  [CATEGORIAS_MODERACION.ACOSO_BULLYING]: { accion: 'rechazado' },
  [CATEGORIAS_MODERACION.ODIO_DISCRIMINACION]: { accion: 'rechazado' },
  [CATEGORIAS_MODERACION.AUTOLESION_SUICIDIO]: { accion: 'revision_humana' },
  [CATEGORIAS_MODERACION.DATOS_PERSONALES]: { accion: 'rechazado' },
  [CATEGORIAS_MODERACION.SPAM_ESTAFA]: { accion: 'rechazado' },
  [CATEGORIAS_MODERACION.ACTIVIDADES_ILEGALES]: { accion: 'rechazado' },
  [CATEGORIAS_MODERACION.SUPLANTACION]: { accion: 'revision_humana' },
};

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
 * Aplica la acción MÁS SEVERA entre las categorías detectadas.
 * Solo aprueba con lista vacía de categorías conocidas; cualquier entrada
 * inesperada (no-array, nulos o desconocidas) cae a revisión humana.
 */
export function evaluarCategorias(
  detectadas: CategoriaModeracion[]
): ResultadoEvaluacion {
  if (!Array.isArray(detectadas)) {
    return { decision: 'revision_humana', categoria: null, conservarEvidencia: false };
  }
  if (detectadas.length === 0) {
    return { decision: 'aprobado', categoria: null, conservarEvidencia: false };
  }
  const validas = detectadas.filter(
    (c): c is CategoriaModeracion =>
      typeof c === 'string' &&
      Object.prototype.hasOwnProperty.call(POLITICA_MODERACION, c)
  );
  if (validas.length === 0) {
    return { decision: 'revision_humana', categoria: null, conservarEvidencia: false };
  }
  let peor = validas[0];
  for (const c of validas) {
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
