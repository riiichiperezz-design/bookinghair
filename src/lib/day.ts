/** Utilidades del "día" de ecco: el servidor resetea a medianoche UTC. */

/** Inicio del día UTC actual, en ISO (para filtrar "hoy" en consultas). */
export function utcDayStart(): string {
  return `${new Date().toISOString().slice(0, 10)}T00:00:00Z`;
}

/** Horas que faltan para la próxima medianoche UTC (reset del ritual). */
export function hoursToUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return Math.max(1, Math.round((next - now.getTime()) / 3_600_000));
}
