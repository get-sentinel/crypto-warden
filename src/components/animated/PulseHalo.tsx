import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useReduceMotion } from '../../utils/useReduceMotion';

interface Props {
  color: string;
  borderRadius: number;
  /** Peak opacity of the halo at the top of each breath. */
  maxOpacity?: number;
  cycleMs?: number;
}

/**
 * A slow halo that swells behind a call-to-action. Absolutely positioned, so it
 * expands past its parent's bounds without pushing any layout around — drop it
 * in as the first child of a relatively positioned wrapper.
 */
export default function PulseHalo({
  color,
  borderRadius,
  maxOpacity = 0.28,
  cycleMs = 2600,
}: Props) {
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: cycleMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: cycleMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [cycleMs, pulse, reduceMotion]);

  const animatedStyle = useMemo(
    () => ({
      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, maxOpacity] }),
      transform: [
        { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
      ],
    }),
    [maxOpacity, pulse],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: color, borderRadius },
        animatedStyle,
      ]}
    />
  );
}
