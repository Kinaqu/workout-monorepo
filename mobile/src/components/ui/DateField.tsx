import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { formatLongDateLabel } from '@/shared/utils/date';
import { AppText } from './AppText';
import { Button } from './Button';

function toDate(value: string): Date {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DateFieldProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

export function DateField({ value, onChange, disabled = false }: DateFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(() => toDate(value));

  function open() {
    if (disabled) return;

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(value),
        mode: 'date',
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) {
            onChange(toIso(date));
          }
        },
      });
      return;
    }

    setTemp(toDate(value));
    setIosOpen(true);
  }

  return (
    <>
      <Pressable onPress={open} disabled={disabled} style={[styles.field, disabled && styles.disabled]}>
        <AppText style={styles.value}>{formatLongDateLabel(value) || 'Select date'}</AppText>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="fade" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <DateTimePicker
                value={temp}
                mode="date"
                display="inline"
                onChange={(_event, date) => {
                  if (date) setTemp(date);
                }}
              />
              <Button
                title="Done"
                onPress={() => {
                  onChange(toIso(temp));
                  setIosOpen(false);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  field: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  value: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.copyPrimary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.xl,
    padding: theme.space.lg,
    gap: theme.space.md,
  },
}));
