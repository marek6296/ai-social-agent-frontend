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
  Sparkles,
  Settings as SettingsIcon,
  MessageSquare,
  ExternalLink,
  Copy,
  Users,
  Shield,
  Clock,
  Globe,
  Info,
  Zap,
  Lock,
  Ban,
  Calendar,
} from "lucide-react";
import type { TelegramBot, TelegramBotLanguage, TelegramResponseMode, TelegramAITone, TelegramChatType, TelegramAccessMode } from "@/lib/types/telegram";

export default function TelegramBotSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<"active" | "inactive" | "error" | "draft">("draft");

  const [bot, setBot] = useState<TelegramBot | null>(null);

  // Základné informácie
  const [botName, setBotName] = useState("");
  const [publicName, setPublicName] = useState("");
  const [description, setDescription] = useState("");
  const [botLanguage, setBotLanguage] = useState<TelegramBotLanguage>("SK");
  const [timezone, setTimezone] = useState("Europe/Bratislava");

  // Prepojenie
  const [botToken, setBotToken] = useState("");

  // Správanie bota
  const [responseMode, setResponseMode] = useState<TelegramResponseMode>("rules");
  const [fallbackMessage, setFallbackMessage] = useState("Prepáč, nerozumiem tejto správe.");
  const [moduleWelcome, setModuleWelcome] = useState(false);
  const [moduleHelp, setModuleHelp] = useState(false);
  const [moduleAutoReplies, setModuleAutoReplies] = useState(true);
  
  // Pokročilé správanie
  const [responseDelayMs, setResponseDelayMs] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(1);
  const [respondOnlyOnMention, setRespondOnlyOnMention] = useState(false);

  // Prístup a bezpečnosť
  const [accessMode, setAccessMode] = useState<TelegramAccessMode>("all");
  const [allowedUsers, setAllowedUsers] = useState<string>(""); // Comma-separated
  const [allowedChatTypes, setAllowedChatTypes] = useState<Set<TelegramChatType>>(new Set(["private", "group"]));
  const [adminUsers, setAdminUsers] = useState<string>(""); // Comma-separated

  // Anti-spam
  const [antiSpamEnabled, setAntiSpamEnabled] = useState(false);
  const [messagesPerUserLimit, setMessagesPerUserLimit] = useState(5);
  const [blockedKeywords, setBlockedKeywords] = useState<string>(""); // Comma-separated
  const [blockedLinks, setBlockedLinks] = useState(false);

  // AI nastavenia
  const [aiKnowledgeSourceTypes, setAiKnowledgeSourceTypes] = useState<Set<"faq" | "custom">>(new Set());
  const [aiCustomKnowledgeText, setAiCustomKnowledgeText] = useState("");
  const [aiTone, setAiTone] = useState<TelegramAITone>("friendly");
  const [aiMaxResponseTokens, setAiMaxResponseTokens] = useState(300);
  const [aiForbiddenTopics, setAiForbiddenTopics] = useState<string>(""); // Comma-separated
  const [aiHumanHandoffEnabled, setAiHumanHandoffEnabled] = useState(false);
  const [aiHumanHandoffContact, setAiHumanHandoffContact] = useState("");

  // Šablóny správ
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [helpMessage, setHelpMessage] = useState("");

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
      
      setBotName(botData.bot_name || "");
      setPublicName(botData.public_name || "");
      setDescription(botData.description || "");
      setBotLanguage(botData.bot_language || "SK");
      setTimezone(botData.timezone || "Europe/Bratislava");
      setBotToken(botData.bot_token ? "***" : "");
      setResponseMode(botData.response_mode || "rules");
      setFallbackMessage(botData.fallback_message || "Prepáč, nerozumiem tejto správe.");
      setModuleWelcome(botData.module_welcome || false);
      setModuleHelp(botData.module_help || false);
      setModuleAutoReplies(botData.module_auto_replies !== false);
      
      // Pokročilé správanie
      setResponseDelayMs(botData.response_delay_ms || 0);
      setCooldownSeconds(botData.cooldown_seconds || 1);
      setRespondOnlyOnMention(botData.respond_only_on_mention || false);
      
      // Prístup a bezpečnosť
      setAccessMode(botData.access_mode || "all");
      setAllowedUsers(botData.allowed_users?.join(", ") || "");
      setAllowedChatTypes(new Set(botData.allowed_chat_types || ["private", "group"]));
      setAdminUsers(botData.admin_users?.join(", ") || "");
      
      // Anti-spam
      setAntiSpamEnabled(botData.anti_spam_enabled || false);
      setMessagesPerUserLimit(botData.messages_per_user_limit || 5);
      setBlockedKeywords(botData.blocked_keywords?.join(", ") || "");
      setBlockedLinks(botData.blocked_links || false);
      
      // Set bot status
      setBotStatus(botData.status || "draft");
      
      if (botData.ai_knowledge_source_types) {
        setAiKnowledgeSourceTypes(new Set(botData.ai_knowledge_source_types.filter((t: string) => t === "faq" || t === "custom")));
      }
      setAiCustomKnowledgeText(botData.ai_custom_knowledge_text || "");
      setAiTone(botData.ai_tone || "friendly");
      setAiMaxResponseTokens(botData.ai_max_response_tokens || 300);
      setAiForbiddenTopics(botData.ai_forbidden_topics?.join(", ") || "");
      setAiHumanHandoffEnabled(botData.ai_human_handoff_enabled || false);
      setAiHumanHandoffContact(botData.ai_human_handoff_contact || "");
      
      // Load templates
      const { data: templates } = await supabase
        .from("telegram_bot_templates")
        .select("*")
        .eq("bot_id", botId);
      
      if (templates) {
        const welcomeTemplate = templates.find((t: any) => t.template_name === "welcome");
        const helpTemplate = templates.find((t: any) => t.template_name === "help");
        setWelcomeMessage(welcomeTemplate?.template_text || "");
        setHelpMessage(helpTemplate?.template_text || "");
      }
      
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
        bot_language: botLanguage,
        timezone: timezone,
        response_mode: responseMode,
        fallback_message: fallbackMessage.trim(),
        module_welcome: moduleWelcome,
        module_help: moduleHelp,
        module_auto_replies: moduleAutoReplies,
        
        // Pokročilé správanie
        response_delay_ms: responseDelayMs,
        cooldown_seconds: cooldownSeconds,
        respond_only_on_mention: respondOnlyOnMention,
        
        // Prístup a bezpečnosť
        access_mode: accessMode,
        allowed_users: accessMode === "whitelist" && allowedUsers.trim() ? allowedUsers.split(",").map(u => u.trim()).filter(Boolean) : null,
        allowed_chat_types: Array.from(allowedChatTypes),
        admin_users: adminUsers.trim() ? adminUsers.split(",").map(u => u.trim()).filter(Boolean) : null,
        
        // Anti-spam
        anti_spam_enabled: antiSpamEnabled,
        messages_per_user_limit: messagesPerUserLimit,
        blocked_keywords: blockedKeywords.trim() ? blockedKeywords.split(",").map(k => k.trim()).filter(Boolean) : null,
        blocked_links: blockedLinks,
        
        // AI nastavenia
        ai_knowledge_source_types: responseMode === "ai" && aiKnowledgeSourceTypes.size > 0 ? Array.from(aiKnowledgeSourceTypes) : null,
        ai_custom_knowledge_text: responseMode === "ai" && aiKnowledgeSourceTypes.has("custom") ? aiCustomKnowledgeText.trim() || null : null,
        ai_tone: responseMode === "ai" ? aiTone : "friendly",
        ai_max_response_tokens: responseMode === "ai" ? aiMaxResponseTokens : 300,
        ai_forbidden_topics: responseMode === "ai" && aiForbiddenTopics.trim() ? aiForbiddenTopics.split(",").map(t => t.trim()).filter(Boolean) : null,
        ai_human_handoff_enabled: responseMode === "ai" ? aiHumanHandoffEnabled : false,
        ai_human_handoff_contact: responseMode === "ai" && aiHumanHandoffEnabled ? aiHumanHandoffContact.trim() || null : null,
        
        updated_at: new Date().toISOString(),
      };

      // Handle token encryption if changed
      if (botToken && botToken !== "***") {
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

      // Save templates (upsert - create or update)
      if (welcomeMessage.trim()) {
        await supabase
          .from("telegram_bot_templates")
          .upsert({
            bot_id: botId,
            template_name: "welcome",
            template_text: welcomeMessage.trim(),
            template_variables: ["{first_name}", "{username}"],
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "bot_id,template_name"
          });
      } else {
        await supabase
          .from("telegram_bot_templates")
          .delete()
          .eq("bot_id", botId)
          .eq("template_name", "welcome");
      }

      if (helpMessage.trim()) {
        await supabase
          .from("telegram_bot_templates")
          .upsert({
            bot_id: botId,
            template_name: "help",
            template_text: helpMessage.trim(),
            template_variables: [],
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "bot_id,template_name"
          });
      } else {
        await supabase
          .from("telegram_bot_templates")
          .delete()
          .eq("bot_id", botId)
          .eq("template_name", "help");
      }

      setSuccess("Nastavenia boli uložené!");
      setSaving(false);
    } catch (err: any) {
      console.error("Error saving:", err);
      setError(err.message || "Chyba pri ukladaní");
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setError(null);
    setSuccess(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("Nie si prihlásený");
        return;
      }

      const response = await fetch(`/api/telegram-bots/${botId}/test-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Chyba pri testovaní pripojenia");
        return;
      }

      if (data.bot?.username) {
        setBotUsername(data.bot.username);
        setSuccess("✅ Pripojenie úspešné! Bot: @" + data.bot.username);
      } else {
        setError("Bot token nie je platný");
      }
    } catch (err: any) {
      console.error("Error testing connection:", err);
      setError("Chyba pri testovaní pripojenia");
    }
  };

  const copyBotLink = () => {
    if (botUsername) {
      navigator.clipboard.writeText(`https://t.me/${botUsername}`);
      setSuccess("Odkaz bol skopírovaný!");
      setTimeout(() => setSuccess(null), 3000);
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
          <p className="text-muted-foreground">Spravuj nastavenia svojho Telegram bota</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Ukladám..." : "Uložiť zmeny"}
        </Button>
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

      {/* Bot Status / Activate */}
      <Card>
        <CardContent className="pt-6">
          {botStatus === 'active' ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-green-700 dark:text-green-400 mb-2">
                    ✅ <strong>Bot je aktívny</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Telegram Bot Service beží a bot je pripojený k Telegram API. Bot reaguje na správy podľa nastavení nižšie.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { data: userData } = await supabase.auth.getUser();
                    if (!userData.user) return;
                    
                    setSaving(true);
                    const { error } = await supabase
                      .from("telegram_bots")
                      .update({ status: 'inactive' })
                      .eq("id", botId)
                      .eq("user_id", userData.user.id);
                    
                    if (!error) {
                      setBotStatus('inactive');
                      setBot((prev) => prev ? { ...prev, status: 'inactive' as const } : null);
                      setSuccess("Bot bol deaktivovaný!");
                    } else {
                      setError("Chyba pri deaktivácii: " + error.message);
                    }
                    setSaving(false);
                  }}
                  disabled={saving}
                  className="ml-4"
                >
                  Deaktivovať
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                    ⚠️ <strong>Bot je momentálne neaktívny</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Telegram Bot Service musí byť spustený a bot musí mať status "active" v databáze.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    const { data: userData } = await supabase.auth.getUser();
                    if (!userData.user) {
                      setError("Nie si prihlásený");
                      return;
                    }
                    
                    setSaving(true);
                    const { error } = await supabase
                      .from("telegram_bots")
                      .update({ 
                        status: 'active',
                        long_polling_enabled: true,
                        updated_at: new Date().toISOString()
                      })
                      .eq("id", botId)
                      .eq("user_id", userData.user.id);
                    
                    if (error) {
                      setError("Chyba pri aktivácii bota: " + error.message);
                      setSaving(false);
                    } else {
                      setSuccess("Bot bol aktivovaný! Service sa automaticky pripojí za pár sekúnd.");
                      setBotStatus('active');
                      setBot((prev) => prev ? { ...prev, status: 'active' as const, long_polling_enabled: true } : null);
                    }
                    setSaving(false);
                  }}
                  disabled={saving}
                  className="ml-4"
                >
                  {saving ? "Aktivujem..." : "Aktivovať bota"}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-2">
                <div>
                  <strong>📝 Jednoduchý postup (STAČÍ KLIKNÚŤ):</strong>
                  <ol className="mt-1 ml-4 list-decimal space-y-1">
                    <li>Klikni na modré tlačidlo <strong>"Aktivovať bota"</strong> vyššie 👆</li>
                    <li>Status sa zmení na "active" v databáze</li>
                    <li>Telegram Bot Service (ktorý už beží) automaticky deteguje zmenu</li>
                    <li>Bot sa pripojí k Telegram API (môže to trvať 30 sekúnd, service kontroluje každých 30 sekúnd)</li>
                  </ol>
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    💡 Tip: Ak chceš rýchlejšie pripojenie, reštartuj service v termináli (Ctrl+C a potom znovu npm run dev)
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <strong>🔧 Ak service nebeží:</strong>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
{`cd telegram-bot-service
npm run dev`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">
            <Globe className="h-4 w-4 mr-2" />
            Základné
          </TabsTrigger>
          <TabsTrigger value="connection">
            <Bot className="h-4 w-4 mr-2" />
            Prepojenie
          </TabsTrigger>
          <TabsTrigger value="behavior">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Správanie
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Bezpečnosť
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Správy
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="h-4 w-4 mr-2" />
            AI
          </TabsTrigger>
        </TabsList>

        {/* 1. ZÁKLADNÉ INFORMÁCIE */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Základné informácie
              </CardTitle>
              <CardDescription>
                Meno, popis a jazykové nastavenia bota
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="botName">
                  Interné meno bota <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="botName"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="Napríklad: Môj Telegram Bot"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Toto meno sa zobrazí len v tvojom dashboarde pre identifikáciu bota. Používatelia ho nevidia.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicName">Verejné meno bota</Label>
                <Input
                  id="publicName"
                  value={publicName}
                  onChange={(e) => setPublicName(e.target.value)}
                  placeholder="Napríklad: Môj Support Bot"
                />
                <p className="text-xs text-muted-foreground">
                  Meno, ktoré sa zobrazí používateľom v Telegrame. Používa sa v AI odpovediach a komunikácii. Ak necháš prázdne, použije sa interné meno.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Popis bota</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Krátky popis, na čo sa bot používa a aké služby poskytuje..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Popis bota, ktorý pomôže AI lepšie rozumieť jeho účelu. Môžeš tu napísať, čo bot robí a aké služby poskytuje.
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Primárny jazyk, v ktorom bude bot odpovedať. AI odpovede budú v tomto jazyku.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Časové pásmo</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Bratislava">Europe/Bratislava (SK/CZ)</SelectItem>
                    <SelectItem value="Europe/Prague">Europe/Prague</SelectItem>
                    <SelectItem value="Europe/Oslo">Europe/Oslo (NO)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (UK)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (US EST)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (US PST)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Časové pásmo pre plánované správy a časové funkcie bota.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. PREPOJENIE */}
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Prepojenie s Telegram
              </CardTitle>
              <CardDescription>
                Pridaj Telegram Bot Token a otestuj pripojenie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="botToken">
                  Bot Token <span className="text-red-500">*</span>
                </Label>
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
                  Telegram Bot Token získáš od @BotFather na Telegrame. Pošli mu príkaz <code className="bg-muted px-1 rounded">/newbot</code> a postupuj podľa inštrukcií.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  className="mt-2"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Overiť token
                </Button>
              </div>

              {botUsername && (
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                      Bot je pripojený!
                    </CardTitle>
                    <CardDescription>
                      Tvoj bot: <strong>@{botUsername}</strong>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Odkaz na bota</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={`https://t.me/${botUsername}`}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={copyBotLink}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-background rounded-lg border">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Ako pridať bota do skupiny alebo chatu?
                      </h4>
                      <ol className="space-y-2 text-sm list-decimal list-inside">
                        <li>
                          Klikni na odkaz vyššie alebo nájdi bota na Telegrame: <strong>@{botUsername}</strong>
                        </li>
                        <li>
                          Klikni na <strong>"Začať"</strong> (Start) aby si spustil súkromný chat s botom
                        </li>
                        <li>
                          <strong>Pre pridanie do skupiny:</strong>
                          <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                            <li>Choď do skupiny, kam chceš pridať bota</li>
                            <li>Klikni na názov skupiny (hore) → <strong>Pridať členov</strong></li>
                            <li>Nájdi a vyber bota <strong>@{botUsername}</strong></li>
                            <li>Klikni na <strong>Pridať</strong></li>
                            <li><strong>Dôležité:</strong> V nastaveniach skupiny daj botovi práva na čítanie správ</li>
                            <li>V @BotFather nastav <strong>"Group Privacy"</strong> na <strong>"Turn off"</strong> (aby bot videl všetky správy)</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Pre súkromný chat:</strong> Jednoducho pošli správu botovi a on ti odpovie
                        </li>
                      </ol>
                      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          💡 Tip: V skupine môžeš bota spomenúť pomocou @{botUsername}, aby odpovedal na tvoju správu
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. SPRÁVANIE BOTA */}
        <TabsContent value="behavior" className="space-y-4">
          {/* Režim odpovedania */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Režim odpovedania
              </CardTitle>
              <CardDescription>
                Vyber, ako má bot odpovedať na správy
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      <Badge className="bg-blue-500">Aktívne</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">Len bot (Rules)</h3>
                  <p className="text-sm text-muted-foreground">
                    Bot odpovedá iba podľa pravidiel, príkazov a šablón, ktoré nastavíš. Jednoduchý, rýchly a bez AI.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    ✅ Odporúčané pre: Jednoduché FAQ, automatické odpovede, príkazy
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
                      <Badge className="bg-blue-500">Aktívne</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">Bot + AI</h3>
                  <p className="text-sm text-muted-foreground">
                    Bot používa AI pre inteligentné odpovede na otázky. Kombinuje tvoje nastavenia s AI schopnosťami.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    ✅ Odporúčané pre: Podpora zákazníkov, komplexné FAQ, prirodzená konverzácia
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Funkcie bota */}
          <Card>
            <CardHeader>
              <CardTitle>Zapnuté funkcie</CardTitle>
              <CardDescription>
                Ktoré funkcie má bot mať zapnuté
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="moduleWelcome" className="font-semibold">Úvodná správa (Welcome)</Label>
                  <p className="text-xs text-muted-foreground">
                    Pošle úvodnú správu novým používateľom pri príkaze /start. Môžeš nastaviť text v sekcii "Správy".
                  </p>
                </div>
                <Switch
                  id="moduleWelcome"
                  checked={moduleWelcome}
                  onCheckedChange={setModuleWelcome}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="moduleHelp" className="font-semibold">Pomocný príkaz /help</Label>
                  <p className="text-xs text-muted-foreground">
                    Bot odpovie na príkaz /help s informáciami. Môžeš nastaviť text v sekcii "Správy".
                  </p>
                </div>
                <Switch
                  id="moduleHelp"
                  checked={moduleHelp}
                  onCheckedChange={setModuleHelp}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="moduleAutoReplies" className="font-semibold">Automatické odpovede</Label>
                  <p className="text-xs text-muted-foreground">
                    Bot automaticky odpovedá na správy podľa nastaveného režimu (Rules alebo AI). Ak je vypnuté, bot nereaguje na správy.
                  </p>
                </div>
                <Switch
                  id="moduleAutoReplies"
                  checked={moduleAutoReplies}
                  onCheckedChange={setModuleAutoReplies}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pokročilé nastavenia správania */}
          <Card>
            <CardHeader>
              <CardTitle>Pokročilé nastavenia správania</CardTitle>
              <CardDescription>
                Doplňujúce nastavenia pre správanie bota
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fallbackMessage">Fallback správa (keď bot nerozumie)</Label>
                <Textarea
                  id="fallbackMessage"
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  placeholder="Prepáč, nerozumiem tejto správe. Skús napísať inak alebo použij /help"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Táto správa sa pošle, keď bot nevie odpovedať na otázku alebo nerozumie príkazu.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="responseDelayMs">Oneskorenie odpovede (ms)</Label>
                  <Input
                    id="responseDelayMs"
                    type="number"
                    min="0"
                    max="5000"
                    step="100"
                    value={responseDelayMs}
                    onChange={(e) => setResponseDelayMs(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Koľko milisekúnd má bot počkať pred odoslaním odpovede. Umožňuje simulovať "písanie". (0 = okamžite)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cooldownSeconds">Cooldown medzi odpoveďami (sekundy)</Label>
                  <Input
                    id="cooldownSeconds"
                    type="number"
                    min="0"
                    max="60"
                    value={cooldownSeconds}
                    onChange={(e) => setCooldownSeconds(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimálny čas medzi odpoveďami v tom istom chate. Zabraňuje spamovaniu. (0 = žiadny cooldown)
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="respondOnlyOnMention" className="font-semibold">Odpovedať len keď je spomenutý (v skupinách)</Label>
                  <p className="text-xs text-muted-foreground">
                    V skupinách bude bot odpovedať len keď je explicitne spomenutý pomocou @bot_username. V súkromných správach vždy odpovedá.
                  </p>
                </div>
                <Switch
                  id="respondOnlyOnMention"
                  checked={respondOnlyOnMention}
                  onCheckedChange={setRespondOnlyOnMention}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. BEZPEČNOSŤ A PRÍSTUP */}
        <TabsContent value="security" className="space-y-4">
          {/* Prístup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Prístup a oprávnenia
              </CardTitle>
              <CardDescription>
                Kto môže komunikovať s botom a kto má admin práva
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Režim prístupu</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAccessMode("all")}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      accessMode === "all"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-border hover:border-blue-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      {accessMode === "all" && (
                        <Badge className="bg-blue-500">Aktívne</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">Všetci používatelia</h3>
                    <p className="text-sm text-muted-foreground">
                      Bot môže komunikovať s každým používateľom na Telegrame. Odporúčané pre verejné boty.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccessMode("whitelist")}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      accessMode === "whitelist"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-border hover:border-blue-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      {accessMode === "whitelist" && (
                        <Badge className="bg-blue-500">Aktívne</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">Len povolení používatelia</h3>
                    <p className="text-sm text-muted-foreground">
                      Bot komunikuje len s používateľmi v zozname povolených. Odporúčané pre interné boty.
                    </p>
                  </button>
                </div>
              </div>

              {accessMode === "whitelist" && (
                <div className="space-y-2">
                  <Label htmlFor="allowedUsers">Povolení používatelia (whitelist)</Label>
                  <Textarea
                    id="allowedUsers"
                    value={allowedUsers}
                    onChange={(e) => setAllowedUsers(e.target.value)}
                    placeholder="@username1, @username2, 123456789"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Zoznam Telegram username alebo user ID (oddelené čiarkou). Napríklad: <code className="bg-muted px-1 rounded">@marek, @peter, 123456789</code>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Typy chatov, kde môže bot fungovať</Label>
                <div className="space-y-2">
                  {(["private", "group", "channel"] as TelegramChatType[]).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`chat-type-${type}`}
                        checked={allowedChatTypes.has(type)}
                        onChange={(e) => {
                          const newSet = new Set(allowedChatTypes);
                          if (e.target.checked) {
                            newSet.add(type);
                          } else {
                            newSet.delete(type);
                          }
                          setAllowedChatTypes(newSet);
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`chat-type-${type}`} className="font-normal cursor-pointer">
                        {type === "private" && "💬 Súkromné správy (DM)"}
                        {type === "group" && "👥 Skupiny"}
                        {type === "channel" && "📢 Kanály"}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Vyber typy chatov, kde má bot fungovať. Musíš vybrať aspoň jeden typ.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminUsers">Admin používatelia</Label>
                <Textarea
                  id="adminUsers"
                  value={adminUsers}
                  onChange={(e) => setAdminUsers(e.target.value)}
                  placeholder="@admin1, @admin2, 123456789"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Zoznam Telegram username alebo user ID používateľov s admin oprávneniami. Môžu meniť nastavenia bota cez príkazy. (Oddelené čiarkou)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Anti-spam */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Anti-spam ochrana
              </CardTitle>
              <CardDescription>
                Ochrana pred spamom a zneužitím bota
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="antiSpamEnabled" className="font-semibold">Zapnúť anti-spam ochranu</Label>
                  <p className="text-xs text-muted-foreground">
                    Aktivuje ochranu pred spamom a zneužitím bota.
                  </p>
                </div>
                <Switch
                  id="antiSpamEnabled"
                  checked={antiSpamEnabled}
                  onCheckedChange={setAntiSpamEnabled}
                />
              </div>

              {antiSpamEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="messagesPerUserLimit">Maximálny počet správ na používateľa</Label>
                    <Input
                      id="messagesPerUserLimit"
                      type="number"
                      min="1"
                      max="100"
                      value={messagesPerUserLimit}
                      onChange={(e) => setMessagesPerUserLimit(parseInt(e.target.value) || 5)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximálny počet správ, ktoré môže používateľ odoslať za určité obdobie. Zabraňuje spamovaniu.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blockedKeywords">Blokované kľúčové slová</Label>
                    <Textarea
                      id="blockedKeywords"
                      value={blockedKeywords}
                      onChange={(e) => setBlockedKeywords(e.target.value)}
                      placeholder="spam, reklama, podvod"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      Zoznam kľúčových slov oddelených čiarkou. Bot ignoruje správy obsahujúce tieto slová.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="blockedLinks" className="font-semibold">Blokovať správy s odkazmi</Label>
                      <p className="text-xs text-muted-foreground">
                        Bot ignoruje všetky správy, ktoré obsahujú URL odkazy.
                      </p>
                    </div>
                    <Switch
                      id="blockedLinks"
                      checked={blockedLinks}
                      onCheckedChange={setBlockedLinks}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. SPRÁVY A ŠABLÓNY */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Správy a šablóny
              </CardTitle>
              <CardDescription>
                Úvodné správy a šablóny pre bota. Môžeš použiť premenné: {"{first_name}"}, {"{username}"}, {"{language}"}, {"{time}"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="welcomeMessage">
                    Úvodná správa (Welcome)
                  </Label>
                  <Badge variant={moduleWelcome ? "default" : "outline"} className="text-xs">
                    {moduleWelcome ? "Zapnuté" : "Vypnuté"}
                  </Badge>
                </div>
                <Textarea
                  id="welcomeMessage"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Vitaj {first_name}! 👋 Som tvoj asistent a som tu, aby som ti pomohol. Napíš /help pre pomoc."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Táto správa sa pošle, keď používateľ spustí bota príkazom /start. Zapni funkciu v sekcii "Správanie".
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="helpMessage">
                    Pomocná správa (Help)
                  </Label>
                  <Badge variant={moduleHelp ? "default" : "outline"} className="text-xs">
                    {moduleHelp ? "Zapnuté" : "Vypnuté"}
                  </Badge>
                </div>
                <Textarea
                  id="helpMessage"
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  placeholder="Pomoc\n\n/start - Začať\n/help - Zobraziť túto pomoc\n\nMôžeš sa ma opýtať na čokoľvek a ja ti odpoviem!"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Táto správa sa pošle, keď používateľ použije príkaz /help. Zapni funkciu v sekcii "Správanie".
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm font-medium mb-2">💡 Premenné, ktoré môžeš použiť v správach:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li><code className="bg-muted px-1.5 py-0.5 rounded">{"{first_name}"}</code> - Krstné meno používateľa (napr. "Marek")</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded">{"{username}"}</code> - Telegram username používateľa (napr. "marek123")</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded">{"{language}"}</code> - Jazyk bota (napr. "SK")</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded">{"{time}"}</code> - Aktuálny dátum a čas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. AI NASTAVENIA */}
        <TabsContent value="ai" className="space-y-4">
          {responseMode === "ai" ? (
            <>
              {/* Zdroj vedomostí */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Zdroj vedomostí pre AI
                  </CardTitle>
                  <CardDescription>
                    Odkiaľ má AI čerpať informácie pre odpovede
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-3 rounded-lg border">
                      <input
                        type="checkbox"
                        id="knowledge-faq"
                        checked={aiKnowledgeSourceTypes.has("faq")}
                        onChange={(e) => {
                          const newSet = new Set(aiKnowledgeSourceTypes);
                          if (e.target.checked) {
                            newSet.add("faq");
                          } else {
                            newSet.delete("faq");
                          }
                          setAiKnowledgeSourceTypes(newSet);
                        }}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <Label htmlFor="knowledge-faq" className="font-semibold cursor-pointer">FAQ (Často kladené otázky)</Label>
                        <p className="text-xs text-muted-foreground">
                          AI bude používať FAQ položky z tvojho systému. Môžeš ich spravovať v sekcii "FAQ" v dashboarde.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-3 rounded-lg border">
                      <input
                        type="checkbox"
                        id="knowledge-custom"
                        checked={aiKnowledgeSourceTypes.has("custom")}
                        onChange={(e) => {
                          const newSet = new Set(aiKnowledgeSourceTypes);
                          if (e.target.checked) {
                            newSet.add("custom");
                          } else {
                            newSet.delete("custom");
                          }
                          setAiKnowledgeSourceTypes(newSet);
                        }}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <Label htmlFor="knowledge-custom" className="font-semibold cursor-pointer">Vlastný text</Label>
                        <p className="text-xs text-muted-foreground">
                          Vlastný text s informáciami, ktoré má AI používať pri odpovediach. Užitočné pre firemné informácie, produkty, služby.
                        </p>
                      </div>
                    </div>
                  </div>

                  {aiKnowledgeSourceTypes.has("custom") && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label htmlFor="aiCustomKnowledgeText">Vlastný text vedomostí</Label>
                      <Textarea
                        id="aiCustomKnowledgeText"
                        value={aiCustomKnowledgeText}
                        onChange={(e) => setAiCustomKnowledgeText(e.target.value)}
                        placeholder="Napíš tu informácie o svojej firme, produktoch, službách, ktoré má AI používať pri odpovediach..."
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Tento text AI použije ako kontext pri generovaní odpovedí. Môžeš tu napísať informácie o firme, produktoch, službách, cenníky, atď.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tón a štýl */}
              <Card>
                <CardHeader>
                  <CardTitle>Tón a štýl AI odpovedí</CardTitle>
                  <CardDescription>
                    Ako má AI komunikovať s používateľmi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="aiTone">Tón komunikácie</Label>
                    <Select value={aiTone} onValueChange={(value: any) => setAiTone(value)}>
                      <SelectTrigger id="aiTone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">Priateľský</SelectItem>
                        <SelectItem value="professional">Profesionálny</SelectItem>
                        <SelectItem value="funny">Vtipný</SelectItem>
                        <SelectItem value="custom">Vlastný</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Tón, ktorým bude AI komunikovať. "Priateľský" je odporúčaný pre väčšinu prípadov.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aiMaxResponseTokens">Maximálna dĺžka odpovede (tokeny)</Label>
                    <Input
                      id="aiMaxResponseTokens"
                      type="number"
                      min="50"
                      max="1000"
                      step="50"
                      value={aiMaxResponseTokens}
                      onChange={(e) => setAiMaxResponseTokens(parseInt(e.target.value) || 300)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximálny počet tokenov (približne 1 token = 0.75 slova) v AI odpovedi. Nižšie hodnoty = kratšie odpovede. (Odporúčané: 200-400)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Bezpečnosť AI */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Bezpečnosť a obmedzenia AI
                  </CardTitle>
                  <CardDescription>
                    Nastavenia pre bezpečnú AI komunikáciu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="aiForbiddenTopics">Zakázané témy</Label>
                    <Textarea
                      id="aiForbiddenTopics"
                      value={aiForbiddenTopics}
                      onChange={(e) => setAiForbiddenTopics(e.target.value)}
                      placeholder="politika, násilie, drogy"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      Zoznam tém oddelených čiarkou, o ktorých AI nesmie hovoriť. Ak používateľ položí otázku na tieto témy, AI odmietne odpovedať alebo presmeruje na kontakt.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="aiHumanHandoffEnabled" className="font-semibold">Eskalácia na človeka</Label>
                      <p className="text-xs text-muted-foreground">
                        Keď AI nevie odpovedať alebo používateľ chce hovoriť s človekom, presmeruje ho na kontakt.
                      </p>
                    </div>
                    <Switch
                      id="aiHumanHandoffEnabled"
                      checked={aiHumanHandoffEnabled}
                      onCheckedChange={setAiHumanHandoffEnabled}
                    />
                  </div>

                  {aiHumanHandoffEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="aiHumanHandoffContact">Kontakt pre eskaláciu</Label>
                      <Input
                        id="aiHumanHandoffContact"
                        value={aiHumanHandoffContact}
                        onChange={(e) => setAiHumanHandoffContact(e.target.value)}
                        placeholder="@support, email@example.com, alebo text správy"
                      />
                      <p className="text-xs text-muted-foreground">
                        Kontakt, na ktorý AI presmeruje používateľa, keď nevie odpovedať alebo používateľ chce hovoriť s človekom.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">AI nastavenia nie sú dostupné</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI nastavenia sa zobrazujú len keď je zapnutý režim "Bot + AI" v sekcii "Správanie".
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const tabs = document.querySelector('[role="tablist"]') as HTMLElement;
                      const behaviorTab = Array.from(tabs?.querySelectorAll('[role="tab"]') || []).find(
                        (tab) => tab.textContent?.includes("Správanie")
                      ) as HTMLElement;
                      behaviorTab?.click();
                    }}
                  >
                    Prejsť na Správanie
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
