import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { api } from '@/lib/api/client';
import { isOnboardingIncompleteError } from '@/lib/api/errors';
import { hasActiveProgram, hasCompletedOnboarding, setMe } from '@/lib/product-state';
import { queryKeys } from '@/lib/query/keys';
import { getApiErrorMessage } from '@/shared/hooks/use-routed-api-error';
import { darkTheme } from '@/theme/tokens';

// Lifecycle gate — replaces frontend/app/App.tsx:refreshProductState. Resolves
// /me once, mirrors it into the product-state snapshot, then redirects to the
// matching route. The signed-out redirect is handled in _layout.
export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.getMe(),
    enabled: Boolean(isSignedIn),
  });

  useEffect(() => {
    if (meQuery.data) setMe(meQuery.data);
  }, [meQuery.data]);

  if (!isLoaded || !isSignedIn || meQuery.isPending) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={darkTheme.colors.accentSoft} />
        </View>
      </Screen>
    );
  }

  if (meQuery.isError) {
    // Onboarding-incomplete is the one lifecycle signal /me can surface here;
    // everything else is a hard error the user can retry.
    if (isOnboardingIncompleteError(meQuery.error)) {
      return <Redirect href="/onboarding" />;
    }
    return (
      <Screen>
        <View style={styles.center}>
          <AppText variant="title">Couldn’t load your account</AppText>
          <AppText variant="secondary">{getApiErrorMessage(meQuery.error)}</AppText>
          <Button title="Try again" onPress={() => void meQuery.refetch()} />
        </View>
      </Screen>
    );
  }

  if (hasActiveProgram()) return <Redirect href="/today" />;
  if (!hasCompletedOnboarding()) return <Redirect href="/onboarding" />;
  return <Redirect href="/recommendation" />;
}

const styles = StyleSheet.create((theme) => ({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
    padding: theme.space.xl,
  },
}));
