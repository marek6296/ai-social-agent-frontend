import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, DashboardCard } from '../components';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStaggeredAnimations } from '../hooks/useStaggeredAnimations';
import { ChatWidget } from '../components/ChatWidget';
import { Clipboard } from 'react-native';

type UserProfile = {
  id: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
};

export function MyBotScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Define cards array before hooks (but use fixed length for hook)
  const botManagementCardsLength = 5; // Fixed length for hook initialization

  // Initialize hook at the top level (before any conditional returns)
  const { getStyle: getCardStyle } = useStaggeredAnimations({
    itemCount: botManagementCardsLength,
    delayBetween: 60,
    duration: 450,
    startDelay: 250,
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setLoading(false);
      return;
    }

    const { id, email, user_metadata } = data.user;

    setUser({
      id,
      email: email ?? null,
      firstName: user_metadata?.firstName,
      lastName: user_metadata?.lastName,
    });

    setLoading(false);
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Načítavam tvojho bota…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

  const botManagementCards = [
    {
      title: 'Nastavenia chatbota',
      description: 'Uprav meno bota, firmu, popis a štýl komunikácie',
      icon: 'settings' as const,
      iconColor: '#10b981',
      iconBg: 'rgba(16, 185, 129, 0.1)',
      route: 'BotSettings',
    },
    {
      title: 'FAQ',
      description: 'Pridaj, uprav alebo vymaž otázky a odpovede pre bota',
      icon: 'message-square' as const,
      iconColor: '#06b6d4',
      iconBg: 'rgba(6, 182, 212, 0.1)',
      route: 'FAQ',
    },
    {
      title: 'Konverzácie',
      description: 'Prehľad všetkých konverzácií s tvojím chatbotom',
      icon: 'file-text' as const,
      iconColor: '#a855f7',
      iconBg: 'rgba(168, 85, 247, 0.1)',
      route: 'Conversations',
    },
    {
      title: 'Analytics',
      description: 'Štatistiky a metriky o používaní chatbota',
      icon: 'bar-chart-2' as const,
      iconColor: '#f59e0b',
      iconBg: 'rgba(245, 158, 11, 0.1)',
      route: 'Analytics',
    },
    {
      title: 'Leads',
      description: 'Kontakty zachytené cez lead form',
      icon: 'users' as const,
      iconColor: '#ec4899',
      iconBg: 'rgba(236, 72, 153, 0.1)',
      route: 'Leads',
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Môj bot</Text>
        </View>

        {/* Bot Management Cards - moved to top */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Spravuj svojho bota</Text>
          {botManagementCards.map((card, index) => (
            <DashboardCard
              key={index}
              title={card.title}
              description={card.description}
              icon={card.icon}
              iconColor={card.iconColor}
              iconBg={card.iconBg}
              onPress={() => navigation.navigate(card.route)}
              animatedStyle={getCardStyle(index)}
            />
          ))}
        </View>

        {/* Info card about test bot */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Feather name="info" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Testovací chatbot</Text>
              <Text style={styles.cardDescription}>
                Toto je testovacia verzia tvojho bota
              </Text>
            </View>
          </View>
          <Text style={styles.cardText}>
            Tu si vieš vyskúšať, ako bude tvoj AI chatbot odpovedať reálnym zákazníkom
            na tvojej webovej stránke. Chatbot používa tvoje nastavenia bota a firemné FAQ.
            Všetky zmeny v nastaveniach sa okamžite prejavia aj tu.
          </Text>
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Ako testovať:</Text>
            {[
              'Spýtaj sa na cenu, balíky alebo spoluprácu',
              'Over, či vie popísať tvoju firmu podľa nastavení',
              'Skús otázky z FAQ & firemných odpovedí',
              'Skús aj "blbé" otázky – mal by slušne priznať, čo nevie',
              'Otestuj formulár na zber kontaktov (Zanechaj kontakt)',
            ].map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Feather name="check" size={16} color={theme.colors.primary} style={styles.tipIcon} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Embed Code Section */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Feather name="code" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Embed kód pre tvoj web</Text>
              <Text style={styles.cardDescription}>
                Skopíruj kód a vlož ho na svoju webstránku
              </Text>
            </View>
          </View>
          <View style={styles.embedCodeContainer}>
            <Text style={styles.embedCode}>
              {`<script src="https://ai-social-agent-frontend.vercel.app/embed.js" data-bot-id="${user.id}"></script>`}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => {
                const embedCode = `<script src="https://ai-social-agent-frontend.vercel.app/embed.js" data-bot-id="${user.id}"></script>`;
                Clipboard.setString(embedCode);
                Alert.alert('Skopírované', 'Embed kód bol skopírovaný do schránky.');
              }}
            >
              <Feather name="copy" size={18} color={theme.colors.primaryForeground} />
              <Text style={styles.copyButtonText}>Kopírovať</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.embedHint}>
            Vlož tento kód pred uzatvárajúci tag {'</body>'} na tvojej webovej stránke
          </Text>
        </Card>
        </ScrollView>
      </SafeAreaView>
      {/* Test bot for MyBotScreen - user's own bot - outside SafeAreaView for proper positioning */}
      {user && <ChatWidget ownerUserId={user.id} />}
    </View>
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
  card: {
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  cardHeaderText: {
    flex: 1,
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
  cardText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.sm,
  },
  tipsContainer: {
    marginTop: theme.spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  tipIcon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  tipNumberText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  tipText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  tipsTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.cardForeground,
    marginBottom: theme.spacing.sm,
  },
  hintText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionContainer: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  embedCodeContainer: {
    backgroundColor: theme.colors.muted + '40',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  embedCode: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: 'monospace',
    color: theme.colors.foreground,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  copyButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primaryForeground,
  },
  embedHint: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
});
