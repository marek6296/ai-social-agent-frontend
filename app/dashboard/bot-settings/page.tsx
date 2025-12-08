"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";

type Tone = "friendly" | "formal" | "casual";

export default function BotSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [botName, setBotName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError(null);

      const { data: auth, error: userError } = await supabase.auth.getUser();

      if (userError || !auth?.user) {
        router.push("/login");
        return;
      }

      const userId = auth.user.id;

      const { data, error: settingsError } = await supabase
        .from("bot_settings")
        .select("id, company_name, bot_name, description, tone")
        .eq("user_id", userId)
        .maybeSingle();

      if (settingsError) {
        console.error("Chyba pri načítaní bot_settings:", settingsError.message);
        setError("Nepodarilo sa načítať nastavenia bota.");
        setLoading(false);
        return;
      }

      if (data) {
        setSettingsId(data.id);
        setCompanyName(data.company_name ?? "");
        setBotName(data.bot_name ?? "");
        setDescription(data.description ?? "");
        if (
          data.tone === "friendly" ||
          data.tone === "formal" ||
          data.tone === "casual"
        ) {
          setTone(data.tone);
        }
      }

      setLoading(false);
    };

    loadSettings();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const { data: auth, error: userError } = await supabase.auth.getUser();
    if (userError || !auth?.user) {
      setError("Session vypršala. Prihlás sa znova.");
      setSaving(false);
      router.push("/login");
      return;
    }

    const userId = auth.user.id;

    try {
      if (settingsId) {
        const { error: updateError } = await supabase
          .from("bot_settings")
          .update({
            company_name: companyName.trim() || null,
            bot_name: botName.trim() || null,
            description: description.trim() || null,
            tone,
          })
          .eq("id", settingsId)
          .eq("user_id", userId);

        if (updateError) {
          console.error("Chyba pri update bot_settings:", updateError.message);
          setError("Nepodarilo sa uložiť zmeny. Skús to znova.");
          setSaving(false);
          return;
        }

        setSuccess("Nastavenia bota boli aktualizované.");
      } else {
        const { data, error: insertError } = await supabase
          .from("bot_settings")
          .insert({
            user_id: userId,
            company_name: companyName.trim() || null,
            bot_name: botName.trim() || null,
            description: description.trim() || null,
            tone,
          })
          .select("id")
          .maybeSingle();

        if (insertError) {
          console.error("Chyba pri insert bot_settings:", insertError.message);
          setError("Nepodarilo sa uložiť nastavenia. Skús to znova.");
          setSaving(false);
          return;
        }

        if (data?.id) {
          setSettingsId(data.id);
        }

        setSuccess("Nastavenia bota boli uložené.");
      }
    } catch (err) {
      console.error("Neočakávaná chyba pri ukladaní nastavení:", err);
      setError("Niekde sa to pokazilo. Skús to, prosím, znova.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <motion.p
          className="text-sm text-slate-400"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          Načítavam nastavenia bota…
        </motion.p>
      </main>
    );
  }

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white relative overflow-hidden">
        {/* Dekoratívne pozadie */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-32 top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute inset-x-0 top-32 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-40" />
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6">
          {/* Header */}
          <motion.header
            className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            >
              <p className="text-xs text-emerald-300 mb-1">
                Krok 1 – kto je tvoj chatbot
              </p>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                Nastavenia tvojho AI chatbota
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Tieto nastavenia určujú, ako sa tvoj bot predstavuje návštevníkom a
                ako odpovedá. Využívajú sa v teste bota, embed kóde aj v konverzáciách
                na tvojej stránke.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
            >
              <Link
                href="/dashboard"
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ← Späť na dashboard
              </Link>
            </motion.div>
          </motion.header>

          {/* Info badge */}
          <motion.div
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200 flex items-start gap-2 shadow-sm shadow-emerald-500/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
          >
            <span className="mt-[2px] text-sm">✨</span>
            <p>
              Nastav firmu, meno bota a tón komunikácie. Tieto informácie bot používa
              ako základ pri každej odpovedi – spolu s tvojimi FAQ a dátami.
            </p>
          </motion.div>

          {/* Form */}
          <motion.section
            className="rounded-2xl border border-slate-800/80 bg-slate-950/85 p-5 md:p-6 shadow-lg shadow-black/40"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.16 }}
          >
            {error && (
              <motion.div
                className="mb-3 rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                className="mb-3 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {success}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Názov firmy
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Napr. Detox, AI Studio, Coffee House…"
                    className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Bot bude firmu používať v predstavení a odpovediach.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Meno bota
                  </label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="Napr. Jano, AI asistent, Support bot…"
                    className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Týmto menom sa bot predstaví v chate.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Popis bota / firmy
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Stručne popíš, čo vaša firma robí a s čím má bot zákazníkom pomáhať."
                  className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
                <p className="text-[11px] text-slate-500">
                  Čím konkrétnejší popis, tým lepšie vie AI chápať, čo má komunikovať.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Tón komunikácie
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTone("friendly")}
                    className={`rounded-md border px-3 py-2 text-left transition-all ${
                      tone === "friendly"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                        : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    <p className="font-medium">Prívetivý</p>
                    <p className="text-[10px] text-slate-400">
                      Ľudský, moderný a milý.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTone("formal")}
                    className={`rounded-md border px-3 py-2 text-left transition-all ${
                      tone === "formal"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                        : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    <p className="font-medium">Formálny</p>
                    <p className="text-[10px] text-slate-400">
                      Profesionálny a vecný.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTone("casual")}
                    className={`rounded-md border px-3 py-2 text-left transition-all ${
                      tone === "casual"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                        : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    <p className="font-medium">Uvoľnený</p>
                    <p className="text-[10px] text-slate-400">
                      Viac friendly, mierny slang.
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 gap-3">
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Tieto nastavenia sa použijú pri teste bota, embed kóde a vo všetkých
                  odpovediach pre tvojich zákazníkov.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 px-4 py-2 text-xs font-semibold text-black shadow-md shadow-emerald-500/30 transition-colors"
                >
                  {saving ? "Ukladám…" : "Uložiť nastavenia"}
                </button>
              </div>
            </form>
          </motion.section>
        </div>
      </main>
    </AnimatedPage>
  );
}