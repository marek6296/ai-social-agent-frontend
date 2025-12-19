import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, ActivityIndicator, View, Text, Animated } from 'react-native';
import { AnimatedLoader } from './components/AnimatedLoader';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase';
import { theme } from './theme';
import { Feather } from '@expo/vector-icons';
import { AnimatedTabIcon } from './components/AnimatedTabIcon';

// Auth screens
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';

// Main screens
import { HomeScreen } from './screens/HomeScreen';
import { MyBotScreen } from './screens/MyBotScreen';
import { SettingsScreen } from './screens/SettingsScreen';

// Dashboard screens (placeholder for now)
import { LeadsScreen } from './screens/LeadsScreen';
import { ConversationsScreen } from './screens/ConversationsScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { FAQScreen } from './screens/FAQScreen';
import { BotSettingsScreen } from './screens/BotSettingsScreen';
import { UsageScreen } from './screens/UsageScreen';
import { AdminScreen } from './screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="Login"
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}


function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: theme.typography.fontFamily.medium,
        },
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Domov',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="home" size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="MyBot"
        component={MyBotScreen}
        options={{
          tabBarLabel: 'Môj bot',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="message-square" size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Nastavenia',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="settings" size={size} color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('App initializing...');
    // Web styling
    if (Platform.OS === 'web') {
      const html = document.documentElement;
      const body = document.body;
      const root = document.getElementById('root');
      
      html.style.height = '100%';
      html.style.width = '100%';
      html.style.overflow = 'hidden';
      html.style.margin = '0';
      html.style.padding = '0';
      
      body.style.height = '100vh';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      body.style.margin = '0';
      body.style.padding = '0';
      body.style.display = 'flex';
      body.style.justifyContent = 'center';
      body.style.alignItems = 'center';
      body.style.backgroundColor = '#020817'; // hsl(222.2 84% 4.9%) - presná tmavá farba z webu
      
      if (root) {
        root.style.width = '375px';
        root.style.height = '667px';
        root.style.margin = '0 auto';
        root.style.display = 'flex';
        root.style.justifyContent = 'center';
        root.style.alignItems = 'center';
      }
    }

    // Check auth state with timeout - shorter timeout
    let timeoutId: NodeJS.Timeout;
    
    const initAuth = async () => {
      try {
        console.log('Starting auth check...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError(sessionError.message);
        } else {
          console.log('Session loaded:', session?.user?.email || 'No user');
        }
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err: any) {
        console.error('Error initializing auth:', err);
        setError(err.message || 'Unknown error');
        setLoading(false);
      }
    };

    // Timeout after 3 seconds
    timeoutId = setTimeout(() => {
      console.warn('Auth check timeout - forcing loading to false');
      setLoading(false);
    }, 3000);

    initAuth().then(() => {
      clearTimeout(timeoutId);
    }).catch(() => {
      clearTimeout(timeoutId);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session?.user?.email || 'No user');
      setUser(session?.user ?? null);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider style={styles.container}>
        <View style={styles.loadingContainer}>
          <AnimatedLoader />
          <Text style={{ color: theme.colors.foreground, marginTop: 16, fontSize: 16 }}>
            Načítavam aplikáciu...
          </Text>
          <Text style={{ color: theme.colors.mutedForeground, marginTop: 8, fontSize: 12 }}>
            (max. 3 sekundy)
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.destructive, marginBottom: 16 }}>
            Chyba: {error}
          </Text>
          <Text style={{ color: theme.colors.mutedForeground }}>
            Skontroluj env premenné v mobile/.env
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  const containerStyle = Platform.OS === 'web' 
    ? styles.webContainer
    : styles.container;

  console.log('Rendering App - user:', user?.email || 'null', 'loading:', loading);

  return (
    <SafeAreaProvider style={containerStyle}>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
          initialRouteName={user ? "Main" : "Auth"}
        >
          {user ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Leads" component={LeadsScreen} />
              <Stack.Screen name="Conversations" component={ConversationsScreen} />
              <Stack.Screen name="Analytics" component={AnalyticsScreen} />
              <Stack.Screen name="FAQ" component={FAQScreen} />
              <Stack.Screen name="BotSettings" component={BotSettingsScreen} />
              <Stack.Screen name="Usage" component={UsageScreen} />
              <Stack.Screen name="Admin" component={AdminScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Auth" component={AuthNavigator} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    width: '375px',
    height: '667px',
    maxWidth: '375px',
    maxHeight: '667px',
    minWidth: '375px',
    minHeight: '667px',
    margin: '0 auto',
    boxShadow: '0 10px 80px rgba(0, 0, 0, 0.9), inset 0 0 0 2px rgba(255, 255, 255, 0.1)',
    borderRadius: 35,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 12,
    borderColor: '#1a1a1a',
  } as any,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
