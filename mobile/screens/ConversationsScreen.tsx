import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useStaggeredAnimations } from '../hooks/useStaggeredAnimations';

type ChatLog = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  category: string | null;
};

function inferCategory(log: ChatLog): string {
  const q = (log.question || '').toLowerCase();

  if (
    q.includes('cena') || q.includes('koľko stojí') || q.includes('kolko stoji') ||
    q.includes('price') || q.includes('eur') || q.includes('€') ||
    q.includes('predplatné') || q.includes('predplatne') || q.includes('platba')
  ) {
    return 'Cena';
  }

  if (
    q.includes('objednávka') || q.includes('objednavka') || q.includes('objednať') ||
    q.includes('objednat') || q.includes('kúpiť') || q.includes('kupit') ||
    q.includes('order') || q.includes('purchase') || q.includes('zakúpiť')
  ) {
    return 'Objednávky';
  }

  if (
    q.includes('podpora') || q.includes('support') || q.includes('kontakt') ||
    q.includes('pomoc') || q.includes('help') || q.includes('reklamácia')
  ) {
    return 'Podpora';
  }

  if (
    q.includes('nefunguje') || q.includes('chyba') || q.includes('error') ||
    q.includes('bug') || q.includes('nastavenie') || q.includes('prihlásiť')
  ) {
    return 'Technické';
  }

  if (
    q.includes('čo je') || q.includes('co je') || q.includes('ako funguje') ||
    q.includes('čo robí') || q.includes('co robi') || q.includes('funkcie')
  ) {
    return 'Produkt / služba';
  }

  return log.category || 'Iné';
}

const categoryColors: Record<string, string> = {
  Cena: '#f59e0b',
  Objednávky: '#10b981',
  Podpora: '#06b6d4',
  Technické: '#a855f7',
  'Produkt / služba': '#06b6d4',
  Iné: '#64748b',
};

export function ConversationsScreen() {
  const navigation = useNavigation<any>();
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null);

  const { getStyle: getLogStyle } = useStaggeredAnimations({
    itemCount: logs.length,
    delayBetween: 30,
    duration: 300,
    startDelay: 100,
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('Musíš byť prihlásený, aby si videl konverzácie.');
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('chat_logs')
      .select('id, question, answer, created_at, category')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      console.error(fetchError);
      setError('Nepodarilo sa načítať konverzácie.');
    } else {
      const logsData = (data as ChatLog[]) ?? [];
      setLogs(logsData);
      if (logsData.length > 0) {
        setSelectedLog(logsData[0]);
      }
    }

    setLoading(false);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('sk-SK', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.question.toLowerCase().includes(search) ||
      log.answer.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>Konverzácie</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Načítavam konverzácie…</Text>
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
        <Text style={styles.title}>Konverzácie</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {filteredLogs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="message-square" size={48} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyText}>
              {searchTerm ? 'Žiadne výsledky vyhľadávania' : 'Zatiaľ žiadne konverzácie'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchTerm
                ? 'Skús iný vyhľadávací výraz'
                : 'Konverzácie sa zobrazia tu, keď sa zákazníci začnú pýtať tvojho bota'}
            </Text>
          </Card>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {searchTerm ? `Výsledky (${filteredLogs.length})` : `Všetky konverzácie (${filteredLogs.length})`}
            </Text>
            {filteredLogs.map((log, index) => {
              const category = inferCategory(log);
              const categoryColor = categoryColors[category] || categoryColors['Iné'];
              
              return (
                <Animated.View key={log.id} style={getLogStyle(index)}>
                  <Card style={styles.logCard}>
                    <View style={styles.logHeader}>
                      <View style={styles.categoryContainer}>
                        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                          <Text style={[styles.categoryText, { color: categoryColor }]}>
                            {category}
                          </Text>
                        </View>
                        <Text style={styles.dateText}>{formatDate(log.created_at)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.questionContainer}>
                      <Feather name="help-circle" size={16} color={theme.colors.primary} style={styles.icon} />
                      <Text style={styles.questionText}>{log.question}</Text>
                    </View>
                    
                    <View style={styles.answerContainer}>
                      <Feather name="message-square" size={16} color={theme.colors.mutedForeground} style={styles.icon} />
                      <Text style={styles.answerText}>{log.answer}</Text>
                    </View>
                  </Card>
                </Animated.View>
              );
            })}
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
    fontSize: theme.typography.fontSize.lg,
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
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  logCard: {
    marginBottom: theme.spacing.md,
  },
  logHeader: {
    marginBottom: theme.spacing.md,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  dateText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.muted + '40',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  icon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  questionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.cardForeground,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
  },
  answerText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
});
