import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { SimpleAreaChart } from '../components/SimpleAreaChart';
import { SimpleBarChart } from '../components/SimpleBarChart';
import { SimplePieChart } from '../components/SimplePieChart';

type ChatLog = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  category?: string | null;
};

type Lead = {
  id: string;
  email: string;
  name: string | null;
  note: string | null;
  created_at: string;
};

function inferCategory(log: ChatLog): string {
  const q = (log.question || '').toLowerCase();

  if (q.includes('cena') || q.includes('koľko stojí') || q.includes('price') || q.includes('eur') || q.includes('€')) {
    return 'Cena';
  }
  if (q.includes('objednávka') || q.includes('objednavka') || q.includes('objednať') || q.includes('order')) {
    return 'Objednávky';
  }
  if (q.includes('podpora') || q.includes('support') || q.includes('kontakt') || q.includes('pomoc')) {
    return 'Podpora';
  }
  if (q.includes('nefunguje') || q.includes('chyba') || q.includes('error') || q.includes('bug')) {
    return 'Technické';
  }
  if (q.includes('čo je') || q.includes('co je') || q.includes('ako funguje') || q.includes('funkcie')) {
    return 'Produkt / služba';
  }

  return log.category || 'Iné';
}

const WEEKDAY_LABELS = ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So'];

type DayBucket = {
  key: string;
  label: string;
  count: number;
  date: string;
};

type HourBucket = {
  hour: number;
  label: string;
  count: number;
};

type CategoryBucket = {
  key: string;
  label: string;
  count: number;
  percentage: number;
};

const CHART_COLORS = {
  primary: "#10b981",
  secondary: "#06b6d4",
  accent: "#8b5cf6",
};

