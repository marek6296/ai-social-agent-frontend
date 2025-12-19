import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';

interface AnimatedTabIconProps {
  name: keyof typeof Feather.glyphMap;
  size?: number;
  color: string;
  focused: boolean;
}

export function AnimatedTabIcon({ name, size = 24, color, focused }: AnimatedTabIconProps) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.15 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.6)).current;
  const indicatorAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.15 : 1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(indicatorAnim, {
        toValue: focused ? 1 : 0,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        <Feather name={name} size={size} color={color} />
      </Animated.View>
      {/* Active indicator dot */}
      <Animated.View
        style={[
          styles.indicator,
          {
            opacity: indicatorAnim,
            transform: [
              {
                scale: indicatorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
});

