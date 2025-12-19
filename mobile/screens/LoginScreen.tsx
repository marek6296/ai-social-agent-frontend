import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Input } from '../components';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 15,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        delay: 100,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Chyba', 'Prosím, vyplň všetky polia');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Chyba', error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        navigation.replace('Main');
      }
    } catch (err: any) {
      Alert.alert('Chyba', err.message || 'Nastala chyba pri prihlásení');
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
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <Animated.View 
              style={[
                styles.logoContainer,
                {
                  transform: [{ scale: logoScaleAnim }],
                }
              ]}
            >
              <Text style={styles.logo}>AI</Text>
            </Animated.View>
            <Text style={styles.title}>Prihlásiť sa</Text>
            <Text style={styles.subtitle}>
              Prihlás sa do svojho účtu a spravuj svoj firemný AI chatbot
            </Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
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
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <Button
              title={loading ? "Prihlasujem..." : "Prihlásiť sa"}
              onPress={handleLogin}
              variant="default"
              size="lg"
              loading={loading}
              style={styles.button}
            />

            <Button
              title="Vytvoriť účet"
              onPress={() => navigation.navigate('Signup')}
              variant="outline"
              size="md"
              style={styles.button}
            />
          </Card>
          </Animated.View>
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

