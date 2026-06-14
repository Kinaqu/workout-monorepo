import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet } from 'react-native-unistyles';

import { Screen } from '@/components/ui/Screen';
import { createTodayController } from '@/features/today';
import { TodayTab } from '@/features/today/TodayTab';
import { api } from '@/lib/api/client';
import { lifecycleRouting } from '@/lib/lifecycle-nav';
import { setMe } from '@/lib/product-state';
import { queryKeys } from '@/lib/query/keys';

// Today tab. Moved out of app/index.tsx (now the lifecycle gate). The gate
// already primed /me; here we refresh the snapshot and re-run the controller's
// load() on focus so returning to the tab re-evaluates active-program state.
export default function TodayScreen() {
  const [controller] = useState(() => createTodayController(lifecycleRouting));

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
