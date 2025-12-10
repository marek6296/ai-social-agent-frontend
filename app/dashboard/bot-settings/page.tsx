"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Settings, Sparkles } from "lucide-react";
import Link from "next/link";

type UserProfile = {
  id: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
};

type ToneType = "friendly" | "formal" | "casual";
type WidgetPosition = "left" | "right";

export default function BotSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [botName, setBotName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<ToneType>("friendly");
  const [captureLeadsEnabled, setCaptureLeadsEnabled] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState<WidgetPosition>("right");
  
  // Pokročilé widget nastavenia
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState("#10b981");
  const [widgetBackgroundColor, setWidgetBackgroundColor] = useState("#0f172a");
  const [widgetWelcomeMessage, setWidgetWelcomeMessage] = useState("");
  const [widgetLogoUrl, setWidgetLogoUrl] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.push("/login");
        return;
      }

      const { id, email, user_metadata } = userData.user;

      const profile: UserProfile = {
        id,
        email: email ?? null,
        firstName: user_metadata?.firstName,
        lastName: user_metadata?.lastName,
      };
      setUser(profile);

      const { data: settings, error: settingsError } = await supabase
        .from("bot_settings")
        .select("id, company_name, bot_name, description, tone, show_lead_form_enabled, widget_position")
        .eq("user_id", id)
        .maybeSingle();

      if (settingsError) {
        console.warn("Error loading basic settings:", settingsError);
      }

      const { data: advancedSettings } = await supabase
        .from("bot_settings")
        .select("widget_primary_color, widget_background_color, widget_welcome_message, widget_logo_url")
        .eq("user_id", id)
        .maybeSingle();

      const allSettings = { ...settings, ...advancedSettings };

      if (!settingsError && allSettings) {
        setSettingsId(allSettings.id ?? null);
        setCompanyName(allSettings.company_name ?? "");
        setBotName(allSettings.bot_name ?? "");
        setDescription(allSettings.description ?? "");

        if (
          allSettings.tone === "friendly" ||
          allSettings.tone === "formal" ||
          allSettings.tone === "casual"
        ) {
          setTone(allSettings.tone);
        }

        setCaptureLeadsEnabled(!!allSettings.show_lead_form_enabled);

        if (allSettings.widget_position === "left" || allSettings.widget_position === "right") {
          setWidgetPosition(allSettings.widget_position);
        }

        setWidgetPrimaryColor(allSettings.widget_primary_color || "#10b981");
        setWidgetBackgroundColor(allSettings.widget_background_color || "#0f172a");
        setWidgetWelcomeMessage(allSettings.widget_welcome_message || "");
        setWidgetLogoUrl(allSettings.widget_logo_url || "");
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: any = {
        user_id: user.id,
        company_name: companyName || null,
        bot_name: botName || null,
        description: description || null,
        tone,
        show_lead_form_enabled: captureLeadsEnabled,
        widget_position: widgetPosition,
      };

      payload.widget_primary_color = 
        widgetPrimaryColor && widgetPrimaryColor.trim() && widgetPrimaryColor !== "#10b981"
          ? widgetPrimaryColor.trim()
          : null;
      payload.widget_background_color = 
        widgetBackgroundColor && widgetBackgroundColor.trim() && widgetBackgroundColor !== "#0f172a"
          ? widgetBackgroundColor.trim()
          : null;
      payload.widget_welcome_message = 
        widgetWelcomeMessage && widgetWelcomeMessage.trim()
          ? widgetWelcomeMessage.trim()
          : null;
      payload.widget_logo_url = 
        widgetLogoUrl && widgetLogoUrl.trim()
          ? widgetLogoUrl.trim()
          : null;

      if (settingsId) {
        const { error: updateError } = await supabase
          .from("bot_settings")
          .update(payload)
          .eq("id", settingsId);

        if (updateError) {
          console.error("Update error:", updateError);
          setError("Nepodarilo sa uložiť nastavenia: " + updateError.message);
        } else {
          setSuccess("Nastavenia boli úspešne uložené.");
          // Po úspešnom uložení refreshni stránku, aby sa prejavili zmeny (napr. pozícia bota)
          setTimeout(() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            } else {
              router.refresh();
            }
          }, 150);
        }
      } else {
        const { error: insertError } = await supabase
          .from("bot_settings")
          .insert(payload);

        if (insertError) {
          console.error("Insert error:", insertError);
          setError("Nepodarilo sa uložiť nastavenia: " + insertError.message);
        } else {
          setSuccess("Nastavenia boli úspešne uložené.");
          setTimeout(() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            } else {
              router.refresh();
            }
          }, 150);
        }
      }
    } catch (err) {
      console.error("Bot settings save exception:", err);
      setError("Nastala neočakávaná chyba pri ukladaní.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" style={{ animation: 'spin 1s linear infinite' }} />
            <p className="text-sm text-muted-foreground">Načítavam nastavenia…</p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <motion.header
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <Badge variant="secondary" className="mb-2 gap-1.5">
                <Settings className="h-3 w-3" />
                Nastavenia chatbota
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Nastavenia tvojho AI chatbota
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Tieto nastavenia určujú, ako sa tvoj bot predstavuje návštevníkom a ako odpovedá.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" size="default" asChild className="gap-2 px-4 py-2 font-semibold">
                <Link href="/dashboard" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Späť
                </Link>
              </Button>
            </div>
          </motion.header>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Základné informácie */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    Základné informácie
                  </CardTitle>
                <CardDescription>
                  Nastav firmu, meno bota a tón komunikácie. Tieto informácie bot používa ako základ pri každej odpovedi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Názov firmy</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Napr. Detox"
                    />
                    <p className="text-xs text-muted-foreground">
                      Bot bude tento názov používať v predstavení a odpovediach.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="botName">Meno bota</Label>
                    <Input
                      id="botName"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="Napr. Jano, Vlado..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Týmto menom sa bot predstaví v chate.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Popis bota / firmy</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder='Napr. "Si AI chatbot s názvom Jano pre firmu Detox."'
                  />
                  <p className="text-xs text-muted-foreground">
                    Čím konkrétnejší popis, tým lepšie vie AI chápať, čo má komunikovať.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tón komunikácie</Label>
                  <div className="grid md:grid-cols-3 gap-3">
                    {(["friendly", "formal", "casual"] as ToneType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTone(t);
                        }}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer overflow-hidden ${
                          tone === t
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                            : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                        }`}
                      >
                        {tone === t && (
                          <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-primary" />
                        )}
                        {tone === t && (
                          <div className="absolute top-1 right-1 text-white text-[10px] font-bold z-10">
                            ✓
                          </div>
                        )}
                        <div className="font-semibold capitalize mb-1">
                          {t === "friendly" ? "Prívetivý" : t === "formal" ? "Formálny" : "Uvoľnený"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t === "friendly" ? "Ľudský, moderný a milý." : t === "formal" ? "Profesionálny a vecný." : "Viac friendly, mierny slang."}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Widget nastavenia */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                    Nastavenia widgetu
                  </CardTitle>
                <CardDescription>
                  Nastav, kde sa zobrazí chatbot a či má zberať kontakty.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pozícia bubliny chatbota</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["left", "right"] as WidgetPosition[]).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setWidgetPosition(pos);
                        }}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer overflow-hidden ${
                          widgetPosition === pos
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                            : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                        }`}
                      >
                        {widgetPosition === pos && (
                          <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-primary" />
                        )}
                        {widgetPosition === pos && (
                          <div className="absolute top-1 right-1 text-white text-[10px] font-bold z-10">
                            ✓
                          </div>
                        )}
                        <div className="font-semibold mb-1">
                          {pos === "left" ? "Vľavo dole" : "Vpravo dole"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pos === "left" ? "Bublina chatbota bude v ľavom dolnom rohu." : "Štandardné umiestnenie v pravom dolnom rohu."}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-4">
                  <Switch
                    checked={captureLeadsEnabled}
                    onCheckedChange={setCaptureLeadsEnabled}
                  />
                  <div className="space-y-1 flex-1">
                    <Label>Zobrazovať formulár na zber kontaktov v chate</Label>
                    <p className="text-xs text-muted-foreground">
                      V chate sa zobrazí možnosť "Chceš, aby sa ti niekto ozval? Zanechaj kontakt.".
                      Zákazník vyplní meno, email a poznámku a kontakt sa uloží do prehľadu leadov.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Pokročilé nastavenia */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    Pokročilé prispôsobenie widgetu
                  </CardTitle>
                <CardDescription>
                  Voliteľné nastavenia pre pokročilé prispôsobenie vzhľadu chatbota.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primárna farba widgetu</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="primaryColor"
                        value={widgetPrimaryColor}
                        onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                        className="h-10 w-20 rounded-lg border cursor-pointer"
                      />
                      <Input
                        value={widgetPrimaryColor}
                        onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                        placeholder="#10b981"
                        className="font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Farba tlačidiel a accent prvkov v chate.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Farba pozadia widgetu</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="backgroundColor"
                        value={widgetBackgroundColor}
                        onChange={(e) => setWidgetBackgroundColor(e.target.value)}
                        className="h-10 w-20 rounded-lg border cursor-pointer"
                      />
                      <Input
                        value={widgetBackgroundColor}
                        onChange={(e) => setWidgetBackgroundColor(e.target.value)}
                        placeholder="#0f172a"
                        className="font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pozadie chat okna.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Vlastná úvodná správa</Label>
                  <Textarea
                    id="welcomeMessage"
                    value={widgetWelcomeMessage}
                    onChange={(e) => setWidgetWelcomeMessage(e.target.value)}
                    rows={2}
                    placeholder="Napr. 'Ahoj! Som AI asistent firmy XYZ. Ako ti môžem pomôcť?' (Ak necháš prázdne, použije sa default správa)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Prvá správa, ktorú uvidí návštevník pri otvorení chatu.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">URL loga / avatara bota</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={widgetLogoUrl}
                    onChange={(e) => setWidgetLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL obrázka, ktorý sa zobrazí namiesto default AI ikony v chate.
                  </p>
                  {widgetLogoUrl && (
                    <div className="mt-2">
                      <img
                        src={widgetLogoUrl}
                        alt="Logo preview"
                        className="h-12 w-12 rounded-full object-cover border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

            {/* Error/Success messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border border-primary bg-primary/10 text-primary text-sm backdrop-blur-sm"
              >
                {success}
              </motion.div>
            )}

            {/* Save button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} size="lg">
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" style={{ animation: 'spin 1s linear infinite' }} />
                    Ukladám…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Uložiť nastavenia
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AnimatedPage>
  );
}
