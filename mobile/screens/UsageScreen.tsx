import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

type UsageStats = {
  currentMonth: number;
  limit: number;
  percentage: number;
  daysRemaining: number;
  avgPerDay: number;
  projectedEndOfMonth: number;
};

const PLAN_LIMITS: Record<string, number> = {
  starter: 1000,
  pro: 10000,
  agency: 999999,
  unlimited: 999999,
};

export function UsageScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>('starter');

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    setLoading(true);
    setError(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError('Musíš byť prihlásený.');
      setLoading(false);
      return;
    }

    const userId = userData.user.id;

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ai-social-agent-frontend.vercel.app';
      const apiResponse = await fetch(`${apiUrl}/api/user/plan?userId=${encodeURIComponent(userId)}`);
      
      let userPlan = 'starter';
      let creditsUsed = 0;
      let createdAt: string | null = null;
      let lastCreditReset: string | null = null;

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        userPlan = apiData.plan || 'starter';
        const profileData = apiData.profileData;
        creditsUsed = profileData?.credits_used_this_month ?? 0;
        createdAt = profileData?.created_at || null;
        lastCreditReset = profileData?.last_credit_reset || null;
      } else {
        const { data: profileData, error: profileError } = await supabase
          .from('users_profile')
          .select('plan, credits_used_this_month, created_at, last_credit_reset')
          .eq('id', userId)
          .single();

        if (profileError) {
          throw new Error('Nepodarilo sa načítať profil používateľa.');
        }

        userPlan = profileData?.plan || 'starter';
        creditsUsed = profileData?.credits_used_this_month ?? 0;
        createdAt = profileData?.created_at || null;
        lastCreditReset = profileData?.last_credit_reset || null;
      }

      setPlan(userPlan);
      const limit = PLAN_LIMITS[userPlan] || 1000;

      const now = new Date();
      const resetBaseDate = lastCreditReset
        ? new Date(lastCreditReset)
        : createdAt
        ? new Date(createdAt)
        : now;

      const daysSinceReset = Math.floor(
        (now.getTime() - resetBaseDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const daysRemaining = Math.max(0, 30 - (daysSinceReset % 30));
      const daysPassed = Math.max(1, daysSinceReset % 30 || 1);
      const avgPerDay = creditsUsed / daysPassed;
      const projectedEndOfCycle = Math.ceil(avgPerDay * 30);
      const percentage = limit > 0 ? (creditsUsed / limit) * 100 : 0;

      setUsage({
        currentMonth: creditsUsed,
        limit,
        percentage: Math.min(percentage, 100),
        daysRemaining,
        avgPerDay: Math.round(avgPerDay * 10) / 10,
        projectedEndOfMonth: projectedEndOfCycle,
      });
    } catch (err) {
      console.error('Usage load error:', err);
      setError('Nepodarilo sa načítať štatistiky použitia.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>Spotreba</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Načítavam štatistiky…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !usage) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>Spotreba</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || 'Nepodarilo sa načítať štatistiky.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isUnlimited = plan === 'unlimited' || usage.limit >= 999999;
  const remaining = isUnlimited ? 'Neobmedzené' : usage.limit - usage.currentMonth;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Spotreba</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.planHeader}>
            <Text style={styles.planLabel}>Plán</Text>
            <View style={[styles.planBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.planText, { color: theme.colors.primary }]}>
                {plan.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.usageHeader}>
            <Text style={styles.usageValue}>{usage.currentMonth}</Text>
            <Text style={styles.usageLabel}>z {isUnlimited ? 'neobmedzeného' : usage.limit}</Text>
          </View>

          {!isUnlimited && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${usage.percentage}%`,
                      backgroundColor:
                        usage.percentage > 90
                          ? theme.colors.destructive
                          : usage.percentage > 70
                          ? '#f59e0b'
                          : theme.colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.percentageText}>{Math.round(usage.percentage)}%</Text>
            </View>
          )}

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Feather name="calendar" size={20} color={theme.colors.primary} />
              <Text 
                style={isUnlimited ? styles.statValueUnlimited : styles.statValue}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
              >
                {remaining}
              </Text>
              <Text style={styles.statLabel}>Zostáva</Text>
            </View>
            <View style={styles.statItem}>
              <Feather name="clock" size={20} color={theme.colors.primary} />
              <Text style={styles.statValue}>{usage.daysRemaining}</Text>
              <Text style={styles.statLabel}>Dní do resetu</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Feather name="trending-up" size={20} color={theme.colors.primary} />
              <Text style={styles.statValue}>{usage.avgPerDay}</Text>
              <Text style={styles.statLabel}>Priemer / deň</Text>
            </View>
            {!isUnlimited && (
              <View style={styles.statItem}>
                <Feather name="target" size={20} color={theme.colors.primary} />
                <Text style={styles.statValue}>{usage.projectedEndOfMonth}</Text>
                <Text style={styles.statLabel}>Projekcia</Text>
              </View>
            )}
          </View>

          {usage.percentage > 90 && !isUnlimited && (
            <View style={styles.warningContainer}>
              <Feather name="alert-triangle" size={20} color={theme.colors.destructive} />
              <Text style={styles.warningText}>
                Blížiš sa k limitu. Zváž upgrade na vyšší plán.
              </Text>
            </View>
          )}
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
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: 'center',
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  planLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  planBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  planText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  usageHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  usageValue: {
    fontSize: theme.typography.fontSize['4xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.cardForeground,
  },
  usageLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  progressContainer: {
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  percentageText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.cardForeground,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.muted + '40',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.cardForeground,
    marginTop: theme.spacing.xs,
  },
  statValueUnlimited: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.cardForeground,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs / 2,
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.destructive + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.destructive,
  },
});
