import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardCard } from '../components/DashboardCard';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useStaggeredAnimations } from '../hooks/useStaggeredAnimations';
import { AnimatedIconWrapper } from '../components/AnimatedIconWrapper';
import { ChatWidget } from '../components/ChatWidget';

const PLATFORM_OWNER_ID = 'faeb1920-35fe-47be-a169-1393591cc3e4'; // Basic bot for HomeScreen

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState('starter');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const SUPER_ADMIN_ID = "faeb1920-35fe-47be-a169-1393591cc3e4";
  
  // Header animations
  const greetingFadeAnim = useRef(new Animated.Value(0)).current;
  const greetingSlideAnim = useRef(new Animated.Value(-20)).current;
  const badgeFadeAnim = useRef(new Animated.Value(0)).current;
  const badgeScaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadUser();
    
    // Premium header animations
    Animated.parallel([
      Animated.timing(greetingFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(greetingSlideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Badge animation with bounce
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(badgeFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      
      // Kontrola super admin
      const userIsSuperAdmin = user.id === SUPER_ADMIN_ID;
      setIsSuperAdmin(userIsSuperAdmin);
      
      // Načítaj plan z API
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ai-social-agent-frontend.vercel.app';
        const response = await fetch(`${apiUrl}/api/user/plan?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin || userIsSuperAdmin);
          
          // Pre admin/super admin zobraz "unlimited"
          if (data.isAdmin || userIsSuperAdmin) {
            setPlan('unlimited');
          } else {
            setPlan(data.plan || 'starter');
          }
        }
      } catch (error) {
        console.error('Error loading plan:', error);
        // Fallback kontrola
        if (userIsSuperAdmin) {
          setIsAdmin(true);
          setPlan('unlimited');
        }
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Odhlásiť sa',
      'Naozaj sa chceš odhlásiť?',
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: 'Odhlásiť',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.replace('Auth');
          },
        },
      ]
    );
  };

  const dashboardCards = [
    {
      title: 'Môj účet',
      description: 'Uprav svoje osobné údaje a nastavenia účtu',
      icon: 'user' as const,
      iconColor: '#64748b',
      iconBg: 'rgba(100, 116, 139, 0.1)',
      route: 'Settings',
    },
    {
      title: 'Spotreba',
      description: 'Prehľad použitého počtu konverzácií',
      icon: 'zap' as const,
      iconColor: '#14b8a6',
      iconBg: 'rgba(20, 184, 166, 0.1)',
      route: 'Usage',
    },
  ];

  const adminCard = {
    title: 'Admin panel',
    description: 'Spravuj používateľov a ich plány',
    icon: 'shield' as const,
    iconColor: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.1)',
    route: 'Admin',
  };

  // Staggered animations - use max possible count (cards + 1 admin)
  const maxCardsCount = dashboardCards.length + (isAdmin ? 1 : 0);
  const { getStyle: getCardStyle } = useStaggeredAnimations({
    itemCount: maxCardsCount,
    delayBetween: 60,
    duration: 450,
    startDelay: 250,
  });

  const displayName = user?.user_metadata?.firstName || user?.email?.split('@')[0] || 'Používateľ';

  console.log('HomeScreen rendering, user:', user?.email);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.header, 
            { 
              opacity: greetingFadeAnim,
              transform: [{ translateY: greetingSlideAnim }],
            }
          ]}
        >
          <View>
            <Text style={styles.greeting}>Ahoj {displayName}</Text>
            <Text style={styles.subtitle}>Vitaj späť! 👋</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <AnimatedIconWrapper
              name="log-out"
              size={20}
              color={theme.colors.foreground}
              delay={400}
              bounce={false}
            />
          </TouchableOpacity>
        </Animated.View>

        {plan && (
          <Animated.View 
            style={[
              styles.badgeContainer, 
              { 
                opacity: badgeFadeAnim,
                transform: [{ scale: badgeScaleAnim }],
              }
            ]}
          >
            <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                {plan.toUpperCase()}
              </Text>
            </View>
            {(isAdmin || isSuperAdmin) && (
              <View style={[
                styles.badge, 
                styles.adminBadge, 
                { 
                  backgroundColor: isSuperAdmin ? '#a855f720' : '#f59e0b20',
                  marginLeft: theme.spacing.sm,
                  borderColor: isSuperAdmin ? '#a855f740' : '#f59e0b40',
                }
              ]}>
                <Feather 
                  name="shield" 
                  size={12} 
                  color={isSuperAdmin ? '#a855f7' : '#f59e0b'} 
                  style={{ marginRight: 4 }} 
                />
                <Text style={[styles.badgeText, { color: isSuperAdmin ? '#a855f7' : '#f59e0b' }]}>
                  {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {dashboardCards.map((card, index) => (
          <Animated.View key={index} style={getCardStyle(index)}>
            <DashboardCard
              title={card.title}
              description={card.description}
              icon={card.icon}
              iconColor={card.iconColor}
              iconBg={card.iconBg}
              onPress={() => navigation.navigate(card.route)}
              animatedStyle={getCardStyle(index)}
            />
          </Animated.View>
        ))}

        {isAdmin && (
          <Animated.View style={getCardStyle(dashboardCards.length)}>
            <DashboardCard
              title={adminCard.title}
              description={adminCard.description}
              icon={adminCard.icon}
              iconColor={adminCard.iconColor}
              iconBg={adminCard.iconBg}
              onPress={() => navigation.navigate(adminCard.route)}
              animatedStyle={getCardStyle(dashboardCards.length)}
            />
          </Animated.View>
        )}
        </ScrollView>
      </SafeAreaView>
      {/* Basic bot for HomeScreen - outside SafeAreaView for proper positioning */}
      {user && <ChatWidget ownerUserId={PLATFORM_OWNER_ID} />}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  greeting: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.foreground,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  badgeContainer: {
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadge: {
    borderWidth: 1,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});

