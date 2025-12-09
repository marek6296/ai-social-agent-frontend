"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";

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
  const [widgetPosition, setWidgetPosition] =
    useState<WidgetPosition>("right");

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
        .select(
          "id, company_name, bot_name, description, tone, capture_leads_enabled, widget_position"
        )
        .eq("user_id", id)
        .maybeSingle();

      if (!settingsError && settings) {
        setSettingsId(settings.id ?? null);
        setCompanyName(settings.company_name ?? "");
        setBotName(settings.bot_name ?? "");
        setDescription(settings.description ?? "");

        if (
          settings.tone === "friendly" ||
          settings.tone === "formal" ||
          settings.tone === "casual"
        ) {
          setTone(settings.tone);
        }

        setCaptureLeadsEnabled(!!settings.capture_leads_enabled);

        if (settings.widget_position === "left" || settings.widget_position === "right") {
          setWidgetPosition(settings.widget_position);
        }
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
        capture_leads_enabled: captureLeadsEnabled,
        widget_position: widgetPosition,
      };

      if (settingsId) {
        payload.id = settingsId;
      }

      const { error: upsertError } = await supabase
        .from("bot_settings")
        .upsert(payload);

      if (upsertError) {
        console.error("Bot settings save error:", upsertError);
        setError("Nepodarilo sa uložiť nastavenia. Skús to znova.");
      } else {
        setSuccess(
          "Nastavenia boli uložené. Tvoj bot ich už používa v teste aj na webe."
        );
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
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-white flex items-center justify-center">
          <p className="text-sm text-slate-400">Načítavam nastavenia bota…</p>
        </main>
      </AnimatedPage>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
          <header className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <p className="text-xs text-emerald-400/80 mb-1">
                Krok 1 – kto je tvoj chatbot
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Nastavenia tvojho AI chatbota
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-2xl">
                Tieto nastavenia určujú, ako sa tvoj bot predstavuje návštevníkom a ako odpovedá.
                Budú sa používať v teste bota, embed kóde aj v reálnych konverzáciách.
              </p>
            </div>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-colors"
            >
              ← Späť na dashboard
            </a>
          </header>

          <form
            onSubmit={handleSave}
            className="space-y-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:p-6 shadow-lg shadow-black/40"
          >
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-[11px] text-emerald-100 flex flex-col gap-1">
              <span className="font-semibold text-emerald-300 flex items-center gap-2 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Nastav firmu, meno bota a tón komunikácie
              </span>
              <span>
                Tieto informácie bot používa ako základ pri každej odpovedi – spolu s tvojimi FAQ a dátami.
              </span>
            </div>

            {/* Firma + meno */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Názov firmy
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Napr. Detox"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500">
                  Bot bude tento názov používať v predstavení a odpovediach.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Meno bota
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="Napr. Jano, Vlado..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500">
                  Týmto menom sa bot predstaví v chate.
                </p>
              </div>
            </div>

            {/* Popis + tón */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Popis bota / firmy
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder='Napr. "Si AI chatbot s názvom Jano pre firmu Detox."'
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
                <p className="text-[11px] text-slate-500">
                  Čím konkrétnejší popis, tým lepšie vie AI chápať, čo má komunikovať.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">
                  Tón komunikácie
                </label>
                <div className="grid md:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTone("friendly")}
                    className={`rounded-lg border px-3 py-2 text-left text-xs ${
                      tone === "friendly"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-950 hover:border-slate-500"
                    }`}
                  >
                    <div className="font-semibold text-slate-100">Prívetivý</div>
                    <div className="text-[11px] text-slate-400">
                      Ľudský, moderný a milý.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTone("formal")}
                    className={`rounded-lg border px-3 py-2 text-left text-xs ${
                      tone === "formal"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-950 hover:border-slate-500"
                    }`}
                  >
                    <div className="font-semibold text-slate-100">Formálny</div>
                    <div className="text-[11px] text-slate-400">
                      Profesionálny a vecný.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTone("casual")}
                    className={`rounded-lg border px-3 py-2 text-left text-xs ${
                      tone === "casual"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-950 hover:border-slate-500"
                    }`}
                  >
                    <div className="font-semibold text-slate-100">Uvoľnený</div>
                    <div className="text-[11px] text-slate-400">
                      Viac friendly, mierny slang.
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* ✅ Pozícia widgetu */}
            <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
              <p className="text-xs font-medium text-slate-300 mb-1">
                Pozícia bubliny chatbota
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setWidgetPosition("left")}
                  className={`rounded-lg border px-3 py-2 text-left ${
                    widgetPosition === "left"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-950 hover:border-slate-500"
                  }`}
                >
                  <div className="font-semibold text-slate-100">
                    Vľavo dole
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Bublina chatbota bude v ľavom dolnom rohu.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWidgetPosition("right")}
                  className={`rounded-lg border px-3 py-2 text-left ${
                    widgetPosition === "right"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-950 hover:border-slate-500"
                  }`}
                >
                  <div className="font-semibold text-slate-100">
                    Vpravo dole
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Štandardné umiestnenie v pravom dolnom rohu.
                  </div>
                </button>
              </div>
            </div>

            {/* ✅ Zber kontaktov */}
            <div className="mt-2 space-y-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setCaptureLeadsEnabled((v) => !v)}
                  className={`mt-0.5 h-5 w-10 rounded-full border transition-colors flex items-center ${
                    captureLeadsEnabled
                      ? "border-emerald-500 bg-emerald-500/80 justify-end"
                      : "border-slate-600 bg-slate-800 justify-start"
                  }`}
                >
                  <span className="h-4 w-4 rounded-full bg-slate-950 shadow" />
                </button>
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-slate-100">
                    Zobrazovať formulár na zber kontaktov v chate
                  </p>
                  <p className="text-[11px] text-slate-400">
                    V chate sa zobrazí možnosť{" "}
                    <strong>„Chceš, aby sa ti niekto ozval? Zanechaj kontakt.“</strong>.
                    Zákazník vyplní meno, email a poznámku a kontakt sa uloží do prehľadu leadov.
                  </p>
                </div>
              </div>
            </div>

            {/* Stav + tlačidlo */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
              <div className="text-[11px] text-slate-500">
                Tieto nastavenia sa použijú v teste bota, embed kóde a vo všetkých
                odpovediach pre tvojich zákazníkov.
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-black text-sm font-semibold transition-colors"
              >
                {saving ? "Ukladám…" : "Uložiť nastavenia"}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 pt-1">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-emerald-400 pt-1">
                {success}
              </p>
            )}
          </form>
        </div>
      </main>
    </AnimatedPage>
  );
}