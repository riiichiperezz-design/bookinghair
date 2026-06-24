import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
  HankenGrotesk_900Black,
} from '@expo-google-fonts/hanken-grotesk';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BrandLoader } from '@/components/BrandLoader';
import { ensureReminderScheduled } from '@/lib/notifications';
import { ensureSession } from '@/lib/session';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    HankenGrotesk_900Black,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Calienta la sesión anónima y reprograma el recordatorio diario.
  useEffect(() => {
    ensureSession().catch(() => {});
    ensureReminderScheduled().catch(() => {});
  }, []);

  if (!fontsLoaded && !fontError) {
    return <BrandLoader />;
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgBottom },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="record" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="setup" options={{ animation: 'fade' }} />
        <Stack.Screen name="intro" options={{ animation: 'fade' }} />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
