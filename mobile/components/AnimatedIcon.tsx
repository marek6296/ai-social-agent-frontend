import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AnimatedIconProps {
  name: keyof typeof Feather.glyphMap;
  size?: number;
  color: string;
  delay?: number;
  style?: ViewStyle;
  iconBg?: string;
}

export function AnimatedIcon({
  name,
  size = 24,
  color,
  delay = 0,
  style,
  iconBg,
}: AnimatedIconProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bounce in animation
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
    ]).start();

    // Remove rotation animation as it's not supported with useNativeDriver
  }, []);

  const animatedStyle = {
    transform: [
      { scale: scaleAnim },
    ],
  };

  if (iconBg) {
    return (
      <View style={style}>
        <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
          <View style={{ backgroundColor: iconBg, padding: 8, borderRadius: 8 }}>
            <Feather name={name} size={size} color={color} />
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Feather name={name} size={size} color={color} />
    </Animated.View>
  );
}
