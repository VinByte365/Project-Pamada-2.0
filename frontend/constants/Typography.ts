import { TextStyle } from 'react-native';

import { Palette } from '@/constants/Colors';

export const Type = {
  display: {
    fontFamily: 'CabinetGrotesk-Black',
    fontSize: 48,
    lineHeight: 50,
    letterSpacing: -1.4,
    color: Palette.text,
  } as TextStyle,
  displaySmall: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.9,
    color: Palette.text,
  } as TextStyle,
  title: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: Palette.text,
  } as TextStyle,
  body: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    lineHeight: 23,
    color: Palette.body,
  } as TextStyle,
  caption: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: Palette.muted,
  } as TextStyle,
  label: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: Palette.text,
  } as TextStyle,
  mono: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.4,
    color: Palette.text,
  } as TextStyle,
} as const;