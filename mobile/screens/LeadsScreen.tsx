import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Input } from '../components';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

type Lead = {
  id: string;
  email: string;
  name: string | null;
  note: string | null;
  created_at: string;
};

export function LeadsScreen() {
  const navigation = useNavigation<any>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTarget, setSearchTarget] = useState<'all' | 'email' | 'name' | 'note'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ai-social-agent-frontend.vercel.app';
      const response = await fetch(`${apiUrl}/api/dashboard/leads?ownerUserId=${user.id}`);
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('sk-SK', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLeads = useMemo(() => {
    const base = sortOrder === 'desc' ? [...leads] : [...leads].reverse();

    return base.filter((lead) => {
      if (!searchTerm.trim()) return true;

      let sourceText = '';
      if (searchTarget === 'all') {
        sourceText = `${lead.email} ${lead.name || ''} ${lead.note || ''}`.toLowerCase();
      } else if (searchTarget === 'email') {
        sourceText = lead.email.toLowerCase();
      } else if (searchTarget === 'name') {
        sourceText = (lead.name || '').toLowerCase();
      } else {
        sourceText = (lead.note || '').toLowerCase();
      }

      return sourceText.includes(searchTerm.toLowerCase());
    });
  }, [leads, searchTerm, searchTarget, sortOrder]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>Leads</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Načítavam leads…</Text>
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
        <Text style={styles.title}>Leads</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Search */}
        <Input
          placeholder="Vyhľadať leads..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          containerStyle={styles.searchInput}
        />

        {/* Search Target Buttons */}
        <View style={styles.searchTargetContainer}>
          {(['all', 'email', 'name', 'note'] as const).map((target) => (
            <TouchableOpacity
              key={target}
              style={[
                styles.searchTargetButton,
                searchTarget === target && styles.searchTargetButtonActive,
              ]}
              onPress={() => setSearchTarget(target)}
            >
              <Text
                style={[
                  styles.searchTargetText,
                  searchTarget === target && styles.searchTargetTextActive,
                ]}
              >
                {target === 'all' ? 'Všetko' : target === 'email' ? 'Email' : target === 'name' ? 'Meno' : 'Poznámka'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sort Order */}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
        >
          <Feather
            name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.sortText}>
            {sortOrder === 'desc' ? 'Najnovšie prvé' : 'Najstaršie prvé'}
          </Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : filteredLeads.length < 5 ? 'leads' : 'leadov'}
            {searchTerm && ` (z ${leads.length})`}
          </Text>
        </View>

        {filteredLeads.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="inbox" size={48} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyText}>
              {searchTerm ? 'Žiadne výsledky vyhľadávania' : 'Zatiaľ žiadne leads'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchTerm
                ? 'Skús iný vyhľadávací výraz'
                : 'Kontakty zachytené cez chat formulár sa zobrazia tu'}
            </Text>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} style={styles.leadCard}>
              <View style={styles.leadHeader}>
                <View style={styles.leadHeaderLeft}>
                  <Feather name="user" size={20} color={theme.colors.primary} />
                  <Text style={styles.leadDate}>{formatDate(lead.created_at)}</Text>
                </View>
              </View>

              {lead.name && (
                <View style={styles.leadInfoRow}>
                  <Feather name="user" size={16} color={theme.colors.mutedForeground} style={styles.leadIcon} />
                  <Text style={styles.leadName}>{lead.name}</Text>
                </View>
              )}

              <View style={styles.leadInfoRow}>
                <Feather name="mail" size={16} color={theme.colors.mutedForeground} style={styles.leadIcon} />
                <Text style={styles.leadEmail}>{lead.email}</Text>
              </View>

              {lead.note && (
                <View style={styles.leadNoteContainer}>
                  <Feather name="message-square" size={16} color={theme.colors.mutedForeground} style={styles.leadIcon} />
                  <Text style={styles.leadNote}>{lead.note}</Text>
                </View>
              )}
            </Card>
          ))
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
  searchInput: {
    marginBottom: theme.spacing.md,
  },
  searchTargetContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  searchTargetButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  searchTargetButtonActive: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  searchTargetText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  searchTargetTextActive: {
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sortText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
  },
  statsContainer: {
    marginBottom: theme.spacing.md,
  },
  statsText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.mutedForeground,
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
  leadCard: {
    marginBottom: theme.spacing.md,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  leadHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  leadDate: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  leadInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  leadIcon: {
    marginRight: theme.spacing.sm,
  },
  leadName: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.cardForeground,
  },
  leadEmail: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.cardForeground,
  },
  leadNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.muted + '40',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  leadNote: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
});
