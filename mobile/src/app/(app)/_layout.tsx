import { Tabs } from 'expo-router';
import { ClipboardList, Dumbbell, History } from 'lucide-react-native';

import { darkTheme } from '@/theme/tokens';

// Bottom tabs = frontend/app/BottomNav.tsx (today / history / program → "Plan").
// lucide icons replace the inline SVGs; cross-platform (iOS + Android).
export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: darkTheme.colors.accent,
        tabBarInactiveTintColor: darkTheme.colors.copyMuted,
        tabBarStyle: {
          backgroundColor: darkTheme.colors.surfaceStrong,
          borderTopColor: darkTheme.colors.border,
        },
        tabBarLabelStyle: { fontFamily: darkTheme.fonts.bodyMedium },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{ title: 'Today', tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: ({ color, size }) => <History color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="program"
        options={{ title: 'Plan', tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }}
      />
    </Tabs>
  );
}
