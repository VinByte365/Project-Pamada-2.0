import { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

const ease = Easing.bezier(0.32, 0.72, 0, 1);

export function Entry({ children, delay = 0, style }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600, easing: ease }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 160 }));
  }, [delay, opacity.value, translateY.value]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}