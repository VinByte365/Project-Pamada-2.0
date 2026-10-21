import { TextStyle } from 'react-native';

import { Palette } from '@/constants/Colors';

/**
 * Field Ledger type system.
 * Cabinet Grotesk carries the editorial voice, Satoshi the reading voice,
 * Space Mono the instrument and record-keeping voice.
 */
export const Type = {
  display: {
    fontFamily: 'CabinetGrotesk-Black',
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: -2.1,
    color: Palette.text,
  } as TextStyle,
  displaySmall: {
    fontFamily: 'CabinetGrotesk-Black',
    fontSize: 38,
    lineHeight: 41,
    letterSpacing: -1.5,
    color: Palette.text,
  } as TextStyle,
  title: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 27,
    lineHeight: 31,
    letterSpacing: -0.8,
    color: Palette.text,
  } as TextStyle,
  subtitle: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: Palette.text,
  } as TextStyle,
  body: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    lineHeight: 23,
    color: Palette.body,
  } as TextStyle,
  bodyStrong: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: Palette.text,
  } as TextStyle,
  label: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: Palette.text,
  } as TextStyle,
  labelSmall: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    lineHeight: 15,
    color: Palette.text,
  } as TextStyle,
  caption: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Palette.muted,
  } as TextStyle,
  meta: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: Palette.muted,
  } as TextStyle,
  mono: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 11,
    lineHeight: 17,
    letterSpacing: 0.1,
    color: Palette.text,
  } as TextStyle,
  monoLarge: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: Palette.text,
  } as TextStyle,
  numeral: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1.2,
    color: Palette.text,
  } as TextStyle,
  numeralLarge: {
    fontFamily: 'CabinetGrotesk-Black',
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: -2.6,
    color: Palette.text,
  } as TextStyle,
  quote: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.9,
    color: Palette.cream,
  } as TextStyle,
} as const;
