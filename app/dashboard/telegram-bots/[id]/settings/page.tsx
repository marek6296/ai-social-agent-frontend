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
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<"active" | "inactive" | "error" | "draft">("draft");

  const [bot, setBot] = useState<TelegramBot | null>(null);

  // Základné informácie
  const [botName, setBotName] = useState("");
  const [description, setDescription] = useState("");
  const [botLanguage, setBotLanguage] = useState<TelegramBotLanguage>("SK");

  // Prepojenie
  const [botToken, setBotToken] = useState("");

  // Správanie bota
  const [responseMode, setResponseMode] = useState<TelegramResponseMode>("rules");
  const [fallbackMessage, setFallbackMessage] = useState("Prepáč, nerozumiem tejto správe.");
  const [moduleWelcome, setModuleWelcome] = useState(false);
  const [moduleHelp, setModuleHelp] = useState(false);
  const [moduleAutoReplies, setModuleAutoReplies] = useState(true);

  // AI nastavenia
  const [aiKnowledgeSourceTypes, setAiKnowledgeSourceTypes] = useState<Set<"faq" | "custom">>(new Set());
  const [aiCustomKnowledgeText, setAiCustomKnowledgeText] = useState("");
  const [aiTone, setAiTone] = useState<TelegramAITone>("friendly");
  const [aiMaxResponseTokens, setAiMaxResponseTokens] = useState(300);

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
      setDescription(botData.description || "");
      setBotLanguage(botData.bot_language || "SK");
      setBotToken(botData.bot_token ? "***" : "");
      setResponseMode(botData.response_mode || "rules");
      setFallbackMessage(botData.fallback_message || "Prepáč, nerozumiem tejto správe.");
      setModuleWelcome(botData.module_welcome || false);
      setModuleHelp(botData.module_help || false);
      setModuleAutoReplies(botData.module_auto_replies !== false);
      
      // Set bot status
      setBotStatus(botData.status || "draft");
      
      if (botData.ai_knowledge_source_types) {
        setAiKnowledgeSourceTypes(new Set(botData.ai_knowledge_source_types.filter((t: string) => t === "faq" || t === "custom")));
      }
      setAiCustomKnowledgeText(botData.ai_custom_knowledge_text || "");
      setAiTone(botData.ai_tone || "friendly");
      setAiMaxResponseTokens(botData.ai_max_response_tokens || 300);
      
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
        description: description.trim() || null,
        bot_language: botLanguage,
        response_mode: responseMode,
        fallback_message: fallbackMessage.trim(),
        module_welcome: moduleWelcome,
        module_help: moduleHelp,
        module_auto_replies: moduleAutoReplies,
        ai_knowledge_source_types: responseMode === "ai" && aiKnowledgeSourceTypes.size > 0 ? Array.from(aiKnowledgeSourceTypes) : null,
        ai_custom_knowledge_text: responseMode === "ai" && aiKnowledgeSourceTypes.has("custom") ? aiCustomKnowledgeText.trim() || null : null,
        ai_tone: responseMode === "ai" ? aiTone : "friendly",
        ai_max_response_tokens: responseMode === "ai" ? aiMaxResponseTokens : 300,
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
      await supabase
        .from("telegram_bot_templates")
        .upsert({
          bot_id: botId,
          template_name: "welcome",
          template_text: welcomeMessage.trim() || "",
          template_variables: ["{first_name}", "{username}"],
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "bot_id,template_name"
        });

      await supabase
        .from("telegram_bot_templates")
        .upsert({
          bot_id: botId,
          template_name: "help",
          template_text: helpMessage.trim() || "",
          template_variables: [],
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "bot_id,template_name"
        });

      setSuccess("Nastavenia boli úspešne uložené!");
      setTimeout(() => setSuccess(null), 3000);
      loadBot();
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
        setBotUsername(data.bot_info?.username || null);
        setSuccess(`✅ Pripojenie úspešné! Bot: @${data.bot_info?.username || "N/A"}`);
        loadBot();
      } else {
        setError(`❌ Chyba pripojenia: ${data.error || "Neznáma chyba"}`);
      }
    } catch (err: any) {
      console.error("Error testing connection:", err);
      setError("Neočakávaná chyba pri teste pripojenia");
    }
  };

  const copyBotLink = () => {
    if (botUsername) {
      const link = `https://t.me/${botUsername}`;
      navigator.clipboard.writeText(link);
      setSuccess("Odkaz bol skopírovaný!");
      setTimeout(() => setSuccess(null), 2000);
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Základné</TabsTrigger>
          <TabsTrigger value="connection">Prepojenie</TabsTrigger>
          <TabsTrigger value="behavior">Správanie</TabsTrigger>
          <TabsTrigger value="messages">Správy</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
        </TabsList>

        {/* Základné informácie */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Základné informácie</CardTitle>
              <CardDescription>
                Meno a popis bota
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="botName">
                  Meno bota <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="botName"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="Napríklad: Môj Telegram Bot"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Toto meno sa zobrazí len v dashboarde, nie používateľom
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Popis bota</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Krátky popis, na čo sa bot používa..."
                  rows={3}
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
                <p className="text-xs text-muted-foreground">
                  Jazyk, v ktorom bude bot odpovedať
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prepojenie */}
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prepojenie s Telegram</CardTitle>
              <CardDescription>
                Pridaj token a otestuj pripojenie
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
                  Token získáš od @BotFather na Telegrame. Pošli mu príkaz /newbot a postupuj podľa inštrukcií.
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

              {botUsername && (
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bot className="h-5 w-5 text-blue-500" />
                      Bot je pripojený!
                    </CardTitle>
                    <CardDescription>
                      Tvoj bot: @{botUsername}
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
                            <li><strong>Dôležité:</strong> V nastaveniach skupiny daj botovi práva na čítanie správ (ak chceš, aby reagoval na správy)</li>
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

        {/* Správanie bota */}
        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Správanie bota</CardTitle>
              <CardDescription>
                Ako sa má bot správať a aké funkcie má mať
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
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
                      Bot odpovedá iba podľa pravidiel a šablón, ktoré nastavíš. Jednoduchý a rýchly.
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
                      Bot používa AI pre inteligentné odpovede. Vhodné pre podporu zákazníkov alebo FAQ.
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fallbackMessage">Správa, keď bot nerozumie</Label>
                <Textarea
                  id="fallbackMessage"
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  placeholder="Prepáč, nerozumiem tejto správe. Skús napísať inak alebo použij /help"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Táto správa sa pošle, keď bot nevie odpovedať na otázku
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Zapnuté funkcie</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="moduleWelcome">Úvodná správa</Label>
                      <p className="text-xs text-muted-foreground">
                        Pošle úvodnú správu novým používateľom pri /start
                      </p>
                    </div>
                    <Switch
                      id="moduleWelcome"
                      checked={moduleWelcome}
                      onCheckedChange={setModuleWelcome}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="moduleHelp">Pomocný príkaz /help</Label>
                      <p className="text-xs text-muted-foreground">
                        Bot odpovie na príkaz /help s informáciami
                      </p>
                    </div>
                    <Switch
                      id="moduleHelp"
                      checked={moduleHelp}
                      onCheckedChange={setModuleHelp}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="moduleAutoReplies">Automatické odpovede</Label>
                      <p className="text-xs text-muted-foreground">
                        Bot automaticky odpovedá na správy podľa nastavení
                      </p>
                    </div>
                    <Switch
                      id="moduleAutoReplies"
                      checked={moduleAutoReplies}
                      onCheckedChange={setModuleAutoReplies}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Správy a šablóny */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Správy a šablóny</CardTitle>
              <CardDescription>
                Úvodné správy a šablóny pre bota. Môžeš použiť premenné: {"{first_name}"}, {"{username}"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">
                  Úvodná správa (Welcome)
                  <Badge variant="outline" className="ml-2 text-xs">
                    {moduleWelcome ? "Zapnuté" : "Vypnuté"}
                  </Badge>
                </Label>
                <Textarea
                  id="welcomeMessage"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Vitaj {first_name}! 👋 Som tvoj asistent a som tu, aby som ti pomohol. Napíš /help pre pomoc."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Táto správa sa pošle, keď používateľ spustí bota príkazom /start
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="helpMessage">
                  Pomocná správa (Help)
                  <Badge variant="outline" className="ml-2 text-xs">
                    {moduleHelp ? "Zapnuté" : "Vypnuté"}
                  </Badge>
                </Label>
                <Textarea
                  id="helpMessage"
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  placeholder="Pomoc\n\n/start - Začať\n/help - Zobraziť túto pomoc\n\nMôžeš sa ma opýtať na čokoľvek a ja ti odpoviem!"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Táto správa sa pošle, keď používateľ použije príkaz /help
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm font-medium mb-2">💡 Premenné, ktoré môžeš použiť:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code className="bg-muted px-1 rounded">{"{first_name}"}</code> - Krstné meno používateľa</li>
                  <li><code className="bg-muted px-1 rounded">{"{username}"}</code> - Telegram username používateľa</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI nastavenia */}
        <TabsContent value="ai" className="space-y-4">
          {responseMode === "ai" ? (
            <Card>
              <CardHeader>
                <CardTitle>AI nastavenia</CardTitle>
                <CardDescription>
                  Konfigurácia AI odpovedí (zobrazuje sa len keď je zapnutý režim "Bot + AI")
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Zdroj vedomostí pre AI</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Vyber, odkiaľ má AI čerpať informácie
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
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
                      <Label htmlFor="knowledge-faq" className="font-normal">
                        FAQ (často kladené otázky) - zatiaľ nie je implementované
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
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
                      <Label htmlFor="knowledge-custom" className="font-normal">
                        Vlastný text - zadáš vlastné informácie pre bota
                      </Label>
                    </div>
                  </div>
                </div>

                {aiKnowledgeSourceTypes.has("custom") && (
                  <div className="space-y-2">
                    <Label htmlFor="aiCustomKnowledgeText">Vlastný text s informáciami</Label>
                    <Textarea
                      id="aiCustomKnowledgeText"
                      value={aiCustomKnowledgeText}
                      onChange={(e) => setAiCustomKnowledgeText(e.target.value)}
                      placeholder="Napíš tu informácie o tvojej spoločnosti, produktoch, službách alebo čomkoľvek, čo má bot vedieť..."
                      rows={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Príklad: "Naša spoločnosť predáva IT služby. Oteváracie hodiny: Po-Pi 9-17. Kontakt: info@spolocnost.sk"
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="aiTone">Tón odpovedí</Label>
                  <Select value={aiTone} onValueChange={(value: any) => setAiTone(value)}>
                    <SelectTrigger id="aiTone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Priateľský</SelectItem>
                      <SelectItem value="professional">Profesionálny</SelectItem>
                      <SelectItem value="funny">Zábavný</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Ako má AI formulovať odpovede
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Maximálna dĺžka odpovede (tokeny)</Label>
                  <Input
                    type="number"
                    value={aiMaxResponseTokens}
                    onChange={(e) => setAiMaxResponseTokens(parseInt(e.target.value) || 300)}
                    min={50}
                    max={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximálny počet tokenov v AI odpovedi (300 = cca 200 slov)
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    AI nastavenia sú dostupné len keď je zapnutý režim "Bot + AI"
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choď do sekcie "Správanie" a prepni na "Bot + AI"
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}