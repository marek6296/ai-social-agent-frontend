"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Settings,
  Bot,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Server,
  MessageSquare,
  Calendar,
  Key,
  Hash,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type DiscordBot = {
  id: string;
  bot_name: string;
  bot_avatar_url: string | null;
  description: string | null;
  bot_token: string | null;
  bot_client_id: string | null;
  bot_type: "custom" | "shared";
  status: "inactive" | "active" | "error";
  tone: "friendly" | "professional" | "casual" | "formal";
  welcome_message: string | null;
  system_prompt: string | null;
  monthly_message_limit: number | null;
  max_servers: number | null;
  messages_this_month: number;
  total_servers: number;
  total_messages: number;
  created_at: string;
  updated_at: string;
};

export default function DiscordBotSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  const [bot, setBot] = useState<DiscordBot | null>(null);
  const [botName, setBotName] = useState("");
  const [description, setDescription] = useState("");
  const [botToken, setBotToken] = useState("");
  const [botClientId, setBotClientId] = useState("");
  const [tone, setTone] = useState<"friendly" | "professional" | "casual" | "formal">("friendly");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  
  // Bot behavior settings
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [respondToMentions, setRespondToMentions] = useState(true);
  const [respondToAllMessages, setRespondToAllMessages] = useState(false);
  const [respondInThreads, setRespondInThreads] = useState(true);
  const [mentionInReply, setMentionInReply] = useState(false);
  
  // Basic settings
  const [botLanguage, setBotLanguage] = useState("SK");
  const [maxResponseTokens, setMaxResponseTokens] = useState(300);
  
  // Response mode (Bot + AI / Len Bot)
  const [responseMode, setResponseMode] = useState<"ai" | "rules">("ai");
  
  // Extended AI Chat settings
  const [knowledgeSourceTypes, setKnowledgeSourceTypes] = useState<Set<"faq" | "uploaded" | "custom">>(new Set());
  const [customKnowledgeText, setCustomKnowledgeText] = useState("");
  const [aiPersona, setAiPersona] = useState("");
  const [aiDoList, setAiDoList] = useState("");
  const [aiDontList, setAiDontList] = useState("");

  useEffect(() => {
    const loadBot = async () => {
      // Only set loading on initial load to prevent UI flicker during status refreshes
      if (!bot) {
        setLoading(true);
      }
      setError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        // Handle refresh token errors
        if (userError.message?.includes("Refresh Token") || userError.message?.includes("refresh_token")) {
          await supabase.auth.signOut();
          router.push("/login");
          return;
        }
        router.push("/login");
        return;
      }
      if (!userData.user) {
        router.push("/login");
        return;
      }

      // Load bot directly from Supabase (we don't need decrypted token for display)
      const { data: botData, error: botError } = await supabase
        .from("discord_bots")
        .select(`
          id,
          bot_name,
          bot_avatar_url,
          description,
          bot_token,
          bot_client_id,
          bot_type,
          status,
          tone,
          welcome_message,
          system_prompt,
          monthly_message_limit,
          max_servers,
          messages_this_month,
          total_messages,
          created_at,
          updated_at,
          auto_reply_enabled,
          respond_to_mentions,
          respond_to_all_messages,
          respond_in_threads,
          mention_in_reply,
          bot_language,
          max_response_tokens,
          response_mode,
          ai_enabled,
          knowledge_source_type,
          custom_knowledge_text,
          ai_persona,
          ai_do_list,
          ai_dont_list
        `)
        .eq("id", botId)
        .eq("user_id", userData.user.id)
        .single();

      if (botError || !botData) {
        console.error("Error loading bot:", botError);
        setError("Bot nebol nájdený");
        setLoading(false);
        return;
      }

      // Get server count from Discord API
      let serverCount = 0;
      try {
        const countResponse = await fetch(`/api/discord-bot/${botId}/guilds/count`);
        if (countResponse.ok) {
          const countData = await countResponse.json();
          serverCount = countData.count || 0;
        }
      } catch (err) {
        console.warn("Failed to fetch server count from Discord API:", err);
      }
      
      const botInfo = {
        ...botData,
        total_servers: serverCount,
        total_messages: botData.total_messages || 0,
      } as any;
      setBot(botInfo as DiscordBot);
      setBotName(botInfo.bot_name || "");
      setDescription(botInfo.description || "");
      setBotToken(botInfo.bot_token ? "***" : ""); // Nezobrazujeme skutočný token
      setBotClientId(botInfo.bot_client_id || "");
      setTone(botInfo.tone || "friendly");
      setWelcomeMessage(botInfo.welcome_message || "");
      setSystemPrompt(botInfo.system_prompt || "");
      
      // Load behavior settings
      setAutoReplyEnabled(botInfo.auto_reply_enabled !== false);
      setRespondToMentions(botInfo.respond_to_mentions !== false);
      setRespondToAllMessages(botInfo.respond_to_all_messages === true);
      setRespondInThreads(botInfo.respond_in_threads !== false);
      setMentionInReply(botInfo.mention_in_reply === true);
      
      // Load basic settings
      setBotLanguage(botInfo.bot_language || "SK");
      setMaxResponseTokens(botInfo.max_response_tokens || 300);
      
      // Load extended AI settings
      // Parse knowledge_source_type - môže byť string alebo array
      if (botInfo.knowledge_source_type) {
        if (Array.isArray(botInfo.knowledge_source_type)) {
          setKnowledgeSourceTypes(new Set(botInfo.knowledge_source_type.filter((t: any) => t !== "none")));
        } else if (typeof botInfo.knowledge_source_type === 'string') {
          const types = botInfo.knowledge_source_type.split(',').filter((t: string) => t.trim() && t.trim() !== "none");
          setKnowledgeSourceTypes(new Set(types as ("faq" | "uploaded" | "custom")[]));
        }
      } else {
        setKnowledgeSourceTypes(new Set());
      }
      setCustomKnowledgeText(botInfo.custom_knowledge_text || "");
      setAiPersona(botInfo.ai_persona || "");
      setAiDoList(botInfo.ai_do_list || "");
      setAiDontList(botInfo.ai_dont_list || "");
      
      // Load response mode (map hybrid to ai, since we only have 2 options now)
      if (botInfo.response_mode) {
        const mode = botInfo.response_mode === "hybrid" ? "ai" : botInfo.response_mode;
        setResponseMode(mode as "ai" | "rules");
      } else {
        // Default to "ai" if not set
        setResponseMode("ai");
      }

      // Only set loading to false on initial load
      if (!bot) {
        setLoading(false);
      }
    };

    if (botId) {
      loadBot();
    }
  }, [botId, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Nie si prihlásený");
      setSaving(false);
      return;
    }

    try {
      // Ak token nie je "***" (t.j. používateľ ho zmenil), aktualizujeme ho
      const updateData: any = {
        bot_name: botName.trim(),
        description: description.trim() || null,
        bot_client_id: botClientId.trim() || null,
        tone,
        welcome_message: welcomeMessage.trim() || null,
        system_prompt: systemPrompt.trim() || null,
        auto_reply_enabled: autoReplyEnabled,
        respond_to_mentions: respondToMentions,
        respond_to_all_messages: respondToAllMessages,
        respond_in_threads: respondInThreads,
        mention_in_reply: mentionInReply,
        // Basic settings
        bot_language: botLanguage,
        max_response_tokens: responseMode === "ai" ? maxResponseTokens : null, // max_response_tokens je relevantné len pre AI režim
        // Response mode (ai = bot + AI, rules = len bot)
        response_mode: responseMode,
        ai_enabled: responseMode === "ai", // AI je enabled len ak je responseMode === "ai"
        // Extended AI settings (len ak je AI enabled)
        knowledge_source_type: responseMode === "ai" && knowledgeSourceTypes.size > 0 ? Array.from(knowledgeSourceTypes).join(',') : null,
        custom_knowledge_text: responseMode === "ai" && knowledgeSourceTypes.has("custom") ? customKnowledgeText.trim() || null : null,
        ai_persona: responseMode === "ai" ? aiPersona.trim() || null : null,
        ai_do_list: responseMode === "ai" ? aiDoList.trim() || null : null,
        ai_dont_list: responseMode === "ai" ? aiDontList.trim() || null : null,
        updated_at: new Date().toISOString(),
      };

      // Ak token nie je "***", znamená to, že používateľ ho zadal/upravil
      // Pre šifrovanie tokenu použijeme API endpoint
      if (botToken && botToken !== "***") {
        try {
          // Use API endpoint to encrypt token
          const encryptResponse = await fetch(`/api/discord-bots/${botId}/encrypt-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: botToken.trim() }),
          });

          if (!encryptResponse.ok) {
            let errorData;
            try {
              errorData = await encryptResponse.json();
            } catch (e) {
              errorData = { error: `HTTP ${encryptResponse.status}: ${encryptResponse.statusText}` };
            }
            console.error("Token encryption error:", errorData);
            setError(errorData.error || "Chyba pri šifrovaní tokenu");
            setSaving(false);
            return;
          }

          const { encrypted_token } = await encryptResponse.json();
          updateData.bot_token = encrypted_token;
        } catch (err) {
          console.error("Error calling encrypt endpoint:", err);
          setError("Chyba pri šifrovaní tokenu");
          setSaving(false);
          return;
        }
      }

      // Update bot via API endpoint (handles authentication properly)
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      if (!authToken) {
        setError("Nie si prihlásený");
        setSaving(false);
        return;
      }

      const updateResponse = await fetch(`/api/discord-bots/${botId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!updateResponse.ok) {
        let errorData;
        try {
          errorData = await updateResponse.json();
        } catch (e) {
          errorData = { error: `HTTP ${updateResponse.status}: ${updateResponse.statusText}` };
        }
        console.error("Error updating bot:", errorData);
        setError(errorData.error || errorData.details || "Chyba pri ukladaní nastavení");
        setSaving(false);
        return;
      }

      setSuccess("Nastavenia boli úspešne uložené");
      
      // Reset token field to "***" after successful save (token is encrypted in DB)
      setBotToken("***");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Neočakávaná chyba pri ukladaní");
    } finally {
      setSaving(false);
    }
  };

  const generateInviteUrl = () => {
    // Pre shared boty použijeme master bot Client ID z env variables
    // Pre custom boty použijeme Client ID z formulára
    const clientId = bot?.bot_type === "shared" 
      ? process.env.NEXT_PUBLIC_DISCORD_SHARED_BOT_CLIENT_ID || "1451249796861005948" // Fallback na tvoj Client ID
      : botClientId;
    
    if (!clientId) {
      setError("Najprv zadaj Client ID");
      return "";
    }
    // Discord OAuth2 URL s bot scope a permissions
    // Permissions: Send Messages, Read Message History, Use Slash Commands, Embed Links, Attach Files
    const permissions = "2147600384";
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&integration_type=0&scope=bot+applications.commands`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Bot nebol nájdený</p>
          <Button onClick={() => router.push("/dashboard/discord-bot")} className="mt-4">
            Späť na Discord botov
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aktívny
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Chyba
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Neaktívny
          </Badge>
        );
    }
  };

  return (
    <div>
        {/* Header */}
        <div className="mb-4 md:mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/discord-bot")}
              className="mb-2 md:mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Späť na Discord botov</span>
              <span className="sm:hidden">Späť</span>
            </Button>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  {bot.bot_avatar_url ? (
                    <img src={bot.bot_avatar_url} alt={bot.bot_name} className="h-12 w-12 rounded-xl" />
                  ) : (
                    <Bot className="h-6 w-6 text-indigo-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{bot.bot_name}</h1>
                    {getStatusBadge(bot.status)}
                  </div>
                  <p className="text-muted-foreground">Nastavenia a konfigurácia bota</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pripojené servery</p>
                    <p className="text-2xl font-bold">{bot.total_servers || 0}</p>
                  </div>
                  <Server className="h-8 w-8 text-indigo-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Celkom správ</p>
                    <p className="text-2xl font-bold">{bot.total_messages || 0}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-indigo-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Vytvorený</p>
                    <p className="text-sm font-medium">
                      {new Date(bot.created_at).toLocaleDateString("sk-SK")}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-indigo-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Setup Guide - len pre custom boty */}
          {bot.bot_type === "custom" && (!bot.bot_token || !bot.bot_client_id) && (
            <div className="mb-6">
              <Card className="border-indigo-500/20 bg-indigo-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-indigo-500" />
                    Ako získať Discord Token a Client ID?
                  </CardTitle>
                  <CardDescription>
                    Pre aktiváciu bota potrebuješ Discord Bot Token a Client ID z Discord Developer Portálu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Krok 1:</strong> Choď na{" "}
                      <a
                        href="https://discord.com/developers/applications"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:underline inline-flex items-center gap-1"
                      >
                        Discord Developer Portal
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Krok 2:</strong> Vytvor novú aplikáciu alebo vyber existujúcu
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Krok 3:</strong> V sekcii <strong>"Bot"</strong> klikni na{" "}
                      <strong>"Reset Token"</strong> a skopíruj token
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Krok 4:</strong> V sekcii <strong>"General Information"</strong> skopíruj{" "}
                      <strong>"Application ID"</strong> (toto je Client ID)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Krok 5:</strong> Vlož obidve hodnoty do formulára nižšie
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      ⚠️ <strong>Dôležité:</strong> Token sa zobrazí len raz. Ak ho stratíš, vytvor nový v Developer Portáli.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Form */}
          <div>
            <form onSubmit={handleSave}>
              <div className="grid gap-6">
                {/* Response Mode Selection - HLAVNÝ PREPÍNAČ */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Režim odpovedania
                    </CardTitle>
                    <CardDescription>
                      Vyber si, ako má bot odpovedať na správy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Bot + AI Mode */}
                      <button
                        type="button"
                        onClick={() => {
                          setResponseMode("ai");
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          responseMode === "ai"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          {responseMode === "ai" && (
                            <Badge className="bg-primary">Aktívny</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold mb-1">Bot + AI</h3>
                        <p className="text-sm text-muted-foreground">
                          Bot používa AI na generovanie odpovedí. Ideálne pre komplexné otázky a prirodzené konverzácie.
                        </p>
                      </button>

                      {/* Len Bot Mode */}
                      <button
                        type="button"
                        onClick={() => {
                          setResponseMode("rules");
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          responseMode === "rules"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Settings className="h-5 w-5 text-primary" />
                          {responseMode === "rules" && (
                            <Badge className="bg-primary">Aktívny</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold mb-1">Len bot</h3>
                        <p className="text-sm text-muted-foreground">
                          Bot odpovedá podľa pravidiel a šablón. Rýchle, presné, bez AI nákladov.
                        </p>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Základné informácie</CardTitle>
                    <CardDescription>Základné nastavenia bota</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="botName">
                        Meno bota <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="botName"
                        value={botName}
                        onChange={(e) => setBotName(e.target.value)}
                        placeholder="Meno bota"
                        required
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Popis</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Popis bota..."
                        rows={3}
                        maxLength={500}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Discord Credentials - len pre custom boty */}
                {bot.bot_type === "custom" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      Discord prihlasovacie údaje
                    </CardTitle>
                    <CardDescription>
                      Token a Client ID z Discord Developer Portálu
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="botToken" className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Bot Token <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="botToken"
                          type={showToken ? "text" : "password"}
                          value={botToken}
                          onChange={(e) => setBotToken(e.target.value)}
                          placeholder="Bot token z Discord Developer Portálu"
                          required={!bot.bot_token}
                          className="pr-10 font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowToken(!showToken)}
                        >
                          {showToken ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Token sa ukladá bezpečne. Ak ho už máš uložený, ponechaj pole prázdne alebo zadaj nový token.
                      </p>
                      {bot.bot_token && botToken === "***" && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-2">
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2 font-semibold">
                            ⚠️ <strong>Dôležité:</strong> Ak bot nefunguje, zadaj NOVÝ token!
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Starý token môže byť neplatný alebo nesprávne zašifrovaný. Vytvor nový token v Discord Developer Portal.
                          </p>
                          <a 
                            href="https://discord.com/developers/applications" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-blue-500 hover:text-blue-600 underline"
                          >
                            Otvoriť Discord Developer Portal
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="botClientId">
                        Client ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="botClientId"
                        value={botClientId}
                        onChange={(e) => setBotClientId(e.target.value)}
                        placeholder="Application ID (Client ID)"
                        required
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Application ID z Discord Developer Portálu (General Information)
                      </p>
                    </div>

                    {botClientId && (
                      <div className="pt-4 border-t">
                        <Label>Invite Link pre pridanie bota na server</Label>
                        <div className="mt-2 flex gap-2">
                          <Input
                            value={generateInviteUrl()}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(generateInviteUrl());
                              setSuccess("Invite link skopírovaný!");
                              setTimeout(() => setSuccess(null), 2000);
                            }}
                          >
                            Kopírovať
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            asChild
                          >
                            <a
                              href={generateInviteUrl()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2"
                            >
                              Otvoriť
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                )}

                {/* Shared Bot Info */}
                {bot.bot_type === "shared" && (
                  <Card className="border-indigo-500/20 bg-indigo-500/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        Zdieľaný bot
                      </CardTitle>
                      <CardDescription>
                        Tento bot používa zdieľaného Discord bota - nemusíš zadávať token
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div>
                            <p className="text-sm font-medium">Obmedzenia</p>
                            <p className="text-xs text-muted-foreground">Maximálne servery a správy</p>
                          </div>
                          <Badge variant="outline">
                            {bot.max_servers || 1} server, {bot.monthly_message_limit?.toLocaleString() || "1,000"} správ/mesiac
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div>
                            <p className="text-sm font-medium">Spotreba tento mesiac</p>
                            <p className="text-xs text-muted-foreground">Počet odoslaných správ</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">
                              {bot.messages_this_month || 0} / {bot.monthly_message_limit?.toLocaleString() || "1,000"}
                            </p>
                            <div className="w-24 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 transition-all"
                                style={{ 
                                  width: `${Math.min(100, ((bot.messages_this_month || 0) / (bot.monthly_message_limit || 1000)) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {bot.max_servers && bot.total_servers >= bot.max_servers && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p className="text-xs text-amber-600 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Dosiahnutý limit serverov. Pre viac možností vytvor vlastného bota.
                            </p>
                          </div>
                        )}

                        {bot.monthly_message_limit && (bot.messages_this_month || 0) >= bot.monthly_message_limit && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-xs text-red-600 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Dosiahnutý limit správ tento mesiac. Limit sa resetuje začiatkom nového mesiaca.
                            </p>
                          </div>
                        )}
                      </div>

                      {generateInviteUrl() && (
                        <div className="pt-4 border-t">
                          <Label>Invite Link pre pridanie bota na server</Label>
                          <div className="mt-2 flex gap-2">
                            <Input
                              value={generateInviteUrl()}
                              readOnly
                              className="font-mono text-sm"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(generateInviteUrl());
                                setSuccess("Invite link skopírovaný!");
                                setTimeout(() => setSuccess(null), 2000);
                              }}
                            >
                              Kopírovať
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              asChild
                            >
                              <a
                                href={generateInviteUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2"
                              >
                                Otvoriť
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Bot Behavior Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Nastavenia správania bota</CardTitle>
                    <CardDescription>
                      Konfiguruj, kedy a ako má bot reagovať na Discord serveri
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto_reply">Automatické odpovede</Label>
                          <p className="text-xs text-muted-foreground">
                            Zapnúť/vypnúť automatické odpovede bota
                          </p>
                        </div>
                        <Switch
                          id="auto_reply"
                          checked={autoReplyEnabled}
                          onCheckedChange={setAutoReplyEnabled}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="respond_mentions">Reagovať na @mention</Label>
                          <p className="text-xs text-muted-foreground">
                            Bot odpovie, keď je @mentionovaný
                          </p>
                        </div>
                        <Switch
                          id="respond_mentions"
                          checked={respondToMentions}
                          onCheckedChange={setRespondToMentions}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="respond_all">Reagovať na všetky správy</Label>
                          <p className="text-xs text-muted-foreground">
                            Bot odpovie na každú správu (nie len @mention)
                          </p>
                        </div>
                        <Switch
                          id="respond_all"
                          checked={respondToAllMessages}
                          onCheckedChange={setRespondToAllMessages}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="respond_threads">Reagovať v threadoch</Label>
                          <p className="text-xs text-muted-foreground">
                            Bot odpovie aj v threadoch (podvlaknoch)
                          </p>
                        </div>
                        <Switch
                          id="respond_threads"
                          checked={respondInThreads}
                          onCheckedChange={setRespondInThreads}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="mention_reply">@mention v odpovedi</Label>
                          <p className="text-xs text-muted-foreground">
                            Bot @mentionuje používateľa v odpovedi
                          </p>
                        </div>
                        <Switch
                          id="mention_reply"
                          checked={mentionInReply}
                          onCheckedChange={setMentionInReply}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      {bot.status === 'active' ? (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-green-700 dark:text-green-400 mb-2">
                                ✅ <strong>Bot je aktívny</strong>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Bot service beží a bot je pripojený k Discord API. Bot reaguje na správy podľa nastavení nižšie.
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const { data: userData } = await supabase.auth.getUser();
                                if (!userData.user) return;
                                
                                const { error } = await supabase
                                  .from("discord_bots")
                                  .update({ status: 'inactive' })
                                  .eq("id", botId)
                                  .eq("user_id", userData.user.id);
                                
                                if (!error) {
                                  // Aktualizuj status lokálne namiesto reloadu
                                  setBot((prev) => prev ? { ...prev, status: 'inactive' as const } : null);
                                }
                              }}
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
                                Bot service musí byť spustený a bot musí mať status "active" v databáze.
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
                                  .from("discord_bots")
                                  .update({ status: 'active' })
                                  .eq("id", botId)
                                  .eq("user_id", userData.user.id);
                                
                                if (error) {
                                  setError("Chyba pri aktivácii bota: " + error.message);
                                  setSaving(false);
                                } else {
                                  setSuccess("Bot bol aktivovaný! Service sa automaticky pripojí za pár sekúnd.");
                                  // Aktualizuj status lokálne namiesto reloadu
                                  setBot((prev) => prev ? { ...prev, status: 'active' as const } : null);
                                }
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
                                <li>Discord Bot Service (ktorý už beží) automaticky deteguje zmenu</li>
                                <li>Bot sa pripojí k Discord API (môže to trvať 1-5 minút, service kontroluje každých 5 minút)</li>
                                <li>Stránka sa automaticky obnoví každých 10 sekúnd a zobrazí "✅ Bot je aktívny"</li>
                              </ol>
                              <p className="mt-2 text-xs text-muted-foreground italic">
                                💡 Tip: Ak chceš rýchlejšie pripojenie, reštartuj service v termináli (Ctrl+C a potom znovu npm run dev)
                              </p>
                            </div>
                            <div className="mt-2 pt-2 border-t">
                              <strong>🔧 Ak service nebeží:</strong>
                              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
{`cd discord-bot-service
npm run dev`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Základné nastavenia</CardTitle>
                    <CardDescription>
                      Jazyk, časové pásmo, rate limit a ďalšie základné konfigurácie
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="botLanguage">Jazyk bota</Label>
                        <Select value={botLanguage} onValueChange={setBotLanguage}>
                          <SelectTrigger id="botLanguage">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SK">Slovenčina</SelectItem>
                            <SelectItem value="CZ">Čeština</SelectItem>
                            <SelectItem value="EN">Angličtina</SelectItem>
                            <SelectItem value="NO">Nórčina</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {responseMode === "ai" && (
                        <div className="space-y-2">
                          <Label htmlFor="maxResponseTokens">Maximálna dĺžka odpovede (tokeny)</Label>
                          <Input
                            id="maxResponseTokens"
                            type="number"
                            min="50"
                            max="1000"
                            value={maxResponseTokens}
                            onChange={(e) => setMaxResponseTokens(parseInt(e.target.value) || 300)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Maximálny počet tokenov v AI odpovedi (300 = cca 225 slov)
                          </p>
                        </div>
                      )}

                    </div>
                  </CardContent>
                </Card>

                {/* AI Settings - len ak je AI enabled (responseMode === "ai") */}
                {responseMode === "ai" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Nastavenia AI
                    </CardTitle>
                    <CardDescription>
                      Ako sa má bot správať v konverzácii (AI generované odpovede)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tone">Štýl komunikácie</Label>
                      <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                        <SelectTrigger id="tone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Priateľský</SelectItem>
                          <SelectItem value="professional">Profesionálny</SelectItem>
                          <SelectItem value="casual">Neformálny</SelectItem>
                          <SelectItem value="formal">Formálny</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="welcomeMessage">Úvodná správa</Label>
                      <Textarea
                        id="welcomeMessage"
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        placeholder="Správa pri prvom kontakte s botom..."
                        rows={2}
                        maxLength={500}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="systemPrompt">Systémový prompt</Label>
                      <Textarea
                        id="systemPrompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="Pokročilé inštrukcie pre správanie bota..."
                        rows={4}
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground">
                        Inštrukcie pre AI, ako sa má bot správať
                      </p>
                    </div>

                    <div className="pt-4 border-t space-y-4">
                      <div className="space-y-3">
                        <Label>Zdroj vedomostí</Label>
                        <p className="text-xs text-muted-foreground mb-3">
                          Vyber zdroje vedomostí, ktoré má bot používať (môžeš vybrať viacero)
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* FAQ Checkbox */}
                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              const newTypes = new Set(knowledgeSourceTypes);
                              if (newTypes.has("faq")) {
                                newTypes.delete("faq");
                              } else {
                                newTypes.add("faq");
                              }
                              setKnowledgeSourceTypes(newTypes);
                            }}
                          >
                            <input
                              type="checkbox"
                              id="knowledge-faq"
                              checked={knowledgeSourceTypes.has("faq")}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <Label htmlFor="knowledge-faq" className="cursor-pointer flex-1">
                              FAQ (často kladené otázky)
                            </Label>
                          </div>

                          {/* Uploaded Files Checkbox */}
                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              const newTypes = new Set(knowledgeSourceTypes);
                              if (newTypes.has("uploaded")) {
                                newTypes.delete("uploaded");
                              } else {
                                newTypes.add("uploaded");
                              }
                              setKnowledgeSourceTypes(newTypes);
                            }}
                          >
                            <input
                              type="checkbox"
                              id="knowledge-uploaded"
                              checked={knowledgeSourceTypes.has("uploaded")}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <Label htmlFor="knowledge-uploaded" className="cursor-pointer flex-1">
                              Nahrané súbory (PDF/TXT)
                            </Label>
                          </div>

                          {/* Custom Text Checkbox */}
                          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              const newTypes = new Set(knowledgeSourceTypes);
                              if (newTypes.has("custom")) {
                                newTypes.delete("custom");
                              } else {
                                newTypes.add("custom");
                              }
                              setKnowledgeSourceTypes(newTypes);
                            }}
                          >
                            <input
                              type="checkbox"
                              id="knowledge-custom"
                              checked={knowledgeSourceTypes.has("custom")}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <Label htmlFor="knowledge-custom" className="cursor-pointer flex-1">
                              Vlastný text
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Conditional sections based on selected types */}
                      {knowledgeSourceTypes.has("faq") && (
                        <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                          <Label>FAQ (často kladené otázky)</Label>
                          <p className="text-xs text-muted-foreground">
                            FAQ funkcionalita bude čoskoro dostupná
                          </p>
                        </div>
                      )}

                      {knowledgeSourceTypes.has("uploaded") && (
                        <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                          <Label>Nahrané súbory</Label>
                          <p className="text-xs text-muted-foreground">
                            Upload súborov bude čoskoro dostupný
                          </p>
                        </div>
                      )}

                      {knowledgeSourceTypes.has("custom") && (
                        <div className="space-y-2">
                          <Label htmlFor="customKnowledge">Vlastný knowledge text</Label>
                          <Textarea
                            id="customKnowledge"
                            value={customKnowledgeText}
                            onChange={(e) => setCustomKnowledgeText(e.target.value)}
                            placeholder="Informácie, ktoré má bot vedieť (napr. pravidlá servera, informácie o tvojej firme, produktoch, službách...)"
                            rows={6}
                            maxLength={5000}
                          />
                          <p className="text-xs text-muted-foreground">
                            Text, ktorý bude bot používať ako kontext pre odpovede. Môžeš tu zadať pravidlá servera, informácie o produktoch, službách, atď.
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="aiPersona">AI Persona (kto si)</Label>
                        <Textarea
                          id="aiPersona"
                          value={aiPersona}
                          onChange={(e) => setAiPersona(e.target.value)}
                          placeholder="Napríklad: 'Som AI asistent pre gaming komunitu, špecializujem sa na herné tipy a pomáhanie novým hráčom.'"
                          rows={3}
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground">
                          Popíš, kým má bot byť (osobnosť, role, špecializácia)
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="aiDoList">Do list (čo bot MÁ robiť)</Label>
                          <Textarea
                            id="aiDoList"
                            value={aiDoList}
                            onChange={(e) => setAiDoList(e.target.value)}
                            placeholder="Napríklad: 'Odpovedaj stručne, používaj emoji, buď priateľský'"
                            rows={3}
                            maxLength={500}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="aiDontList">Don't list (čo bot NEMÁ robiť)</Label>
                          <Textarea
                            id="aiDontList"
                            value={aiDontList}
                            onChange={(e) => setAiDontList(e.target.value)}
                            placeholder="Napríklad: 'Nevytváraj dlhé odpovede, nezdrav v každej správe, nehovor o politike'"
                            rows={3}
                            maxLength={500}
                          />
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
                )}

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

                {/* Save Button */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/discord-bot")}
                    className="flex-1"
                  >
                    Zrušiť
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1 gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? "Ukladám..." : "Uložiť nastavenia"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
    </div>
  );
}

