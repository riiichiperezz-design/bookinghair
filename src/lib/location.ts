import { Platform } from 'react-native';

import { type Country, nearestCountry } from '@/constants/countries';

export type ApproxLocation = {
  country: Country;
  /** Ciudad o región aproximada (nunca dirección exacta). */
  region: string | null;
  lat: number;
  lng: number;
};

// Carga perezosa: nunca importamos expo-location en web / render estático.
function mod(): typeof import('expo-location') | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-location');
  } catch {
    return null;
  }
}

/** Geolocalización del navegador (web), sin reverse-geocoding. */
function webCoords(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  });
}

/**
 * Ubicación aproximada del usuario (con permiso). Devuelve el país por cercanía
 * y, en nativo, una ciudad/región aproximada. Nunca expone coordenadas exactas
 * fuera de aquí: solo se guarda país + región. null si se deniega o falla.
 */
export async function getApproxLocation(): Promise<ApproxLocation | null> {
  const L = mod();

  if (!L) {
    const c = await webCoords();
    if (!c) return null;
    return {
      country: nearestCountry(c.lat, c.lng),
      region: null,
      lat: c.lat,
      lng: c.lng,
    };
  }

  try {
    const perm = await L.requestForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const pos = await L.getCurrentPositionAsync({ accuracy: L.Accuracy.Low });
    const { latitude: lat, longitude: lng } = pos.coords;

    let region: string | null = null;
    try {
      const places = await L.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const p = places[0];
      region = p?.city ?? p?.subregion ?? p?.region ?? null;
    } catch {
      // sin reverse-geocoding: nos quedamos con el país por cercanía
    }

    return { country: nearestCountry(lat, lng), region, lat, lng };
  } catch {
    return null;
  }
}
