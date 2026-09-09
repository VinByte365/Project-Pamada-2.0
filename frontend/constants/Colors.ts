const oled = '#050505';
const phosphor = '#F5F5F7';

export const Palette = {
  background: oled, // deepest OLED black
  canvas: '#08090D', // lifted well for vignettes
  surface: 'rgba(16,18,26,0.6)', // vantablack glass core
  shell: 'rgba(255,255,255,0.04)', // machined tray / outer shell
  border: 'rgba(255,255,255,0.08)', // hairline dividers
  hairline: 'rgba(255,255,255,0.14)', // structural rim
  accent: '#5AE2A1', // emerald primary
  accentDeep: '#10B981',
  accentAlt: '#8B5CF6', // violet (mesh glow partner)
  accentSoft: 'rgba(90,226,161,0.12)',
  accentAltSoft: 'rgba(139,92,246,0.14)',
  accentContrast: oled, // ink on emerald fills
  text: phosphor,
  body: 'rgba(235,235,245,0.74)',
  muted: 'rgba(235,235,245,0.5)',
  dim: 'rgba(235,235,245,0.28)',
  fine: 'rgba(235,235,245,0.14)',
  glowEmerald: 'rgba(90,226,161,0.22)',
  glowViolet: 'rgba(139,92,246,0.20)',
  warn: '#F87171',
} as const;

export default {
  light: {
    text: '#121212',
    background: '#F4F4F0',
    tint: '#10B981',
    tabIconDefault: '#A9A093',
    tabIconSelected: '#10B981',
    cardShell: '#EAE8E3',
    cardCore: '#FFFFFF',
    cardBorder: 'rgba(18,18,18,0.12)',
    hairline: 'rgba(18,18,18,0.22)',
    mutedText: 'rgba(18,18,18,0.55)',
    bodyText: 'rgba(18,18,18,0.8)',
  },
  dark: {
    text: phosphor,
    background: oled,
    tint: '#5AE2A1',
    tabIconDefault: 'rgba(235,235,245,0.28)',
    tabIconSelected: '#5AE2A1',
    cardShell: 'rgba(255,255,255,0.04)',
    cardCore: 'rgba(16,18,26,0.6)',
    cardBorder: 'rgba(255,255,255,0.08)',
    hairline: 'rgba(255,255,255,0.14)',
    mutedText: 'rgba(235,235,245,0.5)',
    bodyText: 'rgba(235,235,245,0.74)',
  },
};