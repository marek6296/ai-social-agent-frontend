"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Bot,
  Key,
  Shield,
  MessageSquare,
  Sparkles,
  Clock,
  FileText,
  Settings as SettingsIcon,
} from "lucide-react";
import type { TelegramBot, TelegramBotLanguage, TelegramResponseMode, TelegramAITone } from "@/lib/types/telegram";

export default function TelegramBotSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  const [bot, setBot] = useState<TelegramBot | null>(null);

  // A) Základné informácie
  const [botName, setBotName] = useState("");
  const [publicName, setPublicName] = useState("");
  const [description, setDescription] = useState("");
  const [botAvatarUrl, setBotAvatarUrl] = useState("");
  const [botLanguage, setBotLanguage] = useState<TelegramBotLanguage>("SK");
  const [fallbackLanguages, setFallbackLanguages] = useState<string[]>([]);
  const [timezone, setTimezone] = useState("Europe/Oslo");

  // B) Prepojenie
  const [botToken, setBotToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [longPollingEnabled, setLongPollingEnabled] = useState(true);
  const [allowedUpdates, setAllowedUpdates] = useState<string[]>([]);
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(30);
  const [cooldownSeconds, setCooldownSeconds] = useState(1);

  // C) Prístup a bezpečnosť
  const [accessMode, setAccessMode] = useState<"all" | "whitelist">("all");
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [allowedChatTypes, setAllowedChatTypes] = useState<("private" | "group" | "channel")[]>(["private", "group", "channel"]);
  const [adminUsers, setAdminUsers] = useState<string[]>([]);
  const [antiSpamEnabled, setAntiSpamEnabled] = useState(false);
  const [messagesPerUserLimit, setMessagesPerUserLimit] = useState(10);
  const [blockedKeywords, setBlockedKeywords] = useState<string[]>([]);
  const [blockedLinks, setBlockedLinks] = useState(false);
  const [gdprPrivacyText, setGdprPrivacyText] = useState("");

  // D) Správanie bota
  const [responseMode, setResponseMode] = useState<TelegramResponseMode>("rules");
  const [responseDelayMs, setResponseDelayMs] = useState(500);
  const [respondOnlyOnMention, setRespondOnlyOnMention] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState("Prepáč, nerozumiem tejto správe.");
  const [moduleWelcome, setModuleWelcome] = useState(false);
  const [moduleHelp, setModuleHelp] = useState(false);
  const [moduleAutoReplies, setModuleAutoReplies] = useState(true);
  const [moduleNotifications, setModuleNotifications] = useState(false);
  const [moduleForms, setModuleForms] = useState(false);
  const [moduleBooking, setModuleBooking] = useState(false);
  const [moduleSupportTickets, setModuleSupportTickets] = useState(false);
  const [moduleAiAnswers, setModuleAiAnswers] = useState(false);

  // H) AI nastavenia
  const [aiKnowledgeSourceTypes, setAiKnowledgeSourceTypes] = useState<Set<"faq" | "uploaded" | "custom" | "url">>(new Set());
  const [aiCustomKnowledgeText, setAiCustomKnowledgeText] = useState("");
  const [aiTone, setAiTone] = useState<TelegramAITone>("friendly");
  const [aiCustomTone, setAiCustomTone] = useState("");
  const [aiForbiddenTopics, setAiForbiddenTopics] = useState<string[]>([]);
  const [aiHumanHandoffEnabled, setAiHumanHandoffEnabled] = useState(false);
  const [aiHumanHandoffContact, setAiHumanHandoffContact] = useState("");
  const [aiMaxResponseTokens, setAiMaxResponseTokens] = useState(300);

  // I) Plánovanie
  const [workingHoursEnabled, setWorkingHoursEnabled] = useState(false);
  const [afterHoursMode, setAfterHoursMode] = useState<"auto_reply" | "disable_ai" | "redirect_contact">("auto_reply");
  const [afterHoursMessage, setAfterHoursMessage] = useState("");
  const [afterHoursContact, setAfterHoursContact] = useState("");

  useEffect(() => {
    loadBot();
  }, [botId]);

  const loadBot = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: botData, error: botError } = await supabase
        .from("telegram_bots")
        .select("*")
        .eq("id", botId)
        .single();

      if (botError || !botData) {
        console.error("Error loading bot:", botError);
        setError("Bot nebol nájdený");
        setLoading(false);
        return;
      }

      setBot(botData as TelegramBot);
      
      // Load all settings
      setBotName(botData.bot_name || "");
      setPublicName(botData.public_name || "");
      setDescription(botData.description || "");
      setBotAvatarUrl(botData.bot_avatar_url || "");
      setBotLanguage(botData.bot_language || "SK");
      setFallbackLanguages(botData.fallback_languages || []);
      setTimezone(botData.timezone || "Europe/Oslo");
      
      setBotToken(botData.bot_token ? "***" : "");
      setWebhookUrl(botData.webhook_url || "");
      setWebhookEnabled(botData.webhook_enabled || false);
      setLongPollingEnabled(botData.long_polling_enabled !== false);
      setAllowedUpdates(botData.allowed_updates || []);
      setRateLimitPerMinute(botData.rate_limit_per_minute || 30);
      setCooldownSeconds(botData.cooldown_seconds || 1);
      
      setAccessMode(botData.access_mode || "all");
      setAllowedUsers(botData.allowed_users || []);
      setAllowedChatTypes(botData.allowed_chat_types || ["private", "group", "channel"]);
      setAdminUsers(botData.admin_users || []);
      setAntiSpamEnabled(botData.anti_spam_enabled || false);
      setMessagesPerUserLimit(botData.messages_per_user_limit || 10);
      setBlockedKeywords(botData.blocked_keywords || []);
      setBlockedLinks(botData.blocked_links || false);
      setGdprPrivacyText(botData.gdpr_privacy_text || "");
      
      setResponseMode(botData.response_mode || "rules");
      setResponseDelayMs(botData.response_delay_ms || 500);
      setRespondOnlyOnMention(botData.respond_only_on_mention || false);
      setFallbackMessage(botData.fallback_message || "Prepáč, nerozumiem tejto správe.");
      
      setModuleWelcome(botData.module_welcome || false);
      setModuleHelp(botData.module_help || false);
      setModuleAutoReplies(botData.module_auto_replies !== false);
      setModuleNotifications(botData.module_notifications || false);
      setModuleForms(botData.module_forms || false);
      setModuleBooking(botData.module_booking || false);
      setModuleSupportTickets(botData.module_support_tickets || false);
      setModuleAiAnswers(botData.module_ai_answers || false);
      
      if (botData.ai_knowledge_source_types) {
        setAiKnowledgeSourceTypes(new Set(botData.ai_knowledge_source_types));
      }
      setAiCustomKnowledgeText(botData.ai_custom_knowledge_text || "");
      setAiTone(botData.ai_tone || "friendly");
      setAiCustomTone(botData.ai_custom_tone || "");
      setAiForbiddenTopics(botData.ai_forbidden_topics || []);
      setAiHumanHandoffEnabled(botData.ai_human_handoff_enabled || false);
      setAiHumanHandoffContact(botData.ai_human_handoff_contact || "");
      setAiMaxResponseTokens(botData.ai_max_response_tokens || 300);
      
      setWorkingHoursEnabled(botData.working_hours_enabled || false);
      setAfterHoursMode(botData.after_hours_mode || "auto_reply");
      setAfterHoursMessage(botData.after_hours_message || "");
      setAfterHoursContact(botData.after_hours_contact || "");
      
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Neočakávaná chyba");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: any = {
        bot_name: botName.trim(),
        public_name: publicName.trim() || null,
        description: description.trim() || null,
        bot_avatar_url: botAvatarUrl.trim() || null,
        bot_language: botLanguage,
        fallback_languages: fallbackLanguages.length > 0 ? fallbackLanguages : null,
        timezone: timezone,
        webhook_url: webhookUrl.trim() || null,
        webhook_enabled: webhookEnabled,
        long_polling_enabled: longPollingEnabled,
        allowed_updates: allowedUpdates.length > 0 ? allowedUpdates : null,
        rate_limit_per_minute: rateLimitPerMinute,
        cooldown_seconds: cooldownSeconds,
        access_mode: accessMode,
        allowed_users: allowedUsers.length > 0 ? allowedUsers : null,
        allowed_chat_types: allowedChatTypes,
        admin_users: adminUsers.length > 0 ? adminUsers : null,
        anti_spam_enabled: antiSpamEnabled,
        messages_per_user_limit: messagesPerUserLimit,
        blocked_keywords: blockedKeywords.length > 0 ? blockedKeywords : null,
        blocked_links: blockedLinks,
        gdpr_privacy_text: gdprPrivacyText.trim() || null,
        response_mode: responseMode,
        response_delay_ms: responseDelayMs,
        respond_only_on_mention: respondOnlyOnMention,
        fallback_message: fallbackMessage.trim(),
        module_welcome: moduleWelcome,
        module_help: moduleHelp,
        module_auto_replies: moduleAutoReplies,
        module_notifications: moduleNotifications,
        module_forms: moduleForms,
        module_booking: moduleBooking,
        module_support_tickets: moduleSupportTickets,
        module_ai_answers: moduleAiAnswers,
        ai_knowledge_source_types: responseMode === "ai" && aiKnowledgeSourceTypes.size > 0 ? Array.from(aiKnowledgeSourceTypes) : null,
        ai_custom_knowledge_text: responseMode === "ai" && aiKnowledgeSourceTypes.has("custom") ? aiCustomKnowledgeText.trim() || null : null,
        ai_tone: responseMode === "ai" ? aiTone : "friendly",
        ai_custom_tone: responseMode === "ai" && aiTone === "custom" ? aiCustomTone.trim() || null : null,
        ai_forbidden_topics: responseMode === "ai" && aiForbiddenTopics.length > 0 ? aiForbiddenTopics : null,
        ai_human_handoff_enabled: responseMode === "ai" ? aiHumanHandoffEnabled : false,
        ai_human_handoff_contact: responseMode === "ai" && aiHumanHandoffEnabled ? aiHumanHandoffContact.trim() || null : null,
        ai_max_response_tokens: responseMode === "ai" ? aiMaxResponseTokens : 300,
        working_hours_enabled: workingHoursEnabled,
        after_hours_mode: afterHoursMode,
        after_hours_message: afterHoursMessage.trim() || null,
        after_hours_contact: afterHoursContact.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // Handle token encryption if changed
      if (botToken && botToken !== "***") {
        // TODO: Call API endpoint to encrypt token
        // For now, we'll just save it (should be encrypted by backend)
        updateData.bot_token = botToken.trim();
      }

      const { error: updateError } = await supabase
        .from("telegram_bots")
        .update(updateData)
        .eq("id", botId);

      if (updateError) {
        console.error("Error updating bot:", updateError);
        setError(updateError.message || "Chyba pri ukladaní nastavení");
        setSaving(false);
        return;
      }

      setSuccess("Nastavenia boli úspešne uložené!");
      setTimeout(() => setSuccess(null), 3000);
      loadBot(); // Reload to get updated data
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Neočakávaná chyba pri ukladaní");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/telegram-bots/${botId}/test-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: botToken && botToken !== "***" ? botToken : undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.connected) {
        setSuccess(`✅ Pripojenie úspešné! Bot: @${data.bot_info?.username || "N/A"}`);
        loadBot(); // Reload to update connection_status
      } else {
        setError(`❌ Chyba pripojenia: ${data.error || "Neznáma chyba"}`);
      }
    } catch (err: any) {
      console.error("Error testing connection:", err);
      setError("Neočakávaná chyba pri teste pripojenia");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !bot) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/telegram-bots/${botId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Späť na prehľad
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/telegram-bots/${botId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Späť na prehľad
          </Button>
          <h1 className="text-3xl font-bold">Nastavenia bota</h1>
          <p className="text-muted-foreground">Kompletné nastavenia pre Telegram bota</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTestConnection}>
            Test pripojenia
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Ukladám..." : "Uložiť zmeny"}
          </Button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="basic">Základné</TabsTrigger>
          <TabsTrigger value="connection">Prepojenie</TabsTrigger>
          <TabsTrigger value="security">Bezpečnosť</TabsTrigger>
          <TabsTrigger value="behavior">Správanie</TabsTrigger>
          <TabsTrigger value="messages">Správy</TabsTrigger>
          <TabsTrigger value="commands">Príkazy</TabsTrigger>
          <TabsTrigger value="integrations">Integrácie</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="schedule">Plánovanie</TabsTrigger>
          <TabsTrigger value="logs">Logy</TabsTrigger>
        </TabsList>

        {/* A) Základné informácie */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Základné informácie</CardTitle>
              <CardDescription>
                Meno, popis, jazyk a základné nastavenia bota
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="botName">
                  Meno bota (interné) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="botName"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="Napríklad: Môj Telegram Bot"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Toto meno sa zobrazí len v dashboarde
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicName">Verejné meno</Label>
                <Input
                  id="publicName"
                  value={publicName}
                  onChange={(e) => setPublicName(e.target.value)}
                  placeholder="Názov, ktorý uvidia používatelia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Popis</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Krátky popis bota..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="botAvatarUrl">URL avatara</Label>
                <Input
                  id="botAvatarUrl"
                  value={botAvatarUrl}
                  onChange={(e) => setBotAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="botLanguage">Jazyk bota</Label>
                <Select value={botLanguage} onValueChange={(value: any) => setBotLanguage(value)}>
                  <SelectTrigger id="botLanguage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SK">Slovenčina</SelectItem>
                    <SelectItem value="EN">English</SelectItem>
                    <SelectItem value="NO">Norsk</SelectItem>
                    <SelectItem value="CZ">Čeština</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Časové pásmo</Label>
                <Select value={timezone} onValueChange={(value) => setTimezone(value)}>
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Oslo">Europe/Oslo</SelectItem>
                    <SelectItem value="Europe/Bratislava">Europe/Bratislava</SelectItem>
                    <SelectItem value="Europe/Prague">Europe/Prague</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* B) Prepojenie */}
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prepojenie s Telegram</CardTitle>
              <CardDescription>
                Bot Token, Webhook a Long Polling nastavenia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="botToken">Bot Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="botToken"
                    type={showToken ? "text" : "password"}
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Token môžeš získať od @BotFather na Telegrame
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  className="mt-2"
                >
                  Overiť token
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Webhook</Label>
                  <p className="text-xs text-muted-foreground">
                    Zapnúť webhook režim
                  </p>
                </div>
                <Switch
                  checked={webhookEnabled}
                  onCheckedChange={setWebhookEnabled}
                />
              </div>

              {webhookEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Long Polling</Label>
                  <p className="text-xs text-muted-foreground">
                    Zapnúť long polling režim (default)
                  </p>
                </div>
                <Switch
                  checked={longPollingEnabled}
                  onCheckedChange={setLongPollingEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Rate Limit (správy za minútu)</Label>
                <Input
                  type="number"
                  value={rateLimitPerMinute}
                  onChange={(e) => setRateLimitPerMinute(parseInt(e.target.value) || 30)}
                  min={1}
                  max={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Cooldown (sekundy)</Label>
                <Input
                  type="number"
                  value={cooldownSeconds}
                  onChange={(e) => setCooldownSeconds(parseInt(e.target.value) || 1)}
                  min={0}
                  max={60}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* C) Bezpečnosť */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prístup a bezpečnosť</CardTitle>
              <CardDescription>
                Whitelist používateľov, admin práva, anti-spam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Režim prístupu</Label>
                <Select value={accessMode} onValueChange={(value: any) => setAccessMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetci</SelectItem>
                    <SelectItem value="whitelist">Whitelist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Povolené typy chatov</Label>
                <div className="space-y-2">
                  {(["private", "group", "channel"] as const).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`chat-${type}`}
                        checked={allowedChatTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAllowedChatTypes([...allowedChatTypes, type]);
                          } else {
                            setAllowedChatTypes(allowedChatTypes.filter(t => t !== type));
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`chat-${type}`} className="font-normal capitalize">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Anti-spam</Label>
                  <p className="text-xs text-muted-foreground">
                    Obmedziť počet správ na používateľa
                  </p>
                </div>
                <Switch
                  checked={antiSpamEnabled}
                  onCheckedChange={setAntiSpamEnabled}
                />
              </div>

              {antiSpamEnabled && (
                <div className="space-y-2">
                  <Label>Max správ na používateľa (za minútu)</Label>
                  <Input
                    type="number"
                    value={messagesPerUserLimit}
                    onChange={(e) => setMessagesPerUserLimit(parseInt(e.target.value) || 10)}
                    min={1}
                    max={100}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Blokovať linky</Label>
                  <p className="text-xs text-muted-foreground">
                    Automaticky blokovať linky v správach
                  </p>
                </div>
                <Switch
                  checked={blockedLinks}
                  onCheckedChange={setBlockedLinks}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gdprPrivacyText">GDPR / Privacy text</Label>
                <Textarea
                  id="gdprPrivacyText"
                  value={gdprPrivacyText}
                  onChange={(e) => setGdprPrivacyText(e.target.value)}
                  placeholder="Čo sa loguje, retention policy..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* D) Správanie bota */}
        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Správanie bota</CardTitle>
              <CardDescription>
                Režim odpovedania a moduly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Režim odpovedania</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setResponseMode("rules")}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      responseMode === "rules"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-border hover:border-blue-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <SettingsIcon className="h-5 w-5 text-blue-500" />
                      {responseMode === "rules" && (
                        <Badge className="bg-blue-500">Vybrané</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">Len bot</h3>
                    <p className="text-sm text-muted-foreground">
                      Bot odpovedá iba podľa pravidiel a šablón
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResponseMode("ai")}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      responseMode === "ai"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-border hover:border-blue-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                      {responseMode === "ai" && (
                        <Badge className="bg-blue-500">Vybrané</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">Bot + AI</h3>
                    <p className="text-sm text-muted-foreground">
                      Bot používa AI pre inteligentné odpovede
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Response delay (ms)</Label>
                <Input
                  type="number"
                  value={responseDelayMs}
                  onChange={(e) => setResponseDelayMs(parseInt(e.target.value) || 500)}
                  min={0}
                  max={5000}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Odpovedať iba na mention</Label>
                  <p className="text-xs text-muted-foreground">
                    V skupinách odpovedať len keď je bot spomenutý
                  </p>
                </div>
                <Switch
                  checked={respondOnlyOnMention}
                  onCheckedChange={setRespondOnlyOnMention}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fallbackMessage">Fallback správa</Label>
                <Textarea
                  id="fallbackMessage"
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  placeholder="Správa keď bot nerozumie..."
                  rows={2}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Moduly</h3>
                <div className="space-y-3">
                  {[
                    { key: "welcome", label: "Welcome & Onboarding", state: moduleWelcome, setState: setModuleWelcome },
                    { key: "help", label: "Help/FAQ", state: moduleHelp, setState: setModuleHelp },
                    { key: "auto_replies", label: "Auto-replies", state: moduleAutoReplies, setState: setModuleAutoReplies },
                    { key: "notifications", label: "Notifications", state: moduleNotifications, setState: setModuleNotifications },
                    { key: "forms", label: "Forms/Surveys", state: moduleForms, setState: setModuleForms },
                    { key: "booking", label: "Booking/Reservations", state: moduleBooking, setState: setModuleBooking },
                    { key: "support_tickets", label: "Support Ticketing", state: moduleSupportTickets, setState: setModuleSupportTickets },
                    { key: "ai_answers", label: "AI Answers", state: moduleAiAnswers, setState: setModuleAiAnswers },
                  ].map(({ key, label, state, setState }) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={`module-${key}`}>{label}</Label>
                      <Switch
                        id={`module-${key}`}
                        checked={state}
                        onCheckedChange={setState}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* H) AI nastavenia */}
        <TabsContent value="ai" className="space-y-4">
          {responseMode === "ai" ? (
            <Card>
              <CardHeader>
                <CardTitle>AI nastavenia</CardTitle>
                <CardDescription>
                  Konfigurácia AI odpovedí pre bota
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Zdroj vedomostí</Label>
                  <div className="space-y-2">
                    {(["faq", "uploaded", "custom", "url"] as const).map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`knowledge-${type}`}
                          checked={aiKnowledgeSourceTypes.has(type)}
                          onChange={(e) => {
                            const newSet = new Set(aiKnowledgeSourceTypes);
                            if (e.target.checked) {
                              newSet.add(type);
                            } else {
                              newSet.delete(type);
                            }
                            setAiKnowledgeSourceTypes(newSet);
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`knowledge-${type}`} className="font-normal capitalize">
                          {type === "faq" ? "FAQ" : type === "uploaded" ? "Nahrané súbory" : type === "custom" ? "Vlastný text" : "URL"}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {aiKnowledgeSourceTypes.has("custom") && (
                  <div className="space-y-2">
                    <Label htmlFor="aiCustomKnowledgeText">Vlastný text vedomostí</Label>
                    <Textarea
                      id="aiCustomKnowledgeText"
                      value={aiCustomKnowledgeText}
                      onChange={(e) => setAiCustomKnowledgeText(e.target.value)}
                      placeholder="Vlastný text s informáciami pre bota..."
                      rows={6}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="aiTone">Tón</Label>
                  <Select value={aiTone} onValueChange={(value: any) => setAiTone(value)}>
                    <SelectTrigger id="aiTone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Priateľský</SelectItem>
                      <SelectItem value="professional">Profesionálny</SelectItem>
                      <SelectItem value="funny">Zábavný</SelectItem>
                      <SelectItem value="custom">Vlastný</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {aiTone === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="aiCustomTone">Vlastný tón</Label>
                    <Textarea
                      id="aiCustomTone"
                      value={aiCustomTone}
                      onChange={(e) => setAiCustomTone(e.target.value)}
                      placeholder="Popíš vlastný tón..."
                      rows={3}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Maximálna dĺžka odpovede (tokeny)</Label>
                  <Input
                    type="number"
                    value={aiMaxResponseTokens}
                    onChange={(e) => setAiMaxResponseTokens(parseInt(e.target.value) || 300)}
                    min={50}
                    max={2000}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Human handoff</Label>
                    <p className="text-xs text-muted-foreground">
                      Presmerovať na človeka keď bot nevie odpovedať
                    </p>
                  </div>
                  <Switch
                    checked={aiHumanHandoffEnabled}
                    onCheckedChange={setAiHumanHandoffEnabled}
                  />
                </div>

                {aiHumanHandoffEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="aiHumanHandoffContact">Kontakt pre handoff</Label>
                    <Input
                      id="aiHumanHandoffContact"
                      value={aiHumanHandoffContact}
                      onChange={(e) => setAiHumanHandoffContact(e.target.value)}
                      placeholder="Telegram username alebo odkaz"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  AI nastavenia sú dostupné len keď je zapnutý režim "Bot + AI"
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* I) Plánovanie */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plánovanie</CardTitle>
              <CardDescription>
                Pracovné hodiny a správy po pracovných hodinách
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pracovné hodiny</Label>
                  <p className="text-xs text-muted-foreground">
                    Zapnúť pracovné hodiny
                  </p>
                </div>
                <Switch
                  checked={workingHoursEnabled}
                  onCheckedChange={setWorkingHoursEnabled}
                />
              </div>

              {workingHoursEnabled && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Konfigurácia pracovných hodín bude dostupná neskôr
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Režim mimo pracovných hodín</Label>
                <Select value={afterHoursMode} onValueChange={(value: any) => setAfterHoursMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto_reply">Auto reply</SelectItem>
                    <SelectItem value="disable_ai">Vypnúť AI</SelectItem>
                    <SelectItem value="redirect_contact">Presmerovať na kontakt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {afterHoursMode === "auto_reply" && (
                <div className="space-y-2">
                  <Label htmlFor="afterHoursMessage">Správa mimo pracovných hodín</Label>
                  <Textarea
                    id="afterHoursMessage"
                    value={afterHoursMessage}
                    onChange={(e) => setAfterHoursMessage(e.target.value)}
                    placeholder="Správa, ktorá sa pošle mimo pracovných hodín..."
                    rows={3}
                  />
                </div>
              )}

              {afterHoursMode === "redirect_contact" && (
                <div className="space-y-2">
                  <Label htmlFor="afterHoursContact">Kontakt</Label>
                  <Input
                    id="afterHoursContact"
                    value={afterHoursContact}
                    onChange={(e) => setAfterHoursContact(e.target.value)}
                    placeholder="Telegram username alebo odkaz"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* E) Správy a šablóny - Placeholder */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Správy a šablóny</CardTitle>
              <CardDescription>
                Editor šablón správ (welcome, help, atď.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Editor šablón správ bude implementovaný neskôr
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* F) Príkazy - Placeholder */}
        <TabsContent value="commands">
          <Card>
            <CardHeader>
              <CardTitle>Príkazy & Flow</CardTitle>
              <CardDescription>
                Builder pre príkazy a flow akcie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Command & Flow builder bude implementovaný neskôr
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* G) Integrácie - Placeholder */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrácie</CardTitle>
              <CardDescription>
                Webhooks a externé integrácie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Integrácie budú implementované neskôr
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* J) Logy - Redirect to logs page */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logy & Monitoring</CardTitle>
              <CardDescription>
                Prehľad udalostí a chýb bota
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href={`/dashboard/telegram-bots/${botId}/logs`}>
                  Otvoriť logy
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}