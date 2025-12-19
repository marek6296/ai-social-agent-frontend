import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Input, Textarea, Button } from '../components';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useStaggeredAnimations } from '../hooks/useStaggeredAnimations';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export function FAQScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<FaqItem[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const { getStyle: getItemStyle } = useStaggeredAnimations({
    itemCount: items.length || 0,
    delayBetween: 30,
    duration: 300,
    startDelay: 100,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    setError(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('Musíš byť prihlásený, aby si videl FAQ.');
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('faq_items')
      .select('id, question, answer')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error(fetchError);
      setError('Nepodarilo sa načítať FAQ.');
    } else {
      setItems((data as FaqItem[]) ?? []);
    }

    setLoading(false);
  };

  const handleAdd = async () => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert('Chyba', 'Otázka aj odpoveď musia byť vyplnené.');
      return;
    }

    setSaving(true);
    setError(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Chyba', 'Musíš byť prihlásený.');
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('faq_items')
      .insert({
        user_id: user.id,
        question: question.trim(),
        answer: answer.trim(),
      });

    if (insertError) {
      console.error(insertError);
      Alert.alert('Chyba', 'Nepodarilo sa pridať FAQ.');
    } else {
      setQuestion('');
      setAnswer('');
      await loadItems();
      Alert.alert('Úspech', 'FAQ bolo úspešne pridané.');
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Vymazať FAQ',
      'Naozaj chceš vymazať toto FAQ?',
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: 'Vymazať',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('faq_items')
              .delete()
              .eq('id', id);

            if (error) {
              console.error(error);
              Alert.alert('Chyba', 'Nepodarilo sa vymazať FAQ.');
            } else {
              await loadItems();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>FAQ</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Načítavam FAQ…</Text>
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
        <Text style={styles.title}>FAQ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.addCard}>
          <Text style={styles.cardTitle}>Pridať nové FAQ</Text>
          <Text style={styles.cardDescription}>
            Pridaj otázky a odpovede, ktoré tvoj chatbot použije pri komunikácii so zákazníkmi.
          </Text>

          <Input
            label="Otázka (čo sa klienti pýtajú)"
            placeholder="Napr. Ako funguje váš produkt?"
            value={question}
            onChangeText={setQuestion}
            containerStyle={styles.inputSpacing}
          />

          <Textarea
            label="Odpoveď (čo má AI odpovedať)"
            placeholder="Stručná, jasná odpoveď v štýle tvojej značky."
            value={answer}
            onChangeText={setAnswer}
            style={{ minHeight: 100 }}
            containerStyle={styles.inputSpacing}
          />

          <Button
            title={saving ? 'Pridávam...' : 'Pridať FAQ'}
            onPress={handleAdd}
            loading={saving}
            disabled={saving}
            size="lg"
            style={styles.addButton}
          />
        </Card>

        {items.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="help-circle" size={48} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyText}>Zatiaľ nemáš žiadne FAQ</Text>
            <Text style={styles.emptySubtext}>
              Pridaj svoje prvé FAQ vyššie ↑
            </Text>
          </Card>
        ) : (
          <View style={styles.itemsContainer}>
            <Text style={styles.sectionTitle}>Tvoje FAQ ({items.length})</Text>
            {items.map((item, index) => (
              <Animated.View key={item.id} style={getItemStyle(index)}>
                <Card style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.questionContainer}>
                      <Feather name="help-circle" size={16} color={theme.colors.primary} style={styles.questionIcon} />
                      <Text style={styles.questionText}>{item.question}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      style={styles.deleteButton}
                    >
                      <Feather name="trash-2" size={18} color={theme.colors.destructive} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.answerContainer}>
                    <Feather name="message-square" size={16} color={theme.colors.mutedForeground} style={styles.answerIcon} />
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
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
  addCard: {
    marginBottom: theme.spacing.xl,
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
  addButton: {
    marginTop: theme.spacing.sm,
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
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  itemsContainer: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  itemCard: {
    marginBottom: theme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  questionContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questionIcon: {
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
  deleteButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.muted + '40',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  answerIcon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  answerText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
});
