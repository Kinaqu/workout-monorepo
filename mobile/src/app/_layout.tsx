import '@/theme/unistyles';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { darkTheme } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope: require('../../assets/fonts/manrope-400.ttf'),
    'Manrope-Medium': require('../../assets/fonts/manrope-500.ttf'),
    'Manrope-SemiBold': require('../../assets/fonts/manrope-600.ttf'),
    'Manrope-Bold': require('../../assets/fonts/manrope-700.ttf'),
    'Manrope-ExtraBold': require('../../assets/fonts/manrope-800.ttf'),
    Sora: require('../../assets/fonts/sora-400.ttf'),
    'Sora-Medium': require('../../assets/fonts/sora-500.ttf'),
    'Sora-SemiBold': require('../../assets/fonts/sora-600.ttf'),
    'Sora-Bold': require('../../assets/fonts/sora-700.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: darkTheme.colors.background },
        }}
      />
    </>
  );
}
