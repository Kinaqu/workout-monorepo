import '@/theme/unistyles';

import { useEffect } from 'react';
import { router, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { QueryClientProvider } from '@tanstack/react-query';

import { setAuthRedirectHandler, setTokenProvider } from '@/lib/api/client';
import { queryClient } from '@/lib/query/client';
import { darkTheme } from '@/theme/tokens';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

// On a 401 the API client asks us to bounce to sign-in (web used window.location).
setAuthRedirectHandler(() => router.replace('/login'));

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
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <RootNavigator />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function RootNavigator() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const segments = useSegments();
  const navRouter = useRouter();

  // Feed the API client a fresh Clerk token getter. Done during render so it is
  // set before any child screen fires its first request.
  setTokenProvider((options) => getToken(options ?? undefined));

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!isSignedIn && !inAuthGroup) {
      navRouter.replace('/login');
    } else if (isSignedIn && inAuthGroup) {
      navRouter.replace('/');
    }
  }, [isLoaded, isSignedIn, segments, navRouter]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: darkTheme.colors.background },
      }}
    />
  );
}
