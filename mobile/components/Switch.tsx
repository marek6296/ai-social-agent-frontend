import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ value, onValueChange, label, disabled = false }: SwitchProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.switch,
          value && styles.switchOn,
          disabled && styles.switchDisabled,
        ]}
        onPress={() => !disabled && onValueChange(!value)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.foreground,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchOn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  switchDisabled: {
    opacity: 0.5,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    alignSelf: 'flex-start',
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
});


