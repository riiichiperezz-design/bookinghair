import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CATEGORIAS_MODERACION as C,
  POLITICA_MODERACION,
  evaluarCategorias as evaluarApp,
  type CategoriaModeracion,
} from '../src/constants/moderacion.ts';
import { evaluarCategorias as evaluarServer } from '../supabase/functions/moderar-audio/categorias.ts';

const TODAS = Object.values(C) as CategoriaModeracion[];

test('1) sin categorías detectadas -> aprobado', () => {
  const r = evaluarApp([]);
  assert.equal(r.decision, 'aprobado');
  assert.equal(r.categoria, null);
  assert.equal(r.conservarEvidencia, false);
});

test('2) una sola categoría de RECHAZAR -> rechazado', () => {
  const r = evaluarApp([C.CONTENIDO_SEXUAL_EXPLICITO]);
  assert.equal(r.decision, 'rechazado');
  assert.equal(r.categoria, C.CONTENIDO_SEXUAL_EXPLICITO);
});

test('3) una sola categoría de REVISIÓN -> revision_humana', () => {
  const r = evaluarApp([C.AUTOLESION_SUICIDIO]);
  assert.equal(r.decision, 'revision_humana');
  assert.equal(r.categoria, C.AUTOLESION_SUICIDIO);
});

test('4) varias mezcladas (leve + grave) -> gana la más severa', () => {
  // revisión (suplantación) + rechazo (amenazas) -> rechazado
  const r1 = evaluarApp([C.SUPLANTACION, C.AMENAZAS_VIOLENCIA]);
  assert.equal(r1.decision, 'rechazado');
  assert.equal(r1.categoria, C.AMENAZAS_VIOLENCIA);

  // dos rechazos: gana el más severo por orden de severidad
  const r2 = evaluarApp([C.SPAM_ESTAFA, C.CONTENIDO_SEXUAL_EXPLICITO]);
  assert.equal(r2.decision, 'rechazado');
  assert.equal(r2.categoria, C.CONTENIDO_SEXUAL_EXPLICITO);

  // el orden de entrada no cambia el resultado
  const r3 = evaluarApp([C.CONTENIDO_SEXUAL_EXPLICITO, C.SPAM_ESTAFA]);
  assert.deepEqual(r3, r2);
});

test('5) CSAM combinado con CUALQUIER otra -> gana CSAM (+ conservar evidencia)', () => {
  for (const otra of TODAS) {
    if (otra === C.EXPLOTACION_SEXUAL_INFANTIL) continue;
    const r = evaluarApp([otra, C.EXPLOTACION_SEXUAL_INFANTIL]);
    assert.equal(r.decision, 'rechazado', `falló con ${otra}`);
    assert.equal(r.categoria, C.EXPLOTACION_SEXUAL_INFANTIL, `falló con ${otra}`);
    assert.equal(r.conservarEvidencia, true, `falló con ${otra}`);
  }
});

test('6) REVISIÓN + RECHAZAR -> gana RECHAZAR', () => {
  const r = evaluarApp([C.AUTOLESION_SUICIDIO, C.DATOS_PERSONALES]);
  assert.equal(r.decision, 'rechazado');
  assert.equal(r.categoria, C.DATOS_PERSONALES);
});

test('7) entradas inesperadas -> NUNCA aprobado', () => {
  // null / undefined (no-array)
  // @ts-expect-error probamos entrada inválida a propósito
  assert.notEqual(evaluarApp(null).decision, 'aprobado');
  // @ts-expect-error
  assert.notEqual(evaluarApp(undefined).decision, 'aprobado');
  // categoría desconocida
  // @ts-expect-error
  assert.equal(evaluarApp(['categoria_inventada']).decision, 'revision_humana');
  // nulos dentro del array
  // @ts-expect-error
  assert.notEqual(evaluarApp([null, undefined]).decision, 'aprobado');
  // desconocida + una de rechazo válida -> sigue ganando el rechazo (nunca aprueba)
  // @ts-expect-error
  const r = evaluarApp(['xxx', C.SPAM_ESTAFA]);
  assert.equal(r.decision, 'rechazado');
});

test('toda categoría conocida produce su acción declarada en la política', () => {
  for (const cat of TODAS) {
    const r = evaluarApp([cat]);
    assert.equal(r.decision, POLITICA_MODERACION[cat].accion, `cat ${cat}`);
    assert.notEqual(r.decision, 'aprobado', `cat ${cat} no debe aprobar`);
  }
});

test('SYNC: la copia espejo (server) da el MISMO resultado que la app', () => {
  const casos: CategoriaModeracion[][] = [
    [],
    ...TODAS.map((c) => [c]),
    [C.SUPLANTACION, C.AMENAZAS_VIOLENCIA],
    [C.SPAM_ESTAFA, C.CONTENIDO_SEXUAL_EXPLICITO],
    [C.AUTOLESION_SUICIDIO, C.DATOS_PERSONALES],
    [C.SPAM_ESTAFA, C.EXPLOTACION_SEXUAL_INFANTIL],
    TODAS, // todas a la vez
  ];
  for (const caso of casos) {
    assert.deepEqual(
      evaluarServer(caso),
      evaluarApp(caso),
      `desincronizado en: [${caso.join(', ')}]`
    );
  }
  // También en entradas inesperadas
  const raros = [null, undefined, ['xxx'], [null, C.SPAM_ESTAFA]];
  for (const caso of raros) {
    assert.deepEqual(
      // @ts-expect-error entrada inválida a propósito
      evaluarServer(caso),
      // @ts-expect-error
      evaluarApp(caso),
      `desincronizado en entrada rara: ${JSON.stringify(caso)}`
    );
  }
});
