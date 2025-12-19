import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AnimatedIconWrapperProps {
  name: keyof typeof Feather.glyphMap;
  size?: number;
  color: string;
  delay?: number;
  style?: ViewStyle;
  iconBg?: string;
  pulse?: boolean;
  bounce?: boolean;
}

export function AnimatedIconWrapper({
  name,
  size = 24,
  color,
  delay = 0,
  style,
  iconBg,
  pulse = false,
  bounce = true,
}: AnimatedIconWrapperProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (bounce) {
      // Bounce in animation
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 200,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Smooth fade in
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }).start();
    }

    // Continuous pulse animation if enabled
    if (pulse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  // Simple scale style without multiply to avoid issues
  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
  };
  
  const pulseStyle = pulse ? {
    transform: [{ scale: pulseAnim }],
  } : {};

  if (iconBg) {
    return (
      <View style={style}>
        <Animated.View style={[animatedStyle, pulseStyle]}>
          <View style={{ 
            backgroundColor: iconBg, 
            padding: 10, 
            borderRadius: 12, 
            width: size + 20, 
            height: size + 20, 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Feather name={name} size={size} color={color} />
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View style={[style, animatedStyle, pulseStyle]}>
      <Feather name={name} size={size} color={color} />
    </Animated.View>
  );
}

