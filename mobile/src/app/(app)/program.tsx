import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet } from 'react-native-unistyles';

import { Screen } from '@/components/ui/Screen';
import { createProgramController } from '@/features/program';
import { ProgramTab } from '@/features/program/ProgramTab';
import { api } from '@/lib/api/client';
import { refreshLifecycle } from '@/lib/lifecycle-nav';
import { setMe, updateMeLifecycle } from '@/lib/product-state';
import { queryKeys } from '@/lib/query/keys';

// Program tab route. After a rebuild, refreshLifecycle re-runs the lifecycle
// gate (an active program now exists → Today shows the freshly built workout).
export default function ProgramScreen() {
  const [controller] = useState(() =>
    createProgramController({
      onEnterOnboarding: () => router.replace('/onboarding'),
      onMissingProgram: () => updateMeLifecycle({ has_active_program: false }),
      onRefreshProductState: refreshLifecycle,
    })
  );

  const meQuery = useQuery({ queryKey: queryKeys.me, queryFn: () => api.getMe() });

  useFocusEffect(
    useCallback(() => {
      if (meQuery.data) setMe(meQuery.data);
      void controller.load();
    }, [meQuery.data, controller])
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ProgramTab {...controller.props} />
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
