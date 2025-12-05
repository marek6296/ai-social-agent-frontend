"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type BotSettings = {
  id?: string;
  bot_name: string;
  company_name: string;
  description: string;
  tone: string;
};

export default function BotSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<BotSettings>({
    bot_name: "AI asistent",
    company_name: "",
    description: "",
    tone: "friendly",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError("Musíš byť prihlásený.");
          return;
        }

        const { data, error: settingsError } = await supabase
          .from("bot_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (settingsError) {
          console.error(settingsError);
          setError("Nepodarilo sa načítať nastavenia bota.");
          return;
        }

        if (data) {
          setForm({
            id: data.id,
            bot_name: data.bot_name ?? "AI asistent",
            company_name: data.company_name ?? "",
            description: data.description ?? "",
            tone: data.tone ?? "friendly",
          });
        }
      } catch (err) {
        console.error(err);
        setError("Nastala neočakávaná chyba pri načítavaní.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (field: keyof BotSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Musíš byť prihlásený.");
        setSaving(false);
        return;
      }

      const payload = {
        bot_name: form.bot_name,
        company_name: form.company_name,
        description: form.description,
        tone: form.tone,
        user_id: user.id,
      };

      let dbError = null;

      if (form.id) {
        const { error } = await supabase
          .from("bot_settings")
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq("id", form.id)
          .eq("user_id", user.id);

        dbError = error;
      } else {
        const { data, error } = await supabase
          .from("bot_settings")
          .insert(payload)
          .select("*")
          .single();

        dbError = error;
        if (!error && data) {
          setForm((prev) => ({ ...prev, id: data.id }));
        }
      }

      if (dbError) {
        console.error(dbError);
        setError("Nepodarilo sa uložiť nastavenia.");
      } else {
        // po uložení môžeš dať malý refresh dashboardu alebo len info
        // router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("Nastala neočakávaná chyba pri ukladaní.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex justify-center items-center">
        <p className="text-sm text-slate-400">Načítavam nastavenia chatbota…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Nastavenia chatbota</h1>
        <p className="text-sm text-slate-400 mb-6">
          Tu si nastavíš, ako sa má tvoj AI chatbot správať a v mene akej značky
          komunikuje. Tieto údaje budeme neskôr používať pri odpovediach AI.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Názov bota
              </label>
              <input
                type="text"
                value={form.bot_name}
                onChange={(e) => handleChange("bot_name", e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="AI asistent, AI Social Agent…"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Názov firmy / značky
              </label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => handleChange("company_name", e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="AI Social Agent s.r.o."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Popis firmy / čo má bot robiť
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Napr. Sme agentúra, ktorá robí AI chatbotov pre malé a stredné firmy. Bot má odpovedať na otázky o našich službách a pricingu."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Tón komunikácie
            </label>
            <select
              value={form.tone}
              onChange={(e) => handleChange("tone", e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="friendly">Priateľský</option>
              <option value="formal">Formálny</option>
              <option value="casual">Uvoľnený / slang</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-black transition-colors"
            >
              {saving ? "Ukladám…" : "Uložiť nastavenia"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}