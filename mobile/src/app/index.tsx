import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';

export default function Index() {
  return (
    <Screen>
      <View style={styles.container}>
        <AppText variant="display">Kinova</AppText>
        <AppText variant="secondary">React Native — design system online</AppText>

        <Card style={styles.card}>
          <AppText variant="title">Today’s workout</AppText>
          <AppText variant="subtitle">Unistyles theme ported from style.css</AppText>
          <View style={styles.row}>
            <Pill tone="accent">Strength</Pill>
            <Pill>Day A</Pill>
          </View>
          <Button title="Log each set" onPress={() => {}} />
          <Button title="Update plan" tone="secondary" onPress={() => {}} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.space.xl,
    gap: theme.space.md,
  },
  card: {
    marginTop: theme.space.sm,
    gap: theme.space.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.space.sm,
    marginVertical: theme.space.xs,
  },
}));
