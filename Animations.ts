import {Animated, Easing} from 'react-native';

export const fadeIn = (
  initialValue: Animated.Value,
  value: number,
  duration: number,
  useNativeDriver?: boolean,
) => {
  Animated.timing(initialValue, {
    useNativeDriver: useNativeDriver ?? true,
    toValue: value,
    duration: duration,
    easing: Easing.in(Easing.exp),
  } as Animated.TimingAnimationConfig).start();
};
