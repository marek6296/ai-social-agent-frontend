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
import { Progress } from "@/components/ui/progress";
import { AnimatedPage } from "@/components/AnimatedPage";
import { ArrowLeft, Bot, AlertCircle, CheckCircle2, ExternalLink, Sparkles, Settings, Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export default function CreateTelegramBotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Form data
  const [botName, setBotName] = useState("");
  const [publicName, setPublicName] = useState("");
  const [description, setDescription] = useState("");
  const [botLanguage, setBotLanguage] = useState<"SK" | "EN" | "NO" | "CZ">("SK");
  const [timezone, setTimezone] = useState("Europe/Oslo");
  const [botToken, setBotToken] = useState("");
  const [responseMode, setResponseMode] = useState<"ai" | "rules">("rules");

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

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

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
        .from("telegram_bots")
        .insert({
          user_id: userData.user.id,
          bot_name: botName.trim(),
          public_name: publicName.trim() || null,
          description: description.trim() || null,
          bot_language: botLanguage,
          timezone: timezone,
          bot_token: botToken.trim() || null, // Will be encrypted by backend/trigger
          response_mode: responseMode,
          status: "draft", // Bot je v draft režime, kým sa neaktivuje
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
        router.push(`/dashboard/telegram-bots/${data.id}`);
      }, 1500);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Neočakávaná chyba pri vytváraní bota");
      setSaving(false);
    }
  };

  const progress = ((currentStep - 1) / 6) * 100;

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
              onClick={() => router.push("/dashboard/telegram-bots")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Späť na Telegram botov
            </Button>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Vytvoriť nového Telegram bota</h1>
                <p className="text-muted-foreground">
                  Postupuj cez kroky a vytvor svojho Telegram bota
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Krok {currentStep} z 7</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Základné informácie */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Krok 1: Základné informácie</CardTitle>
                    <CardDescription>
                      Zadaj základné informácie o svojom Telegram botovi
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
                        maxLength={100}
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
                        maxLength={100}
                      />
                      <p className="text-xs text-muted-foreground">
                        Voliteľné - názov zobrazený používateľom v Telegrame
                      </p>
                    </div>

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
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Režim odpovedania */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Krok 2: Režim odpovedania</CardTitle>
                    <CardDescription>
                      Vyber si, ako sa má bot správať
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                          <Settings className="h-5 w-5 text-blue-500" />
                          {responseMode === "rules" && (
                            <Badge className="bg-blue-500">Vybrané</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold mb-1">Len bot</h3>
                        <p className="text-sm text-muted-foreground">
                          Bot odpovedá iba podľa pravidiel a šablón, bez AI
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
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Jazyk a časové pásmo */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Krok 3: Jazyk a časové pásmo</CardTitle>
                    <CardDescription>
                      Nastav jazyk bota a časové pásmo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
              </motion.div>
            )}

            {/* Step 4: Prepojenie (Telegram Token) */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Krok 4: Prepojenie s Telegram</CardTitle>
                    <CardDescription>
                      Pridaj Telegram Bot Token (môžeš pridať neskôr)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="botToken">Bot Token</Label>
                      <Input
                        id="botToken"
                        type="password"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                      />
                      <p className="text-xs text-muted-foreground">
                        Token môžeš získať od{" "}
                        <a
                          href="https://t.me/BotFather"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline inline-flex items-center gap-1"
                        >
                          @BotFather
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {" "}na Telegrame. Môžeš ho pridať aj neskôr v nastaveniach.
                      </p>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium mb-2">Ako získať Bot Token?</p>
                          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                            <li>Otvori Telegram a nájdi @BotFather</li>
                            <li>Pošli príkaz /newbot</li>
                            <li>Postupuj podľa inštrukcií a získaš token</li>
                            <li>Vlož token vyššie (alebo ho pridaš neskôr)</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 5-7: Placeholder steps */}
            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Krok 5: Funkcie a moduly</CardTitle>
                    <CardDescription>
                      Zapni alebo vypni jednotlivé funkcie bota
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Toto nastavenie bude dostupné v detailných nastaveniach bota po vytvorení.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 6 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Krok 6: Správy a šablóny</CardTitle>
                    <CardDescription>
                      Nastav šablóny správ pre bota
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Toto nastavenie bude dostupné v detailných nastaveniach bota po vytvorení.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 7 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Krok 7: Preview a uloženie</CardTitle>
                    <CardDescription>
                      Prehľad nastavení a uloženie bota
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Základné informácie</Label>
                      <div className="p-4 bg-muted rounded-lg space-y-1">
                        <p><strong>Meno:</strong> {botName || "—"}</p>
                        <p><strong>Verejné meno:</strong> {publicName || "—"}</p>
                        <p><strong>Popis:</strong> {description || "—"}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nastavenia</Label>
                      <div className="p-4 bg-muted rounded-lg space-y-1">
                        <p><strong>Režim:</strong> {responseMode === "ai" ? "Bot + AI" : "Len bot"}</p>
                        <p><strong>Jazyk:</strong> {botLanguage}</p>
                        <p><strong>Časové pásmo:</strong> {timezone}</p>
                        <p><strong>Token:</strong> {botToken ? "✓ Pridaný" : "— (pridá sa neskôr)"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="mt-6 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-6 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Bot bol úspešne vytvorený! Presmerovávam...</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Späť
                </Button>
              )}
              {currentStep < 7 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={currentStep === 1 && !botName.trim()}
                  className="flex-1"
                >
                  Ďalej
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/telegram-bots")}
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
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </AnimatedPage>
  );
}
