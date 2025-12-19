import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Input, Button, Picker } from '../components';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const SUPER_ADMIN_ID = 'faeb1920-35fe-47be-a169-1393591cc3e4';

type User = {
  id: string;
  email: string;
  created_at: string;
  plan: 'starter' | 'pro' | 'agency';
  is_active: boolean;
  is_admin: boolean;
  credits_used_this_month: number;
  last_credit_reset: string;
};

const PLAN_LIMITS: Record<string, number> = {
  starter: 1000,
  pro: 10000,
  agency: 999999,
};

const PLAN_COLORS: Record<string, string> = {
  starter: '#64748b',
  pro: '#06b6d4',
  agency: '#a855f7',
};

export function AdminScreen() {
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    setLoading(true);
    setError(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('Musíš byť prihlásený.');
      setLoading(false);
      return;
    }

    const userIsAdmin = user.id === SUPER_ADMIN_ID;
    setIsAdmin(userIsAdmin);

    if (!userIsAdmin) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profile?.is_admin) {
        setIsAdmin(true);
      } else {
        setError('Nemáš oprávnenie na prístup k admin rozhraniu.');
        setLoading(false);
        return;
      }
    }

    await loadUsers();
  };

  const loadUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Musíš byť prihlásený.');
        return;
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ai-social-agent-frontend.vercel.app';
      const res = await fetch(`${apiUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Nepodarilo sa načítať používateľov.');
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Load users error:', err);
      setError('Nepodarilo sa načítať používateľov.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (userId === SUPER_ADMIN_ID) {
      Alert.alert('Chyba', 'Super admin nemôže byť zmenený.');
      return;
    }

    setUpdating(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Chyba', 'Musíš byť prihlásený.');
        return;
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ai-social-agent-frontend.vercel.app';
      const res = await fetch(`${apiUrl}/api/admin/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          is_active: !currentStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('Nepodarilo sa aktualizovať používateľa.');
      }

      await loadUsers();
    } catch (err) {
      console.error('Toggle active error:', err);
      Alert.alert('Chyba', 'Nepodarilo sa aktualizovať používateľa.');
    } finally {
      setUpdating(null);
    }
  };

  const handleChangePlan = async (userId: string, newPlan: 'starter' | 'pro' | 'agency') => {
    setUpdating(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Chyba', 'Musíš byť prihlásený.');
        return;
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ai-social-agent-frontend.vercel.app';
      const res = await fetch(`${apiUrl}/api/admin/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          plan: newPlan,
        }),
      });

      if (!res.ok) {
        throw new Error('Nepodarilo sa zmeniť plán.');
      }

      await loadUsers();
    } catch (err) {
      console.error('Change plan error:', err);
      Alert.alert('Chyba', 'Nepodarilo sa zmeniť plán.');
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    blocked: users.filter((u) => !u.is_active).length,
    starter: users.filter((u) => u.plan === 'starter').length,
    pro: users.filter((u) => u.plan === 'pro').length,
    agency: users.filter((u) => u.plan === 'agency').length,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>Admin panel</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Načítavam admin rozhranie…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>Admin panel</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Card style={styles.errorCard}>
            <Feather name="shield" size={48} color={theme.colors.destructive} />
            <Text style={styles.errorText}>Prístup zamietnutý</Text>
            <Text style={styles.errorSubtext}>Nemáš oprávnenie na prístup k admin rozhraniu.</Text>
          </Card>
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
        <Text style={styles.title}>Admin panel</Text>
        <TouchableOpacity onPress={loadUsers} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={20} color={theme.colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {/* Stats */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Štatistiky</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Celkom</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.active}</Text>
              <Text style={styles.statLabel}>Aktívnych</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.destructive }]}>{stats.blocked}</Text>
              <Text style={styles.statLabel}>Blokovaných</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.starter}</Text>
              <Text style={styles.statLabel}>Starter</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.pro}</Text>
              <Text style={styles.statLabel}>Pro</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.agency}</Text>
              <Text style={styles.statLabel}>Agency</Text>
            </View>
          </View>
        </Card>

        {/* Search */}
        <Input
          placeholder="Vyhľadať podľa emailu..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          containerStyle={styles.searchInput}
        />

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="users" size={48} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyText}>
              {searchTerm ? 'Žiadne výsledky' : 'Žiadni používatelia'}
            </Text>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userDate}>Registrovaný: {formatDate(user.created_at)}</Text>
                </View>
                <View style={[styles.statusBadge, user.is_active ? styles.activeBadge : styles.blockedBadge]}>
                  <Text style={[styles.statusText, user.is_active ? styles.activeText : styles.blockedText]}>
                    {user.is_active ? 'Aktívny' : 'Blokovaný'}
                  </Text>
                </View>
              </View>

              <View style={styles.userStats}>
                <View style={styles.userStat}>
                  <Feather name="zap" size={16} color={theme.colors.mutedForeground} />
                  <Text style={styles.userStatText}>{user.credits_used_this_month} / {PLAN_LIMITS[user.plan]}</Text>
                </View>
              </View>

              <View style={styles.userActions}>
                <View style={styles.planSelector}>
                  <Text style={styles.planLabel}>Plán:</Text>
                  <Picker
                    selectedValue={user.plan}
                    onValueChange={(value) => handleChangePlan(user.id, value as 'starter' | 'pro' | 'agency')}
                    items={[
                      { label: 'Starter', value: 'starter' },
                      { label: 'Pro', value: 'pro' },
                      { label: 'Agency', value: 'agency' },
                    ]}
                    containerStyle={styles.pickerContainer}
                  />
                </View>

                <Button
                  title={user.is_active ? 'Blokovať' : 'Aktivovať'}
                  onPress={() => handleToggleActive(user.id, user.is_active)}
                  variant={user.is_active ? 'destructive' : 'default'}
                  size="sm"
                  loading={updating === user.id}
                  disabled={updating === user.id || user.id === SUPER_ADMIN_ID}
                />
              </View>
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
  refreshButton: {
    padding: theme.spacing.xs,
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
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  errorSubtext: {
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.cardForeground,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  statBox: {
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
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs / 2,
  },
  searchInput: {
    marginBottom: theme.spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.md,
  },
  userCard: {
    marginBottom: theme.spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.cardForeground,
    marginBottom: theme.spacing.xs / 2,
  },
  userDate: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.full,
    marginLeft: theme.spacing.sm,
  },
  activeBadge: {
    backgroundColor: theme.colors.primary + '20',
  },
  blockedBadge: {
    backgroundColor: theme.colors.destructive + '20',
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  activeText: {
    color: theme.colors.primary,
  },
  blockedText: {
    color: theme.colors.destructive,
  },
  userStats: {
    marginBottom: theme.spacing.md,
  },
  userStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  userStatText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  planSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  planLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.cardForeground,
  },
  pickerContainer: {
    flex: 1,
    marginBottom: 0,
  },
});
