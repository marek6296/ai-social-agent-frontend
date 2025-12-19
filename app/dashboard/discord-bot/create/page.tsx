"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/AnimatedPage";
import { ArrowLeft, Bot, AlertCircle, CheckCircle2, ExternalLink, Sparkles, Settings, Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BotType = "custom" | "shared";

export default function CreateDiscordBotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [botType, setBotType] = useState<BotType>("custom");

  const [botName, setBotName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<"friendly" | "professional" | "casual" | "formal">("friendly");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/login");
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Nie si prihlásený");
      setSaving(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from("discord_bots")
        .insert({
          user_id: userData.user.id,
          bot_name: botName.trim(),
          description: description.trim() || null,
          tone,
          welcome_message: welcomeMessage.trim() || null,
          system_prompt: systemPrompt.trim() || null,
          bot_type: botType,
          status: "inactive", // Bot je neaktívny, kým sa nepripojí Discord token (pre custom) alebo neaktivuje (pre shared)
          // Pre shared boty nastavíme základné limity
          monthly_message_limit: botType === "shared" ? 1000 : null,
          max_servers: botType === "shared" ? 1 : null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating bot:", insertError);
        setError(insertError.message || "Chyba pri vytváraní bota");
        setSaving(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/discord-bot/${data.id}`);
      }, 1500);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Neočakávaná chyba pri vytváraní bota");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/discord-bot")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Späť na Discord botov
            </Button>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Vytvoriť nového Discord bota</h1>
                <p className="text-muted-foreground">
                  Vyber si typ bota a vytvor ho v niekoľkých krokoch
                </p>
              </div>
            </div>
          </div>

          {/* Bot Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Typ bota</CardTitle>
                <CardDescription>
                  Vyber si, aký typ bota chceš vytvoriť
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Custom Bot */}
                  <button
                    type="button"
                    onClick={() => setBotType("custom")}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      botType === "custom"
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-border hover:border-indigo-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Settings className="h-5 w-5 text-indigo-500" />
                      {botType === "custom" && (
                        <Badge className="bg-indigo-500">Vybrané</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">Vlastný bot</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Plná kontrola, vlastný Discord token, žiadne obmedzenia
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Neobmedzený počet správ
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Neobmedzený počet serverov
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Vlastný token a Client ID
                      </li>
                      <li className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                        Vyžaduje Discord Developer Portal
                      </li>
                    </ul>
                  </button>

                  {/* Shared Bot */}
                  <button
                    type="button"
                    onClick={() => setBotType("shared")}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      botType === "shared"
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-border hover:border-indigo-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Sparkles className="h-5 w-5 text-indigo-500" />
                      {botType === "shared" && (
                        <Badge className="bg-indigo-500">Vybrané</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">Zdieľaný bot</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Rýchle nastavenie, bez potreby Discord Developer Portal
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-green-500" />
                        Rýchle nastavenie (bez tokenu)
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        1 Discord server
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        1,000 správ mesačne
                      </li>
                      <li className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                        S obmedzeniami
                      </li>
                    </ul>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <Card className="border-indigo-500/20 bg-indigo-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-indigo-500" />
                  {botType === "custom" ? "Vlastný bot - Ako to funguje?" : "Zdieľaný bot - Ako to funguje?"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {botType === "custom" ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-medium">Vytvor bota v našej aplikácii</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vyplň základné informácie nižšie a vytvor svojho Discord bota.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-medium">Vytvor Discord Application</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Choď na{" "}
                          <a
                            href="https://discord.com/developers/applications"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:underline inline-flex items-center gap-1"
                          >
                            Discord Developer Portal
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {" "}, vytvor novú aplikáciu a získať Bot Token a Client ID.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pridaj údaje do nastavení</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Po vytvorení bota budeš presmerovaný na nastavenia, kde pridáš Token a Client ID.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        4
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pridaj bota na server</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Použij vygenerovaný invite link na pridanie bota na tvoj Discord server.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-medium">Vytvor bota v našej aplikácii</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vyplň základné informácie nižšie. Nemusíš vytvárať Discord Application - používame zdieľaného bota.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pridaj bota na server</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Po vytvorení dostaneš invite link, ktorým pridáš zdieľaného bota na tvoj Discord server.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-medium">Hotovo!</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Bot je pripravený na použitie. Obmedzenia: 1 server, 1,000 správ mesačne.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {botType === "shared" && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      ⚠️ <strong>Obmedzenia zdieľaného bota:</strong> Maximálne 1 Discord server, 1,000 správ mesačne. 
                      Pre viac možností vytvor vlastného bota.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Základné informácie</CardTitle>
                <CardDescription>
                  Zadaj základné informácie o svojom Discord botovi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Bot Name */}
                  <div className="space-y-2">
                    <Label htmlFor="botName">
                      Meno bota <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="botName"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="Napríklad: Môj Discord Bot"
                      required
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      Toto meno sa zobrazí v Discord aplikácii
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Popis</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Krátky popis tvojho bota a jeho účelu..."
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  {/* Tone */}
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
                    <p className="text-xs text-muted-foreground">
                      Ako sa bude bot správať v konverzácii
                    </p>
                  </div>

                  {/* Welcome Message */}
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">Úvodná správa</Label>
                    <Textarea
                      id="welcomeMessage"
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder="Správa, ktorú bot pošle pri prvom kontakte..."
                      rows={2}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      Voliteľná správa pri prvom kontakte s botom
                    </p>
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="systemPrompt">Systémový prompt</Label>
                    <Textarea
                      id="systemPrompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Inštrukcie pre AI, ako sa má bot správať..."
                      rows={4}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pokročilé inštrukcie pre správanie bota (voliteľné)
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Bot bol úspešne vytvorený! Presmerovávam...</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard/discord-bot")}
                      className="flex-1"
                    >
                      Zrušiť
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving || !botName.trim()}
                      className="flex-1"
                    >
                      {saving ? "Vytváram..." : "Vytvoriť bota"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
}
