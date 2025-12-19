import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Input, Button } from '../components';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';
import { Clipboard } from 'react-native';

type UserProfile = {
  id: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
};

export function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    setError(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError('Musíš byť prihlásený.');
      setLoading(false);
      return;
    }

    const { id, email, user_metadata } = userData.user;

    setUser({
      id,
      email: email ?? null,
      firstName: user_metadata?.firstName,
      lastName: user_metadata?.lastName,
    });

    setFirstName(user_metadata?.firstName || '');
    setLastName(user_metadata?.lastName || '');
    setEmail(email || '');

    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
      });

      if (updateError) {
        setError('Nepodarilo sa aktualizovať profil: ' + updateError.message);
      } else {
        setSuccess('Profil bol úspešne aktualizovaný.');
        setUser({
          ...user,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError('Nastala neočakávaná chyba.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (newPassword.length < 8) {
      Alert.alert('Chyba', 'Nové heslo musí mať aspoň 8 znakov.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Chyba', 'Nové heslá sa nezhodujú.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Chyba', 'Aktuálne heslo je nesprávne.');
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError('Nepodarilo sa zmeniť heslo: ' + updateError.message);
      } else {
        setSuccess('Heslo bolo úspešne zmenené.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error('Password change error:', err);
      setError('Nastala neočakávaná chyba.');
    } finally {
      setSaving(false);
    }
  };

  const generateApiKey = async () => {
    if (!user) return;

    setApiKeyLoading(true);
    setError(null);

    try {
      const newApiKey = `ai_${user.id.slice(0, 8)}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setApiKey(newApiKey);
      setSuccess('API kľúč bol vygenerovaný. Skopíruj si ho, lebo sa už nezobrazí!');
    } catch (err) {
      console.error('API key generation error:', err);
      setError('Nepodarilo sa vygenerovať API kľúč.');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const copyApiKey = () => {
    if (apiKey) {
      Clipboard.setString(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Načítavam nastavenia…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nastavenia</Text>
        </View>

        {error && (
          <Card style={styles.errorCard}>
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={20} color={theme.colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </Card>
        )}

        {success && (
          <Card style={styles.successCard}>
            <View style={styles.successContainer}>
              <Feather name="check-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.successText}>{success}</Text>
            </View>
          </Card>
        )}

        {/* Profile */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Feather name="user" size={20} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Profil</Text>
              <Text style={styles.cardDescription}>Aktualizuj svoje osobné informácie</Text>
            </View>
          </View>

          <Input
            label="Meno"
            placeholder="Tvoje meno"
            value={firstName}
            onChangeText={setFirstName}
            containerStyle={styles.inputSpacing}
          />

          <Input
            label="Priezvisko"
            placeholder="Tvoje priezvisko"
            value={lastName}
            onChangeText={setLastName}
            containerStyle={styles.inputSpacing}
          />

          <Input
            label="Email"
            placeholder="email@example.com"
            value={email}
            editable={false}
            containerStyle={styles.inputSpacing}
          />
          <Text style={styles.hintText}>
            Email sa nedá zmeniť. Kontaktuj podporu, ak potrebuješ zmeniť email.
          </Text>

          <Button
            title={saving ? 'Ukladám...' : 'Uložiť zmeny'}
            onPress={handleUpdateProfile}
            loading={saving}
            disabled={saving}
            style={styles.button}
          />
        </Card>

        {/* Password */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Feather name="lock" size={20} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Zmena hesla</Text>
              <Text style={styles.cardDescription}>Zmeň svoje heslo pre lepšiu bezpečnosť</Text>
            </View>
          </View>

          <Input
            label="Aktuálne heslo"
            placeholder="••••••••"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            containerStyle={styles.inputSpacing}
          />

          <Input
            label="Nové heslo"
            placeholder="••••••••"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            containerStyle={styles.inputSpacing}
          />
          <Text style={styles.hintText}>Heslo musí mať aspoň 8 znakov.</Text>

          <Input
            label="Potvrď nové heslo"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            containerStyle={styles.inputSpacing}
          />

          <Button
            title={saving ? 'Mením heslo...' : 'Zmeniť heslo'}
            onPress={handleChangePassword}
            loading={saving}
            disabled={saving}
            style={styles.button}
          />
        </Card>

        {/* API Key */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Feather name="key" size={20} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>API kľúč</Text>
              <Text style={styles.cardDescription}>Použi API kľúč pre programový prístup</Text>
            </View>
          </View>

          {apiKey && (
            <View style={styles.apiKeyContainer}>
              <Text style={styles.apiKeyText} selectable>
                {apiKey}
              </Text>
              <Button
                title={copied ? 'Skopírované!' : 'Skopírovať'}
                onPress={copyApiKey}
                variant="outline"
                size="sm"
              />
            </View>
          )}

          <Button
            title={apiKeyLoading ? 'Generujem...' : apiKey ? 'Vygenerovať nový kľúč' : 'Vygenerovať API kľúč'}
            onPress={generateApiKey}
            loading={apiKeyLoading}
            disabled={apiKeyLoading}
            variant={apiKey ? 'outline' : 'default'}
            style={styles.button}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  header: {
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize['4xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.foreground,
  },
  errorCard: {
    backgroundColor: theme.colors.destructive + '20',
    borderColor: theme.colors.destructive,
    marginBottom: theme.spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  errorText: {
    flex: 1,
    color: theme.colors.destructive,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },
  successCard: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  successText: {
    flex: 1,
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.cardForeground,
  },
  cardDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs / 2,
  },
  inputSpacing: {
    marginBottom: theme.spacing.md,
  },
  hintText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.sm,
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.muted + '40',
    borderRadius: theme.borderRadius.md,
  },
  apiKeyText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.foreground,
  },
});
