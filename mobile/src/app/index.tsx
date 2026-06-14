import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet } from 'react-native-unistyles';

import { Screen } from '@/components/ui/Screen';
import { createTodayController } from '@/features/today';
import { TodayTab } from '@/features/today/TodayTab';
import { api } from '@/lib/api/client';
import { setMe } from '@/lib/product-state';
import { queryKeys } from '@/lib/query/keys';

// Authenticated home. Bootstraps /me into the product-state snapshot, then the
// Today controller's load() reads has_active_program from it (full lifecycle
// routing to onboarding/recommendation lands with those screens).
const routing = {
  onEnterOnboarding: () => {},
  onMissingProgram: () => {},
};

export default function Index() {
  const { isSignedIn } = useAuth();
  const [controller] = useState(() => createTodayController(routing));

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.getMe(),
    enabled: Boolean(isSignedIn),
  });

  useEffect(() => {
    if (meQuery.data) {
      setMe(meQuery.data);
    }
    if (meQuery.data || meQuery.isError) {
      void controller.load();
    }
  }, [meQuery.data, meQuery.isError, controller]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <TodayTab {...controller.props} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.space.xl,
    paddingBottom: theme.space.xxl * 2,
    gap: theme.space.md,
  },
}));
