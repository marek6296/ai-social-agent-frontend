import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Input, Textarea, Switch, Picker, Button } from '../components';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

type ToneType = 'friendly' | 'formal' | 'casual';
type WidgetPosition = 'left' | 'right';

export function BotSettingsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [botName, setBotName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState<ToneType>('friendly');
  const [captureLeadsEnabled, setCaptureLeadsEnabled] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState<WidgetPosition>('right');
  
  // Pokročilé widget nastavenia
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState('#10b981');
  const [widgetBackgroundColor, setWidgetBackgroundColor] = useState('#020817');
  const [widgetWelcomeMessage, setWidgetWelcomeMessage] = useState('');
  const [widgetLogoUrl, setWidgetLogoUrl] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        navigation.replace('Auth');
        return;
      }

      setUser(userData.user);

      const { data: settings, error: settingsError } = await supabase
        .from('bot_settings')
        .select('id, company_name, bot_name, description, tone, show_lead_form_enabled, widget_position, widget_primary_color, widget_background_color, widget_welcome_message, widget_logo_url')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (settingsError) {
        console.warn('Error loading bot settings:', settingsError);
        setError('Nepodarilo sa načítať nastavenia bota.');
      }

      if (settings) {
        setSettingsId(settings.id);
        setCompanyName(settings.company_name ?? '');
        setBotName(settings.bot_name ?? '');
        setDescription(settings.description ?? '');
        setTone((settings.tone as ToneType) || 'friendly');
        setCaptureLeadsEnabled(!!settings.show_lead_form_enabled);
        setWidgetPosition((settings.widget_position as WidgetPosition) || 'right');
        setWidgetPrimaryColor(settings.widget_primary_color || '#10b981');
        setWidgetBackgroundColor(settings.widget_background_color || '#020817');
        setWidgetWelcomeMessage(settings.widget_welcome_message || '');
        setWidgetLogoUrl(settings.widget_logo_url || '');
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const trimmedDescription = description ? description.slice(0, 450).trim() : null;
      
      const payload: any = {
        user_id: user.id,
        company_name: companyName || null,
        bot_name: botName || null,
        description: trimmedDescription,
        tone,
        show_lead_form_enabled: captureLeadsEnabled,
        widget_position: widgetPosition,
        widget_primary_color: widgetPrimaryColor && widgetPrimaryColor.trim() !== '#10b981' ? widgetPrimaryColor.trim() : null,
        widget_background_color: widgetBackgroundColor && widgetBackgroundColor.trim() !== '#020817' ? widgetBackgroundColor.trim() : null,
        widget_welcome_message: widgetWelcomeMessage && widgetWelcomeMessage.trim() ? widgetWelcomeMessage.trim() : null,
        widget_logo_url: widgetLogoUrl && widgetLogoUrl.trim() ? widgetLogoUrl.trim() : null,
      };

      if (settingsId) {
        const { error: updateError } = await supabase
          .from('bot_settings')
          .update(payload)
          .eq('id', settingsId);

        if (updateError) {
          console.error('Update error:', updateError);
          setError('Nepodarilo sa uložiť nastavenia: ' + updateError.message);
        } else {
          setSuccess('Nastavenia boli úspešne uložené.');
          Alert.alert('Úspech', 'Nastavenia boli úspešne uložené.');
        }
      } else {
        const { error: insertError } = await supabase
          .from('bot_settings')
          .insert(payload);

        if (insertError) {
          console.error('Insert error:', insertError);
          setError('Nepodarilo sa uložiť nastavenia: ' + insertError.message);
        } else {
          setSuccess('Nastavenia boli úspešne uložené.');
          Alert.alert('Úspech', 'Nastavenia boli úspešne uložené.');
        }
      }
    } catch (err: any) {
      console.error('Bot settings save exception:', err);
      setError('Nastala neočakávaná chyba pri ukladaní: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>Nastavenia chatbota</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Načítavam nastavenia…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>Nastavenia chatbota</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Späť na Dashboard" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Nastavenia chatbota</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {success && (
          <Card style={styles.successCard}>
            <Text style={styles.successText}>{success}</Text>
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Základné informácie</Text>
          <Text style={styles.cardDescription}>
            Nastav firmu, meno bota a tón komunikácie. Tieto informácie bot používa ako základ pri každej odpovedi.
          </Text>

          <Input
            label="Názov firmy"
            placeholder="Napr. Detox"
            value={companyName}
            onChangeText={setCompanyName}
            containerStyle={styles.inputSpacing}
          />

          <Input
            label="Meno bota"
            placeholder="Napr. Jano, Vlado..."
            value={botName}
            onChangeText={setBotName}
            containerStyle={styles.inputSpacing}
          />

          <Textarea
            label="Popis bota / firmy"
            placeholder='Napr. "Si AI chatbot s názvom Jano pre firmu Detox."'
            value={description}
            onChangeText={setDescription}
            maxLength={450}
            containerStyle={styles.inputSpacing}
            style={{ minHeight: 120 }}
          />
          <Text style={styles.charCount}>
            Max. 450 znakov ({description.length}/450)
          </Text>

          <Text style={styles.label}>Tón komunikácie</Text>
          <Picker
            selectedValue={tone}
            onValueChange={(itemValue) => setTone(itemValue as ToneType)}
            items={[
              { label: 'Prívetivý', value: 'friendly' },
              { label: 'Formálny', value: 'formal' },
              { label: 'Uvoľnený', value: 'casual' },
            ]}
            containerStyle={styles.inputSpacing}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Widget nastavenia</Text>
          <Text style={styles.cardDescription}>
            Prispôsob vzhľad a správanie chatovacieho widgetu na tvojej stránke.
          </Text>

          <Switch
            label="Zachytenie leadov"
            checked={captureLeadsEnabled}
            onCheckedChange={setCaptureLeadsEnabled}
            containerStyle={styles.inputSpacing}
          />

          <Text style={styles.label}>Pozícia widgetu</Text>
          <Picker
            selectedValue={widgetPosition}
            onValueChange={(itemValue) => setWidgetPosition(itemValue as WidgetPosition)}
            items={[
              { label: 'Vpravo', value: 'right' },
              { label: 'Vľavo', value: 'left' },
            ]}
            containerStyle={styles.inputSpacing}
          />

          <Input
            label="Primárna farba (#hex)"
            placeholder="#10b981"
            value={widgetPrimaryColor}
            onChangeText={setWidgetPrimaryColor}
            containerStyle={styles.inputSpacing}
          />

          <Input
            label="Farba pozadia (#hex)"
            placeholder="#020817"
            value={widgetBackgroundColor}
            onChangeText={setWidgetBackgroundColor}
            containerStyle={styles.inputSpacing}
          />

          <Input
            label="Uvítacia správa"
            placeholder="Ahoj! Ako ti môžem pomôcť?"
            value={widgetWelcomeMessage}
            onChangeText={setWidgetWelcomeMessage}
            containerStyle={styles.inputSpacing}
          />

          <Input
            label="URL loga"
            placeholder="https://tvoje-logo.com/logo.png"
            value={widgetLogoUrl}
            onChangeText={setWidgetLogoUrl}
            keyboardType="url"
            autoCapitalize="none"
            containerStyle={styles.inputSpacing}
          />
        </Card>

        <Button
          title={saving ? 'Ukladám...' : 'Uložiť nastavenia'}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          size="lg"
          style={styles.saveButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.foreground,
  },
  placeholder: {
    width: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  errorCard: {
    backgroundColor: theme.colors.destructive + '20',
    borderColor: theme.colors.destructive,
    marginBottom: theme.spacing.md,
  },
  successCard: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  successText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.cardForeground,
    marginBottom: theme.spacing.xs,
  },
  cardDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.md,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  inputSpacing: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  charCount: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  saveButton: {
    marginTop: theme.spacing.md,
  },
});
