const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function llamarFuncion<T>(nombre: string, body: unknown): Promise<T> {
  const res = await fetch(`${FUNCTIONS_URL}/${nombre}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON}`,
      apikey: ANON,
    },
    body: JSON.stringify(body),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.error ?? 'Algo ha ido mal. Inténtalo de nuevo.')
  }
  return json as T
}
