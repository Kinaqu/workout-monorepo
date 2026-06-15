import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { createMMKV } from 'react-native-mmkv';

// On-disk store for the TanStack Query cache ("online + disk cache"): the last
// successful query data is restored on cold start and readable offline. Writes
// (mutations) stay online-only — see app/_layout.tsx persistOptions.
const storage = createMMKV({ id: 'kinova-query-cache' });

export const queryPersister = createSyncStoragePersister({
  storage: {
    getItem: (key) => storage.getString(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.remove(key),
  },
});
