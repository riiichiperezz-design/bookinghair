import { logError } from './log';
import { ensureSession } from './session';
import { supabase } from './supabase';

export type Song = {
  id: string;
  title: string;
  artist: string;
  url: string;
  image: string | null;
};

type SearchTrack = Song & { preview: string | null };

/** Busca canciones en Spotify vía la Edge Function (el secreto vive allí). */
export async function searchTracks(query: string): Promise<SearchTrack[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    await ensureSession();
    const { data, error } = await supabase.functions.invoke('spotify-buscar', {
      body: { q },
    });
    if (error) throw error;
    return (data?.tracks ?? []) as SearchTrack[];
  } catch (e) {
    logError('spotify.search', e);
    return [];
  }
}

/** Reduce un resultado de búsqueda a lo que se guarda con la voz. */
export function toSong(t: SearchTrack): Song {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    url: t.url,
    image: t.image,
  };
}
