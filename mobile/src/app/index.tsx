import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { DateField } from '@/components/ui/DateField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { AppModal } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { getTodayDateString } from '@/shared/utils/date';

const GOALS = [
  { id: 'strength', label: 'Strength' },
  { id: 'muscle', label: 'Muscle' },
  { id: 'fitness', label: 'General fitness' },
  { id: 'mobility', label: 'Mobility' },
];

// Temporary component showcase + entry to the Today screen — replaced by the
// real routes/navigation in task #8.
export default function Index() {
  const [note, setNote] = useState('');
  const [reps, setReps] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [goal, setGoal] = useState('strength');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="display">Kinova</AppText>
        <AppText variant="secondary">Design system — component showcase</AppText>
        <Button title="Open Today screen" onPress={() => router.push('/today' as Href)} />

        <Card style={styles.card}>
          <AppText variant="title">Inputs</AppText>
          <Field placeholder="Workout note" value={note} onChangeText={setNote} />
          <Field placeholder="Reps" numeric value={reps} onChangeText={setReps} />
          <DateField value={date} onChange={setDate} />
        </Card>

        <Card style={styles.card}>
          <AppText variant="title">Choices</AppText>
          <ChoiceGroup>
            {GOALS.map((option) => (
              <ChoiceChip
                key={option.id}
                label={option.label}
                selected={goal === option.id}
                onPress={() => setGoal(option.id)}
              />
            ))}
          </ChoiceGroup>
          <View style={styles.row}>
            <Pill tone="accent">{`Selected: ${goal}`}</Pill>
          </View>
        </Card>

        <Card style={styles.card}>
          <AppText variant="title">Feedback</AppText>
          <Skeleton width="70%" height={18} />
          <Skeleton width="100%" height={48} radius={14} />
          <Button title="Open modal" tone="secondary" onPress={() => setModalOpen(true)} />
        </Card>

        <EmptyState
          title="No plan yet"
          message="Build your first plan, then today’s workout shows up here."
          action={{ label: 'Open Plan', onPress: () => {} }}
        />
      </ScrollView>

      <AppModal visible={modalOpen} onClose={() => setModalOpen(false)} title="Confirm">
        <AppText variant="secondary">A themed modal replacing the web dialog element.</AppText>
        <Button title="Got it" onPress={() => setModalOpen(false)} />
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.space.xl,
    gap: theme.space.md,
    paddingBottom: theme.space.xxl * 2,
  },
  card: {
    gap: theme.space.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.space.sm,
    marginTop: theme.space.xs,
  },
}));
