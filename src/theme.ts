export const colors = {
  background: '#071B28',
  surface: '#0E2A39',
  surfaceRaised: '#153746',
  surfaceLight: '#1A4351',
  border: '#284D59',
  text: '#F8F9F5',
  muted: '#A5BCC4',
  subtle: '#6D8F9B',
  accent: '#C8ED7D',
  accentDark: '#183726',
  alert: '#F3C26D',
  error: '#F58D88',
  red: '#DC4B55',
  orange: '#EFB04B',
  silver: '#AAB9C3',
  blue: '#4D9AD4',
  yellow: '#F7D453',
  green: '#4DB78A',
  bus: '#94C9EF',
};

export const railColors: Record<string, string> = {
  RD: colors.red,
  OR: colors.orange,
  SV: colors.silver,
  BL: colors.blue,
  YL: colors.yellow,
  GR: colors.green,
};

export function routeColor(kind: 'rail' | 'bus', route: string) {
  return kind === 'bus' ? colors.bus : (railColors[route] ?? colors.muted);
}
