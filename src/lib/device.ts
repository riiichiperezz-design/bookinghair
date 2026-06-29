import { getItem, setItem } from './storage';

const KEY = 'ecco.device.v1';
let cached: string | null = null;

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Identificador local del dispositivo (para el rate-limit por aparato). */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  let id = await getItem(KEY);
  if (!id) {
    id = uuid();
    await setItem(KEY, id);
  }
  cached = id;
  return id;
}
