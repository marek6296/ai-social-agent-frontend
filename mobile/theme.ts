/**
 * Design System pre AI Social Agent Mobile App
 * Zodpovedá farbám a štýlom z webu
 */

// Farba primárnej zelenej z webu (#10b981 = hsl(142.1 76.2% 36.3%))
export const colors = {
  // Light mode
  light: {
    background: '#ffffff',
    foreground: '#0f172a',
    card: '#ffffff',
    cardForeground: '#0f172a',
    primary: '#10b981', // hsl(142.1 76.2% 36.3%)
    primaryForeground: '#ffffff',
    secondary: '#f1f5f9',
    secondaryForeground: '#0f172a',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
    accent: '#f1f5f9',
    accentForeground: '#0f172a',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#10b981',
  },
  // Dark mode - presné farby z webu (konvertované z HSL na hex)
  dark: {
    background: '#020817', // hsl(222.2 84% 4.9%) - presná konverzia, tmavšia ako pôvodne
    foreground: '#f8fafc', // hsl(210 40% 98%)
    card: '#020817', // hsl(222.2 84% 4.9%)
    cardForeground: '#f8fafc', // hsl(210 40% 98%)
    primary: '#10b981', // hsl(142.1 70.6% 45.3%)
    primaryForeground: '#064e3b',
    secondary: '#1e293b', // hsl(217.2 32.6% 17.5%)
    secondaryForeground: '#f8fafc', // hsl(210 40% 98%)
    muted: '#1e293b', // hsl(217.2 32.6% 17.5%)
    mutedForeground: '#94a3b8', // hsl(215 20.2% 65.1%)
    accent: '#1e293b', // hsl(217.2 32.6% 17.5%)
    accentForeground: '#f8fafc', // hsl(210 40% 98%)
    destructive: '#991b1b', // hsl(0 62.8% 30.6%)
    destructiveForeground: '#f8fafc', // hsl(210 40% 98%)
    border: '#1e293b', // hsl(217.2 32.6% 17.5%)
    input: '#1e293b', // hsl(217.2 32.6% 17.5%)
    ring: '#059669',
  },
} as const;

// Spacing (podľa Tailwind: 4px = 1 unit)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

// Typography
// Používame systémové fonty (Inter je dostupný nativne na iOS/Android)
// Na webe použijeme fallback na web-safe fonty
export const typography = {
  fontFamily: {
    regular: 'System', // React Native použije systémový font, na webe sa automaticky použije web-safe font
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
} as const;

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

// Export default theme (dark mode ako default, lebo web má dark mode)
export const theme = {
  colors: colors.dark,
  spacing,
  typography,
  borderRadius,
  shadows,
} as const;

export type Theme = typeof theme;