const CATEGORY_COLORS = [
  "#10b981",
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 32 - 32; // padding + card padding

export function AnalyticsScreen() {
  const navigation = useNavigation<any>();
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('Musíš byť prihlásený, aby si videl štatistiky.');
      setLoading(false);
      return;
    }

    const [logsRes, leadsRes] = await Promise.all([
      supabase
        .from('chat_logs')
        .select('id, question, answer, created_at, category')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('leads')
        .select('id, email, name, note, created_at')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (logsRes.error) {
      console.error(logsRes.error);
      setError('Nepodarilo sa načítať konverzácie.');
    } else {
      setLogs((logsRes.data as ChatLog[]) ?? []);
    }

    if (leadsRes.error) {
      console.error(leadsRes.error);
    } else {
      setLeads((leadsRes.data as Lead[]) ?? []);
    }

    setLoading(false);
  };

  const stats = useMemo(() => {
    if (logs.length === 0) {
      return {
        total: 0,
        last7: 0,
        last30: 0,
        firstDate: null,
        lastDate: null,
        perDay: [] as DayBucket[],
        perHour: [] as HourBucket[],
        activeDaysCount: 0,
        avgPerActiveDay: 0,
        busiestDayLabel: null,
        busiestDayCount: 0,
        busiestWeekdayLabel: null,
        busiestHourLabel: null,
        busiestHourCount: 0,
        categories: [] as CategoryBucket[],
      };
    }

    const now = new Date();
    const nowTime = now.getTime();
    const msDay = 24 * 60 * 60 * 1000;

    let total = logs.length;
    let last7 = 0;
    let last30 = 0;
    let firstDate: string | null = null;
    let lastDate: string | null = null;

    const dayMap = new Map<string, DayBucket>();
    const weekdayMap = new Map<number, number>();
    const hourMap = new Map<number, number>();
    const categoriesMap = new Map<string, number>();

    const start14 = new Date(now);
    start14.setDate(start14.getDate() - 13);
    const start14Time = new Date(
      start14.getFullYear(),
      start14.getMonth(),
      start14.getDate()
    ).getTime();

    for (const log of logs) {
      const created = new Date(log.created_at);
      const createdTime = created.getTime();
      const isoDate = created.toISOString().slice(0, 10);

      if (!firstDate || isoDate < firstDate) firstDate = isoDate;
      if (!isoDate || isoDate > (lastDate || '')) lastDate = isoDate;

      const diffDays = (nowTime - createdTime) / msDay;
      if (diffDays <= 7) last7 += 1;
      if (diffDays <= 30) last30 += 1;

      const weekday = created.getDay();
      weekdayMap.set(weekday, (weekdayMap.get(weekday) ?? 0) + 1);

      const hour = created.getHours();
      hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);

      const categoryKey = (log.category && log.category.trim()) || "Nezaradené";
      categoriesMap.set(categoryKey, (categoriesMap.get(categoryKey) ?? 0) + 1);

      const dayKey = isoDate;
      const dayStart = new Date(
        created.getFullYear(),
        created.getMonth(),
        created.getDate()
      ).getTime();

      if (dayStart >= start14Time) {
        if (!dayMap.has(dayKey)) {
          dayMap.set(dayKey, {
            key: dayKey,
            label: created.toLocaleDateString("sk-SK", {
              day: "2-digit",
              month: "2-digit",
            }),
            date: isoDate,
            count: 0,
          });
        }
        const bucket = dayMap.get(dayKey)!;
        bucket.count += 1;
      }
    }

    const perDay: DayBucket[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const existing = dayMap.get(key);
      if (existing) {
        perDay.push(existing);
      } else {
        perDay.push({
          key,
          label: d.toLocaleDateString("sk-SK", {
            day: "2-digit",
            month: "2-digit",
          }),
          date: key,
          count: 0,
        });
      }
    }

    const perHour: HourBucket[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const count = hourMap.get(hour) ?? 0;
      const label = `${hour.toString().padStart(2, "0")}:00`;
      perHour.push({ hour, label, count });
    }

    const categories: CategoryBucket[] = [];
    categoriesMap.forEach((count, key) => {
      const percentage = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
      categories.push({
        key,
        label: key,
        count,
        percentage,
      });
    });
    categories.sort((a, b) => b.count - a.count);

    const activeDaysCount = perDay.filter((d) => d.count > 0).length;
    const avgPerActiveDay =
      activeDaysCount > 0 ? Number((total / activeDaysCount).toFixed(1)) : 0;

    let busiestDayLabel: string | null = null;
    let busiestDayCount = 0;
    for (const d of perDay) {
      if (d.count > busiestDayCount) {
        busiestDayCount = d.count;
        busiestDayLabel = d.label;
      }
    }

    let busiestWeekdayLabel: string | null = null;
    let busiestWeekdayCount = 0;
    weekdayMap.forEach((count, weekday) => {
      if (count > busiestWeekdayCount) {
        busiestWeekdayCount = count;
        busiestWeekdayLabel = WEEKDAY_LABELS[weekday];
      }
    });

    let busiestHourLabel: string | null = null;
    let busiestHourCount = 0;
    for (const bucket of perHour) {
      if (bucket.count > busiestHourCount) {
        busiestHourCount = bucket.count;
        busiestHourLabel = bucket.label;
      }
    }

    return {
      total,
      last7,
      last30,
      firstDate,
      lastDate,
      perDay,
      perHour,
      activeDaysCount,
      avgPerActiveDay,
      busiestDayLabel,
      busiestDayCount,
      busiestWeekdayLabel,
      busiestHourLabel,
      busiestHourCount,
      categories,
    };
  }, [logs]);

  const leadsStats = useMemo(() => {
    if (leads.length === 0) {
      return {
        totalLeads: 0,
        leadsLast30: 0,
        conversion30: 0,
      };
    }

    const now = new Date();
    const nowTime = now.getTime();
    const msDay = 24 * 60 * 60 * 1000;

    let leadsLast30 = 0;
    for (const lead of leads) {
      const created = new Date(lead.created_at);
      const diffDays = (nowTime - created.getTime()) / msDay;
      if (diffDays <= 30) {
        leadsLast30 += 1;
      }
    }

    const totalLeads = leads.length;
    const baseForConversion = stats.last30 > 0 ? stats.last30 : stats.total;
    const conversion30 =
      baseForConversion > 0
        ? Number(((leadsLast30 / baseForConversion) * 100).toFixed(1))
        : 0;

    return {
      totalLeads,
      leadsLast30,
      conversion30,
    };
  }, [leads, stats.last30, stats.total]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>Analytics</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Načítavam štatistiky…</Text>
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
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {logs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="bar-chart-2" size={48} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyText}>Zatiaľ nemáš žiadne konverzácie</Text>
            <Text style={styles.emptySubtext}>
              Najprv skús komunikáciu s botom na hlavnej stránke a potom sa sem vráť.
            </Text>
          </Card>
        ) : (
          <>
            {/* Top Stats Cards */}
            <View style={styles.topStatsGrid}>
              <Card style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Feather name="message-square" size={24} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Celkový počet</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Feather name="calendar" size={24} color="#06b6d4" />
                </View>
                <Text style={styles.statValue}>{stats.last7}</Text>
                <Text style={styles.statLabel}>Posledných 7 dní</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Feather name="trending-up" size={24} color="#a855f7" />
                </View>
                <Text style={styles.statValue}>{stats.last30}</Text>
                <Text style={styles.statLabel}>Posledných 30 dní</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Feather name="users" size={24} color="#f59e0b" />
                </View>
                <Text style={styles.statValue}>{leadsStats.totalLeads}</Text>
                <Text style={styles.statLabel}>Celkový počet leadov</Text>
              </Card>
            </View>

            {/* Secondary Stats */}
            <View style={styles.secondaryStatsGrid}>
              <Card style={styles.secondaryCard}>
                <View style={styles.secondaryHeader}>
                  <Feather name="zap" size={24} color={theme.colors.primary} />
                  <Text style={styles.secondaryLabel}>Konverzný pomer</Text>
                </View>
                <Text style={styles.secondaryValue}>{leadsStats.conversion30}%</Text>
                <Text style={styles.secondaryDescription}>
                  {leadsStats.leadsLast30} leadov z {stats.last30} konverzácií
                </Text>
              </Card>

              <Card style={styles.secondaryCard}>
                <View style={styles.secondaryHeader}>
                  <Feather name="clock" size={24} color={theme.colors.primary} />
                  <Text style={styles.secondaryLabel}>Priemer na aktívny deň</Text>
                </View>
                <Text style={styles.secondaryValue}>{stats.avgPerActiveDay}</Text>
                <Text style={styles.secondaryDescription}>
                  {stats.activeDaysCount} aktívnych dní
                </Text>
              </Card>
            </View>

            {/* 14 Days Area Chart */}
            {stats.perDay.length > 0 && (
              <Card style={styles.card}>
                <View style={styles.chartHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Posledných 14 dní</Text>
                    <Text style={styles.cardDescription}>
                      Trend používania chatbota
                    </Text>
                  </View>
                  {stats.busiestDayLabel && (
                    <View style={styles.badge}>
                      <Feather name="trending-up" size={12} color={theme.colors.primary} />
                      <Text style={styles.badgeText}>
                        {stats.busiestDayLabel} · {stats.busiestDayCount}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.chartContainer}>
                  <SimpleAreaChart
                    data={stats.perDay.map(d => d.count)}
                    labels={stats.perDay.map(d => d.label)}
                    width={CHART_WIDTH}
                    height={220}
                    color={CHART_COLORS.primary}
                  />
                </View>
              </Card>
            )}

            {/* Hourly Distribution Bar Chart */}
            {stats.perHour.length > 0 && (
              <Card style={styles.card}>
                <View style={styles.chartHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Rozloženie podľa hodiny</Text>
                    <Text style={styles.cardDescription}>
                      V ktoré hodiny sa bot používa najčastejšie
                    </Text>
                  </View>
                  {stats.busiestHourLabel && (
                    <View style={styles.badge}>
                      <Feather name="clock" size={12} color={theme.colors.primary} />
                      <Text style={styles.badgeText}>
                        {stats.busiestHourLabel} · {stats.busiestHourCount}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.chartContainer}>
                  <SimpleBarChart
                    data={stats.perHour.map(h => h.count)}
                    labels={stats.perHour.map(h => h.label)}
                    width={CHART_WIDTH}
                    height={220}
                    color={CHART_COLORS.primary}
                  />
                </View>
              </Card>
            )}

            {/* Categories - Pie Chart + Bars */}
            {stats.categories.length > 0 && (
              <>
                <Card style={styles.card}>
                  <View style={styles.chartHeader}>
                    <Text style={styles.cardTitle}>Kategórie otázok</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{stats.categories.length} kategórií</Text>
                    </View>
                  </View>
                  <View style={styles.chartContainer}>
                    <SimplePieChart
                      data={stats.categories.map(cat => ({
                        label: cat.label,
                        value: cat.count,
                      }))}
                      colors={CATEGORY_COLORS}
                      width={CHART_WIDTH}
                      height={220}
                    />
                  </View>
                </Card>

                {/* Category Bars */}
                <Card style={styles.card}>
                  <Text style={styles.cardTitle}>Kategórie - detail</Text>
                  <View style={styles.categoriesContainer}>
                    {stats.categories.map((category) => (
                      <View key={category.key} style={styles.categoryItem}>
                        <View style={styles.categoryHeader}>
                          <Text style={styles.categoryName}>{category.label}</Text>
                          <Text style={styles.categoryCount}>
                            {category.count} ({category.percentage}%)
                          </Text>
                        </View>
                        <View style={styles.categoryBarContainer}>
                          <View
                            style={[
                              styles.categoryBar,
                              {
                                width: `${category.percentage}%`,
                                backgroundColor: theme.colors.primary,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              </>
            )}
          </>
        )}
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
  errorCard: {
    backgroundColor: theme.colors.destructive + '20',
    borderColor: theme.colors.destructive,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.foreground,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  topStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
    justifyContent: 'space-between',
    marginHorizontal: 0,
  },
  statCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  statValue: {
    fontSize: theme.typography.fontSize['4xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.cardForeground,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  secondaryStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
    justifyContent: 'space-between',
    marginHorizontal: 0,
  },
  secondaryCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  secondaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  secondaryLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  secondaryValue: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.cardForeground,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  secondaryDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
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
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.muted + '40',
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.foreground,
  },
  busiestDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  busiestDayInfo: {
    flex: 1,
  },
  busiestDayLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs / 2,
  },
  busiestDayValue: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.cardForeground,
    marginBottom: theme.spacing.xs / 2,
  },
  busiestDayDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  categoriesContainer: {
    marginTop: theme.spacing.sm,
  },
  categoryItem: {
    marginBottom: theme.spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  categoryName: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.cardForeground,
  },
  categoryCount: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  categoryBarContainer: {
    height: 12,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
});
