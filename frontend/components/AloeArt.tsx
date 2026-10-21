import { useId } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Line,
  Path,
  Stop,
} from 'react-native-svg';

import { Palette } from '@/constants/Colors';

const backAngles = [-64, -46, -28, -10, 10, 28, 46, 64];
const backHeights = [112, 146, 172, 192, 192, 172, 146, 112];
const backWidths = [29, 30, 28, 24, 24, 28, 30, 29];
const backCurves = [-22, -14, -8, -3, 3, 8, 14, 22];

function leafPath(height: number, width: number, curve: number) {
  const baseX = 110;
  const baseY = 205;
  const tipX = baseX + curve;
  const tipY = baseY - height;
  const shoulder = baseY - height * 0.38;

  return [
    `M ${baseX} ${baseY}`,
    `C ${baseX - width} ${baseY - height * 0.16}, ${baseX - width * 0.8 + curve * 0.4} ${shoulder}, ${tipX - width * 0.14} ${tipY + height * 0.05}`,
    `Q ${tipX} ${tipY - height * 0.018} ${tipX + width * 0.14} ${tipY + height * 0.05}`,
    `C ${baseX + width * 0.8 + curve * 0.4} ${shoulder}, ${baseX + width} ${baseY - height * 0.16}, ${baseX} ${baseY}`,
    'Z',
  ].join(' ');
}

function veinPath(height: number, curve: number) {
  const baseX = 110;
  const baseY = 205;
  const tipX = baseX + curve;
  const tipY = baseY - height;
  return [
    `M ${baseX} ${baseY - 4}`,
    `C ${baseX + curve * 0.08} ${baseY - height * 0.36}, ${tipX - curve * 0.08} ${tipY + height * 0.3}, ${tipX} ${tipY + height * 0.04}`,
  ].join(' ');
}

/** A small geometric aloe mark, built from three leaf blades. */
export function AloeMark({
  size = 26,
  color = Palette.ink,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      {[
        { deg: -30, h: 0.48, o: 0.7 },
        { deg: 0, h: 0.62, o: 1 },
        { deg: 30, h: 0.48, o: 0.7 },
      ].map((leaf) => (
        <View
          key={leaf.deg}
          style={{
            position: 'absolute',
            bottom: size * 0.2,
            width: size * 0.16,
            height: size * leaf.h,
            borderRadius: size,
            backgroundColor: color,
            opacity: leaf.o,
            transformOrigin: 'bottom center',
            transform: [{ rotate: `${leaf.deg}deg` }],
          }}
        />
      ))}
      <View
        style={{
          width: size * 0.58,
          height: 1,
          backgroundColor: color,
          opacity: 0.4,
          marginBottom: size * 0.12,
        }}
      />
    </View>
  );
}

/**
 * Botanical plate of an aloe rosette. Drawn as vector leaves rather than
 * stacked pills, so the silhouette stays sharp at every size.
 */
export function AloeRosette({
  height = 210,
  tone = 'paper',
}: {
  height?: number;
  tone?: 'paper' | 'ink';
}) {
  const onInk = tone === 'ink';
  const uid = `aloe-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const backGradient = `url(#${uid}-back)`;
  const frontGradient = `url(#${uid}-front)`;
  const vein = onInk ? 'rgba(241,236,224,0.24)' : 'rgba(241,236,224,0.2)';

  return (
    <Svg width={height * 0.92} height={height} viewBox="0 0 220 240">
      <Defs>
        <LinearGradient id={`${uid}-back`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={onInk ? '#5F7B58' : '#3B5539'} />
          <Stop offset="1" stopColor={onInk ? '#334B36' : '#243A28'} />
        </LinearGradient>
        <LinearGradient id={`${uid}-front`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={onInk ? '#A2B784' : '#7E9567'} />
          <Stop offset={onInk ? '0.5' : '0.55'} stopColor={onInk ? '#718E5C' : '#587750'} />
          <Stop offset="1" stopColor={onInk ? '#3E5A40' : '#34503A'} />
        </LinearGradient>
      </Defs>

      <Ellipse cx="110" cy="215" rx="52" ry="6" fill="#0F140F" opacity={onInk ? 0.35 : 0.16} />
      <Line x1="30" y1="212.5" x2="190" y2="212.5" stroke={vein} strokeWidth="1" opacity="0.6" />

      {backAngles.map((angle, index) => {
        const heightValue = backHeights[index];
        const widthValue = backWidths[index];
        const curveValue = backCurves[index];
        const front = index === 3 || index === 4;
        return (
          <G key={angle} transform={`rotate(${angle} 110 205)`}>
            <Path
              d={leafPath(heightValue, widthValue, curveValue)}
              fill={front ? frontGradient : backGradient}
              stroke={onInk ? 'rgba(241,236,224,0.10)' : 'rgba(22,26,20,0.16)'}
              strokeWidth="1"
              opacity={front ? 1 : 0.88}
            />
            <Path
              d={veinPath(heightValue, curveValue)}
              stroke={vein}
              strokeWidth="1"
              fill="none"
              opacity={front ? 0.8 : 0.5}
            />
          </G>
        );
      })}

      <G transform="rotate(0 110 205)">
        <Path
          d={leafPath(205, 27, -2)}
          fill={frontGradient}
          stroke={onInk ? 'rgba(241,236,224,0.12)' : 'rgba(22,26,20,0.18)'}
          strokeWidth="1"
        />
        <Path d={veinPath(205, -2)} stroke={vein} strokeWidth="1.2" fill="none" opacity="0.85" />
      </G>

      <Ellipse cx="110" cy="206" rx="6.5" ry="3.4" fill={onInk ? '#1C2E22' : Palette.mossDeep} />
    </Svg>
  );
}
