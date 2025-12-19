import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Animated } from 'react-native';
import { theme } from '../theme';
import { Feather } from '@expo/vector-icons';

interface AnimatedDashboardCardProps {
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
  delay?: number;
}

export function AnimatedDashboardCard({
  title,
  description,
  icon,
  iconColor,
  iconBg,
  onPress,
  delay = 0,
}: AnimatedDashboardCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        easing: Animated.Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.iconBackground,
              { backgroundColor: iconBg },
              { transform: [{ scale: iconScaleAnim }] },
            ]}
          >
            <Feather name={icon} size={24} color={iconColor} />
          </Animated.View>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.arrowContainer}>
          <Feather name="chevron-right" size={20} color={theme.colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
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
    ...theme.shadows.md,
  },
  iconContainer: {
    marginBottom: theme.spacing.md,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: theme.spacing.sm,
  },
  arrowContainer: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.xs,
  },
});

