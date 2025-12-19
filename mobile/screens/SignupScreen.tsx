import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Input } from '../components';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export function SignupScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Chyba', 'Prosím, vyplň všetky polia');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Chyba', 'Heslá sa nezhodujú');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Chyba', 'Heslo musí mať aspoň 8 znakov');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert('Chyba', error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        Alert.alert(
          'Úspech',
          'Účet bol vytvorený! Skontroluj svoj email pre potvrdenie.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (err: any) {
      Alert.alert('Chyba', err.message || 'Nastala chyba pri registrácii');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>AI</Text>
            </View>
            <Text style={styles.title}>Vytvoriť účet</Text>
            <Text style={styles.subtitle}>
              Zaregistruj sa a začni používať AI Social Agent
            </Text>
          </View>

          <Card style={styles.card}>
            <Input
              label="Email"
              placeholder="ty@firma.sk"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />

            <Input
              label="Heslo"
              placeholder="Min. 8 znakov"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <Input
              label="Potvrď heslo"
              placeholder="Zopakuj heslo"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <Button
              title={loading ? "Vytváram..." : "Vytvoriť účet"}
              onPress={handleSignup}
              variant="default"
              size="lg"
              loading={loading}
              style={styles.button}
            />

            <Button
              title="Už mám účet"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              size="md"
              style={styles.button}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  logo: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primaryForeground,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  card: {
    marginTop: theme.spacing.lg,
  },
  button: {
    marginTop: theme.spacing.md,
  },
});


