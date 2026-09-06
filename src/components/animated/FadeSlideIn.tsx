import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { useReduceMotion } from '../../utils/useReduceMotion';

interface Props {
  children: React.ReactNode;
  /** Milliseconds to wait before starting — stagger siblings by bumping this. */
  delay?: number;
  /** How far below its resting position the content starts, in points. */
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Mount entrance: fades in while drifting up into place. One shared curve
 * (ease-out cubic) keeps every staggered element on Home feeling like a single
 * movement rather than a pile of unrelated tweens.
 */
export default function FadeSlideIn({
  children,
  delay = 0,
  distance = 14,
  duration = 420,
  style,
}: Props) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;

  // Memoised so Home's several boot-time re-renders reuse one animated node
  // graph instead of rebuilding an interpolation per render.
  const animatedStyle = useMemo(
    () => ({
      opacity: progress,
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [distance, 0],
          }),
        },
      ],
    }),
    [distance, progress],
  );

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [delay, duration, progress, reduceMotion]);

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
