import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';

const PLATFORM_OWNER_ID = 'faeb1920-35fe-47be-a169-1393591cc3e4';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

interface ChatWidgetProps {
  ownerUserId?: string;
}

export function ChatWidget({ ownerUserId }: ChatWidgetProps) {
  const insets = useSafeAreaInsets();
  
  // Button position - DIRECT VALUE, no memoization
  // Tab bar: 88px iOS, 60px Android
  // CHANGE THIS VALUE to move button: lower number = lower on screen
  const BUTTON_BOTTOM_IOS = 42; // 88px tab bar + 4px gap
  const BUTTON_BOTTOM_ANDROID = 64; // 60px tab bar + 4px gap
  
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'Ahoj! Som chatbot tejto aplikácie. Môžem ti pomôcť s nastavením chatbota, FAQ a odpovedať na otázky. 🙂',
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadFormEnabled, setLeadFormEnabled] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadNote, setLeadNote] = useState('');
  const [isSavingLead, setIsSavingLead] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Bottom position is now set directly in styles.floatingButtonContainer
  
  // Modal height constants
  const maxModalHeight = SCREEN_HEIGHT * 0.7; // 70% of screen height
  const normalMinHeight = 400; // Normal minimum height
  const expandedMinHeight = SCREEN_HEIGHT * 0.75; // Expanded height when lead form is shown (75%)
  const modalHeightAnim = useRef(new Animated.Value(normalMinHeight)).current;
  
  // Animate modal height when lead form is shown/hidden
  useEffect(() => {
    Animated.spring(modalHeightAnim, {
      toValue: showLeadForm ? expandedMinHeight : normalMinHeight,
      useNativeDriver: false, // height animation doesn't work with native driver
      tension: 80,
      friction: 10,
    }).start();
  }, [showLeadForm, expandedMinHeight, normalMinHeight, modalHeightAnim]);

  const resolvedOwnerId = ownerUserId || PLATFORM_OWNER_ID;

  useEffect(() => {
    loadBotSettings();
  }, [resolvedOwnerId]);

  const loadBotSettings = async () => {
    try {
      const { data } = await supabase
        .from('bot_settings')
        .select('show_lead_form_enabled, widget_welcome_message')
        .eq('user_id', resolvedOwnerId)
        .maybeSingle();

      if (data) {
        setLeadFormEnabled(data.show_lead_form_enabled === true);
        if (data.widget_welcome_message && messages.length === 1) {
          setMessages([
            {
              id: 1,
              role: 'assistant',
              content: data.widget_welcome_message,
            },
          ]);
        }
      }
    } catch (err) {
      console.warn('Error loading bot settings:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message
    const newUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsThinking(true);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ai-social-agent-frontend.vercel.app';
      const conversationHistory = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          ownerUserId: resolvedOwnerId,
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Nastala chyba pri odosielaní správy.');
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply || data.response || 'Prepáč, nemôžem teraz odpovedať.',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Chat logs are saved by the API endpoint, no need to save here
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Nastala chyba pri komunikácii s botom.');
    } finally {
      setIsThinking(false);
    }
  };

  const handleSaveLead = async () => {
    if (!leadEmail.trim()) return;

    setIsSavingLead(true);
    setError(null);

    try {
      const { error: leadError } = await supabase.from('leads').insert({
        owner_user_id: resolvedOwnerId,
        email: leadEmail.trim(),
        name: leadName.trim() || null,
        note: leadNote.trim() || null,
      });

      if (leadError) throw leadError;

      // Show success message
      const successMessage: Message = {
        id: Date.now(),
        role: 'assistant',
        content: 'Ďakujem! Skontaktujeme sa s tebou čoskoro.',
      };
      setMessages((prev) => [...prev, successMessage]);
      setShowLeadForm(false);
      setLeadName('');
      setLeadEmail('');
      setLeadNote('');
    } catch (err: any) {
      console.error('Lead save error:', err);
      setError('Nepodarilo sa uložiť kontakt.');
    } finally {
      setIsSavingLead(false);
    }
  };

  useEffect(() => {
    if (open && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [open, messages]);

  return (
    <>
      {/* Floating Button - positioned in bottom right corner, right above tab bar */}
      <View 
        style={{
          position: 'absolute',
          bottom: 10,
          right: 29,
          zIndex: 1000,
          elevation: 1000,
        }}
      >
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Feather name="message-circle" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Chat Modal */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlayButton}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <Animated.View style={[styles.modalContentContainer, { 
            maxHeight: maxModalHeight,
            height: modalHeightAnim,
          }]}>
            <SafeAreaView style={styles.modalContent} edges={['bottom']}>
              <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Feather name="message-circle" size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.headerTitle}>Chatbot</Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
                    ]}
                  >
                    {message.content}
                  </Text>
                </View>
              ))}

              {isThinking && (
                <View style={[styles.messageBubble, styles.assistantMessage]}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              )}

              {error && (
                <View style={styles.errorBubble}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {leadFormEnabled && !showLeadForm && (
                <TouchableOpacity
                  style={styles.leadButton}
                  onPress={() => setShowLeadForm(true)}
                >
                  <Feather name="mail" size={16} color={theme.colors.primary} />
                  <Text style={styles.leadButtonText}>
                    Chceš, aby sa ti niekto ozval? Zanechaj kontakt.
                  </Text>
                </TouchableOpacity>
              )}

              {showLeadForm && (
                <View style={styles.leadForm}>
                  <Text style={styles.leadFormTitle}>Zanechaj kontakt</Text>
                  <TextInput
                    style={styles.leadInput}
                    placeholder="Meno (voliteľné)"
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={leadName}
                    onChangeText={setLeadName}
                  />
                  <TextInput
                    style={styles.leadInput}
                    placeholder="Email *"
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={leadEmail}
                    onChangeText={setLeadEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.leadInput, styles.leadTextArea]}
                    placeholder="Poznámka (voliteľné)"
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={leadNote}
                    onChangeText={setLeadNote}
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.leadFormActions}>
                    <TouchableOpacity
                      style={styles.leadCancelButton}
                      onPress={() => {
                        setShowLeadForm(false);
                        setLeadName('');
                        setLeadEmail('');
                        setLeadNote('');
                      }}
                    >
                      <Text style={styles.leadCancelText}>Zrušiť</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.leadSubmitButton, !leadEmail.trim() && styles.leadSubmitButtonDisabled]}
                      onPress={handleSaveLead}
                      disabled={!leadEmail.trim() || isSavingLead}
                    >
                      {isSavingLead ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.leadSubmitText}>Odoslať</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Napíš správu..."
                placeholderTextColor={theme.colors.mutedForeground}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
                editable={!isThinking}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendButton, (!input.trim() || isThinking) && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || isThinking}
              >
                {isThinking ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Feather name="send" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: 'absolute',
    zIndex: 1000,
    // bottom and right are set inline to allow dynamic positioning
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  modalContentContainer: {
    width: '100%',
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1,
  },
  modalContent: {
    flex: 1,
    minHeight: 0,
  },
  keyboardView: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.foreground,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.muted,
  },
  messageText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
  },
  userMessageText: {
    color: '#ffffff',
  },
  assistantMessageText: {
    color: theme.colors.foreground,
  },
  errorBubble: {
    alignSelf: 'center',
    backgroundColor: theme.colors.destructive + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },
  leadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  leadButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  leadForm: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  leadFormTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  leadInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.input,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  leadTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  leadFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  leadCancelButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  leadCancelText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
  },
  leadSubmitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  leadSubmitButtonDisabled: {
    opacity: 0.5,
  },
  leadSubmitText: {
    color: '#ffffff',
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.input,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.foreground,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

