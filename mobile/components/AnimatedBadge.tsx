import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, ViewStyle, TextStyle } from 'react-native';

interface AnimatedBadgeProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
}

export function AnimatedBadge({ children, style, delay = 0 }: AnimatedBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  const animatedStyle = {
    transform: [
      { scale: scaleAnim },
      { rotate },
    ],
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}


