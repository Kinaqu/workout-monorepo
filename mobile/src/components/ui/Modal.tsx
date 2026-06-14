import type { ReactNode } from 'react';
import { Modal, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './AppText';

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

// Themed centered dialog — the native replacement for the web app's HTML
// <dialog> (ConfirmDialog, recommendation exercise replacement).
export function AppModal({ visible, onClose, title, children }: AppModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {title ? (
            <AppText variant="title" style={styles.title}>
              {title}
            </AppText>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
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
  title: {
    marginBottom: theme.space.xs,
  },
}));
