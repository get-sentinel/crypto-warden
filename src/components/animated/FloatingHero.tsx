import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import GlowOrb from './GlowOrb';
import { useReduceMotion } from '../../utils/useReduceMotion';

interface Props {
  source: ImageSourcePropType;
  glowColor: string;
  glowSize?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

const FLOAT_DISTANCE = 9;
const FLOAT_HALF_CYCLE_MS = 2200;
const PULSE_HALF_CYCLE_MS = 2900;

/**
 * Empty-state artwork: springs in on mount, then drifts on a slow loop above a
 * halo that breathes on a deliberately different period, so the two never beat
 * in lockstep and the whole thing reads as ambient rather than mechanical.
 */
export default function FloatingHero({
  source,
  glowColor,
  glowSize = 320,
  style,
  imageStyle,
}: Props) {
  const reduceMotion = useReduceMotion();
  const entrance = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      entrance.setValue(1);
      float.setValue(0);
      pulse.setValue(0);
      return;
    }

    const breathe = (value: Animated.Value, halfCycleMs: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: halfCycleMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: halfCycleMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

    const floatLoop = breathe(float, FLOAT_HALF_CYCLE_MS);
    const pulseLoop = breathe(pulse, PULSE_HALF_CYCLE_MS);

    const entranceSpring = Animated.spring(entrance, {
      toValue: 1,
      friction: 7,
      tension: 42,
      useNativeDriver: true,
    });

    // The ambient loops only take over once the entrance has settled, otherwise
    // the two transforms fight over the same frames and the pop looks mushy.
    entranceSpring.start(({ finished }) => {
      if (!finished) return;
      floatLoop.start();
      pulseLoop.start();
    });

    return () => {
      entranceSpring.stop();
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [entrance, float, pulse, reduceMotion]);

  // Built once per instance rather than per render — these drive long-running
  // loops, so there is no reason to hand the driver a fresh graph each time.
  const glowStyle = useMemo(
    () => ({
      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
      transform: [
        { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] }) },
      ],
    }),
    [pulse],
  );

  const imageAnimatedStyle = useMemo(
    () => ({
      transform: [
        { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -FLOAT_DISTANCE] }) },
        { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
      ],
    }),
    [entrance, float],
  );

  return (
    <Animated.View style={[styles.container, style, { opacity: entrance }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { width: glowSize, height: glowSize }, glowStyle]}
      >
        <GlowOrb size={glowSize} color={glowColor} />
      </Animated.View>

      <Animated.Image
        source={source}
        resizeMode="contain"
        style={[imageStyle, imageAnimatedStyle]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
});
