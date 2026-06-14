// Design tokens ported from frontend/public/style.css (:root). Single dark
// theme — the app is dark-only, matching the web app. Keep in sync with
// style.css if the brand changes (no shared package by design).

export const darkTheme = {
  colors: {
    background: '#05070b',
    foreground: '#f8fbff',
    accent: '#125bff',
    accentStrong: '#2e72ff',
    accentSoft: '#8ab4ff',
    accentTeal: '#5eead4',
    surfaceStrong: '#08111f',
    surfaceElevated: '#0b111a',
    surfacePanel: 'rgba(255, 255, 255, 0.045)',
    surfacePanelStrong: 'rgba(255, 255, 255, 0.07)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    copyPrimary: 'rgba(248, 251, 255, 0.96)',
    copySecondary: 'rgba(248, 251, 255, 0.72)',
    copyMuted: 'rgba(248, 251, 255, 0.52)',
    success: '#4fd18f',
    error: '#f07d8c',
    onAccent: '#ffffff',
  },
  fonts: {
    body: 'Manrope',
    bodyMedium: 'Manrope-Medium',
    bodySemiBold: 'Manrope-SemiBold',
    bodyBold: 'Manrope-Bold',
    bodyExtraBold: 'Manrope-ExtraBold',
    display: 'Sora',
    displayMedium: 'Sora-Medium',
    displaySemiBold: 'Sora-SemiBold',
    displayBold: 'Sora-Bold',
  },
  radii: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 28,
    pill: 999,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
} as const;

export type AppTheme = typeof darkTheme;
