import React from 'react';
import { StyleSheet, View, Text, TextInput, TextInputProps } from 'react-native';
import { theme } from '../theme';

interface TextareaProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, style, ...props }: TextareaProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={theme.colors.mutedForeground}
        multiline
        textAlignVertical="top"
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.foreground,
    minHeight: 120,
  },
  inputError: {
    borderColor: theme.colors.destructive,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.destructive,
    marginTop: theme.spacing.xs,
  },
});


