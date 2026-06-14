import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet } from 'react-native-unistyles';

import { Screen } from '@/components/ui/Screen';
import { createHistoryController } from '@/features/history';
import { HistoryTab } from '@/features/history/HistoryTab';
import { api } from '@/lib/api/client';
import { lifecycleRouting } from '@/lib/lifecycle-nav';
import { setMe } from '@/lib/product-state';
import { queryKeys } from '@/lib/query/keys';

// History tab route. Mirrors (app)/today.tsx: refresh the /me snapshot, then run
// the controller's loadSelected() on focus (defaults to today's date).
export default function HistoryScreen() {
  const [controller] = useState(() => createHistoryController(lifecycleRouting));
  const meQuery = useQuery({ queryKey: queryKeys.me, queryFn: () => api.getMe() });

  useFocusEffect(
    useCallback(() => {
      if (meQuery.data) setMe(meQuery.data);
      void controller.loadSelected();
    }, [meQuery.data, controller])
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <HistoryTab {...controller.props} />
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
