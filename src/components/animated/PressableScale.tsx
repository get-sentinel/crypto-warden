import React, { useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useReduceMotion } from '../../utils/useReduceMotion';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  /** Visual style for the pressed surface — lives on the animated child. */
  style?: StyleProp<ViewStyle>;
  /** Resting → pressed scale. Smaller surfaces want a shallower dip. */
  scaleTo?: number;
}

/**
 * Touch target that springs inward on press and settles back on release —
 * the tactile counterpart to TouchableOpacity's fade.
 */
export default function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const springTo = useCallback(
    (toValue: number) => {
      if (reduceMotion) return;
      Animated.spring(scale, {
        toValue,
        speed: 40,
        bounciness: 4,
        useNativeDriver: true,
      }).start();
    },
    [reduceMotion, scale],
  );

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      springTo(scaleTo);
      onPressIn?.(event);
    },
    [onPressIn, scaleTo, springTo],
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      springTo(1);
      onPressOut?.(event);
    },
    [onPressOut, springTo],
  );

  const animatedStyle = useMemo(() => ({ transform: [{ scale }] }), [scale]);

  return (
    <Pressable
      accessibilityRole="button"
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
