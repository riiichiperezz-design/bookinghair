import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { ensureSession } from './session';
import { supabase } from './supabase';

// Carga perezosa (no romper el render estático en web). Devolvemos `any` a
// propósito: las llamamos con guardas y así no nos atamos a la API exacta de
// cada versión de estas librerías.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function picker(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-image-picker');
  } catch {
    return null;
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function manip(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-image-manipulator');
  } catch {
    return null;
  }
}

/**
 * Elige una foto de la galería, la recorta a cuadrado, la reduce a 400px y la
 * sube al bucket `avatars`. Actualiza profiles.avatar_url y devuelve la URL
 * (pública, con cache-bust). null si se cancela o no hay permiso.
 */
export async function pickAndUploadAvatar(): Promise<string | null> {
  const ImagePicker = picker();
  if (!ImagePicker) return null;

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  });
  if (res.canceled || !res.assets?.[0]) return null;

  let uri = res.assets[0].uri;
  let base64: string | null | undefined = res.assets[0].base64;

  // Reduce a 400px y comprime (barato en ancho de banda y almacenamiento).
  const Manip = manip();
  if (Manip) {
    try {
      const out = await Manip.manipulateAsync(uri, [{ resize: { width: 400 } }], {
        compress: 0.7,
        format: Manip.SaveFormat.JPEG,
        base64: true,
      });
      uri = out.uri;
      base64 = out.base64;
    } catch {
      // seguimos con el original
    }
  }

  const user = await ensureSession();
  const path = `${user.id}/avatar.jpg`;

  let body: Blob | ArrayBuffer;
  if (Platform.OS === 'web') {
    body = await (await fetch(uri)).blob();
  } else {
    if (!base64) {
      base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    }
    body = decodeBase64(base64);
  }

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, body, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`; // fuerza refresco de caché
  await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
  return url;
}
