import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  icon?: React.ReactNode;
}

export function AnimatedButton({
  title,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  icon,
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
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
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    if (variant === 'default') {
      baseStyle.push(styles.default);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondary);
    } else if (variant === 'destructive') {
      baseStyle.push(styles.destructive);
    } else {
      baseStyle.push(styles.outline);
    }
    if (disabled) {
      baseStyle.push(styles.disabled);
    }
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    if (variant === 'default') {
      baseStyle.push(styles.defaultText);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryText);
    } else if (variant === 'destructive') {
      baseStyle.push(styles.destructiveText);
    } else {
      baseStyle.push(styles.outlineText);
    }
    return baseStyle;
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={getButtonStyle()}
      >
        {loading ? (
          <Animated.View style={styles.loadingContainer}>
            <Animated.View style={styles.loadingDot} />
            <Animated.View style={[styles.loadingDot, { animationDelay: 150 }]} />
            <Animated.View style={[styles.loadingDot, { animationDelay: 300 }]} />
          </Animated.View>
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={getTextStyle()}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sm: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  md: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  lg: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  default: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  destructive: {
    backgroundColor: theme.colors.destructive,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: theme.typography.fontFamily.medium,
    fontWeight: '600',
  },
  smText: {
    fontSize: theme.typography.fontSize.sm,
  },
  mdText: {
    fontSize: theme.typography.fontSize.base,
  },
  lgText: {
    fontSize: theme.typography.fontSize.lg,
  },
  defaultText: {
    color: theme.colors.primaryForeground,
  },
  secondaryText: {
    color: theme.colors.secondaryForeground,
  },
  destructiveText: {
    color: theme.colors.destructiveForeground,
  },
  outlineText: {
    color: theme.colors.foreground,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: theme.spacing.xs,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primaryForeground,
  },
});

