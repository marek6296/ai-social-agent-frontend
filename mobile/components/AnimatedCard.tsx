import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export function AnimatedCard({
  children,
  delay = 0,
  onPress,
  style,
  disabled = false,
}: AnimatedCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        tension: 100,
        friction: 15,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 100,
        friction: 15,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    if (!disabled && onPress) {
      Animated.spring(pressAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && onPress) {
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      { translateY: slideAnim },
      { scale: Animated.multiply(scaleAnim, pressAnim) },
    ],
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <Animated.View style={[animatedStyle, style]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
