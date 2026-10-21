const paper = '#F1ECE0';
const paperLift = '#F8F4EA';
const ink = '#161A14';

export const Palette = {
  // Ground
  background: paper,
  canvas: '#E9E3D5',
  surface: paperLift,
  surfaceDeep: '#EBE5D7',
  shell: 'rgba(22,26,20,0.05)',
  shellDeep: 'rgba(22,26,20,0.08)',

  // Structure
  border: 'rgba(22,26,20,0.14)',
  hairline: 'rgba(22,26,20,0.28)',
  line: 'rgba(22,26,20,0.08)',

  // Ink
  text: ink,
  body: 'rgba(22,26,20,0.72)',
  muted: 'rgba(22,26,20,0.54)',
  dim: 'rgba(22,26,20,0.34)',
  fine: 'rgba(22,26,20,0.2)',

  // Reverse (on ink)
  ink,
  inkSoft: '#232820',
  inkLine: 'rgba(241,236,224,0.18)',
  cream: paper,
  creamLift: paperLift,
  creamMuted: 'rgba(241,236,224,0.64)',
  creamDim: 'rgba(241,236,224,0.4)',

  // Field accents
  accent: '#C4562D',
  accentDeep: '#9C3F20',
  accentSoft: 'rgba(196,86,45,0.10)',
  accentContrast: paperLift,
  moss: '#2E4633',
  mossDeep: '#1C2E22',
  mossSoft: 'rgba(46,70,51,0.10)',
  sage: '#7C8F6B',
  gold: '#A9823F',
  goldSoft: 'rgba(169,130,63,0.14)',
  warn: '#A23A2A',
  white: '#FFFDF8',
} as const;

export default {
  light: {
    text: ink,
    background: paper,
    tint: '#2E4633',
    tabIconDefault: 'rgba(22,26,20,0.4)',
    tabIconSelected: ink,
    cardShell: 'rgba(22,26,20,0.05)',
    cardCore: paperLift,
    cardBorder: 'rgba(22,26,20,0.14)',
    hairline: 'rgba(22,26,20,0.28)',
    mutedText: 'rgba(22,26,20,0.54)',
    bodyText: 'rgba(22,26,20,0.72)',
  },
  dark: {
    text: ink,
    background: paper,
    tint: '#2E4633',
    tabIconDefault: 'rgba(22,26,20,0.4)',
    tabIconSelected: ink,
    cardShell: 'rgba(22,26,20,0.05)',
    cardCore: paperLift,
    cardBorder: 'rgba(22,26,20,0.14)',
    hairline: 'rgba(22,26,20,0.28)',
    mutedText: 'rgba(22,26,20,0.54)',
    bodyText: 'rgba(22,26,20,0.72)',
  },
};
