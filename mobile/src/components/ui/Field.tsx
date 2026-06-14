import { TextInput, type TextInputProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface FieldProps extends TextInputProps {
  numeric?: boolean;
}

export function Field({ numeric, style, ...rest }: FieldProps) {
  return (
    <TextInput
      placeholderTextColor="rgba(248, 251, 255, 0.4)"
      {...rest}
      keyboardType={numeric ? 'number-pad' : rest.keyboardType}
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  input: {
    minHeight: 48,
    width: '100%',
    paddingHorizontal: 14,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.copyPrimary,
    fontFamily: theme.fonts.body,
    fontSize: 16,
  },
}));
