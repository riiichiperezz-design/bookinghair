import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing env var EXPO_PUBLIC_SUPABASE_URL. Define it in your .env file.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing env var EXPO_PUBLIC_SUPABASE_ANON_KEY. Define it in your .env file.'
  );
}

// En el render estático de web (Node) no existe `window`, y AsyncStorage en web
// usa window.localStorage. Para no romper el SSG, solo persistimos la sesión en
// cliente (navegador o nativo); en servidor el cliente es efímero.
const isServer = typeof window === 'undefined';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(isServer ? {} : { storage: AsyncStorage }),
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});
