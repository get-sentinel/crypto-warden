import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

interface Props {
  size: number;
  color: string;
  /** Opacity at the very centre of the orb; it falls off to nothing at the rim. */
  intensity?: number;
}

// SVG gradient ids share one namespace per screen, so each orb needs its own.
let orbCounter = 0;

/**
 * Soft radial halo. React Native has no blur primitive that works on both
 * platforms without a native dependency, so the falloff is drawn as a radial
 * gradient instead — same look, no extra module.
 */
export default function GlowOrb({ size, color, intensity = 0.42 }: Props) {
  const gradientId = useMemo(() => `glow-orb-${orbCounter++}`, []);
  const radius = size / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={intensity} />
            <Stop offset="0.55" stopColor={color} stopOpacity={intensity * 0.35} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={radius} cy={radius} r={radius} fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}
