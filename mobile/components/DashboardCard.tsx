import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { theme } from '../theme';
import { Feather } from '@expo/vector-icons';
import { AnimatedIconWrapper } from './AnimatedIconWrapper';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
  delay?: number;
  animatedStyle?: any;
}

export function DashboardCard({
  title,
  description,
  icon,
  iconColor,
  iconBg,
  onPress,
  delay = 0,
  animatedStyle: externalAnimatedStyle,
}: DashboardCardProps) {
  const pressScaleAnim = useRef(new Animated.Value(1)).current;
  const pressOpacityAnim = useRef(new Animated.Value(1)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;

  // Use external animated style if provided (from staggered animations), otherwise create own
  const internalFadeAnim = useRef(new Animated.Value(0)).current;
  const internalSlideAnim = useRef(new Animated.Value(30)).current;
  const internalScaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!externalAnimatedStyle) {
      // Card entrance animation - smooth and premium
      Animated.parallel([
        Animated.timing(internalFadeAnim, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(internalSlideAnim, {
          toValue: 0,
          delay,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(internalScaleAnim, {
          toValue: 1,
          delay,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(pressScaleAnim, {
        toValue: 0.93,
        tension: 600,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(pressOpacityAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1.2,
        tension: 400,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(pressScaleAnim, {
        toValue: 1,
        tension: 400,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(pressOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        tension: 400,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Use external style if provided, otherwise use internal animations
  const cardAnimatedStyle = externalAnimatedStyle || {
    opacity: internalFadeAnim,
    transform: [
      { translateY: internalSlideAnim },
      { scale: internalScaleAnim },
    ],
  };

  // Combine transforms properly
  const combinedTransforms = [
    ...(cardAnimatedStyle.transform || []),
    { scale: pressScaleAnim },
  ];

  // Combine opacity animations
  const combinedOpacity = cardAnimatedStyle.opacity 
    ? Animated.multiply(cardAnimatedStyle.opacity, pressOpacityAnim)
    : pressOpacityAnim;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View 
        style={[
          styles.card, 
          {
            opacity: combinedOpacity,
            transform: combinedTransforms,
          }
        ]}
      >
        <View style={styles.contentRow}>
          <Animated.View style={[styles.iconWrapper, { transform: [{ scale: iconScaleAnim }] }]}>
            <View style={styles.iconContainer}>
              <AnimatedIconWrapper
                name={icon}
                size={24}
                color={iconColor}
                iconBg={iconBg}
                delay={delay + 100}
                bounce={true}
              />
            </View>
          </Animated.View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
          <View style={styles.arrowContainer}>
            <AnimatedIconWrapper
              name="chevron-right"
              size={20}
              color={theme.colors.primary}
              delay={delay + 150}
              pulse={false}
              bounce={false}
            />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.cardForeground,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  arrowContainer: {
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
    paddingTop: 2,
  },
});

