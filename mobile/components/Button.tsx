import React, { useRef } from 'react';
import { Animated, TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const textVariantStyle = textVariantStyles[variant];
  const textSizeStyle = textSizeStyles[size];

  const buttonStyle: ViewStyle[] = [
    styles.button,
    variantStyle,
    sizeStyle,
    (disabled || loading) && styles.buttonDisabled,
  ].filter(Boolean);
  
  const textStyle: TextStyle[] = [
    styles.text,
    textVariantStyle,
    textSizeStyle,
  ];

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.spring(pressAnim, {
          toValue: 0.9,
          useNativeDriver: true,
          tension: 400,
          friction: 8,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.spring(pressAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 400,
          friction: 8,
        }),
      ]).start();
    }
  };

  const animatedStyle = {
    transform: [
      { scale: scaleAnim },
    ],
    opacity: pressAnim,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      <Animated.View style={[buttonStyle, animatedStyle, style]}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
        ) : (
          <Text style={textStyle}>{title}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
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
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  md: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  lg: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
};

const textVariantStyles: Record<ButtonVariant, TextStyle> = {
  default: {
    color: theme.colors.primaryForeground,
  },
  secondary: {
    color: theme.colors.secondaryForeground,
  },
  destructive: {
    color: theme.colors.destructiveForeground,
  },
  outline: {
    color: theme.colors.foreground,
  },
};

const textSizeStyles: Record<ButtonSize, TextStyle> = {
  sm: {
    fontSize: theme.typography.fontSize.sm,
  },
  md: {
    fontSize: theme.typography.fontSize.base,
  },
  lg: {
    fontSize: theme.typography.fontSize.lg,
  },
};

