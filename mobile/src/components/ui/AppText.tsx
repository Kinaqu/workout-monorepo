import { Text, type TextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type TextVariant =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'secondary'
  | 'muted'
  | 'label';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
}

export function AppText({ variant = 'body', style, ...rest }: AppTextProps) {
  return <Text {...rest} style={[styles[variant], style]} />;
}

const styles = StyleSheet.create((theme) => ({
  display: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: theme.colors.foreground,
  },
  title: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 18,
    color: theme.colors.copyPrimary,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.copySecondary,
  },
  body: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.copyPrimary,
  },
  secondary: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.copySecondary,
  },
  muted: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.copyMuted,
  },
  label: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.copyMuted,
  },
}));
