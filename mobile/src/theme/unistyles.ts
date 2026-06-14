// Unistyles 3 configuration. Import this once, before anything renders — it is
// the first import in src/app/_layout.tsx.
import { StyleSheet } from 'react-native-unistyles';

import { darkTheme } from './tokens';

const appThemes = {
  dark: darkTheme,
};

type AppThemes = typeof appThemes;

declare module 'react-native-unistyles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: appThemes,
  settings: {
    initialTheme: 'dark',
  },
});
