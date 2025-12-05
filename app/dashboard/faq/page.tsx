"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export default function FaqPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<FaqItem[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  // načítanie FAQ po načítaní stránky
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Musíš byť prihlásený, aby si videl FAQ.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("faq_items")
        .select("id, question, answer")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError("Nepodarilo sa načítať FAQ.");
      } else {
        setItems((data as FaqItem[]) ?? []);
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || !answer.trim()) {
      setError("Otázka aj odpoveď musia byť vyplnené.");
      return;
    }

    setSaving(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Musíš byť prihlásený.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("faq_items")
      .insert({
        user_id: user.id,
        question: question.trim(),
        answer: answer.trim(),
      })
      .select("id, question, answer")
      .single();

    if (error) {
      console.error(error);
      setError("Nepodarilo sa pridať FAQ.");
    } else if (data) {
      setItems((prev) => [data as FaqItem, ...prev]);
      setQuestion("");
      setAnswer("");
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Naozaj chceš odstrániť túto FAQ položku?");
    if (!confirmed) return;

    const { error } = await supabase.from("faq_items").delete().eq("id", id);

    if (error) {
      console.error(error);
      setError("Nepodarilo sa odstrániť FAQ.");
    } else {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-slate-400">Načítavam FAQ…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">FAQ &amp; firemné odpovede</h1>
            <p className="text-xs text-slate-400">
              Tu si vieš pridať často kladené otázky a odpovede, ktoré bude AI
              používať pri odpovedaní návštevníkom.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            ← Späť na dashboard
          </Link>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Formulár na pridanie FAQ */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h2 className="text-sm font-semibold mb-1">Pridať novú FAQ</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Otázka (čo sa klienti pýtajú)
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Napr. Ako funguje váš produkt?"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Odpoveď (čo má AI odpovedať)
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Stručná, jasná odpoveď v štýle tvojej značky."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-black"
              >
                {saving ? "Ukladám…" : "Pridať FAQ"}
              </button>
            </div>
          </form>
        </section>

        {/* Zoznam FAQ */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h2 className="text-sm font-semibold">Tvoje FAQ</h2>
          {items.length === 0 ? (
            <p className="text-xs text-slate-400">
              Zatiaľ nemáš žiadne FAQ. Pridaj aspoň 3–5 najčastejších otázok
              a odpovedí.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="border border-slate-800 rounded-lg p-3 bg-slate-950/50"
                >
                  <p className="text-xs font-semibold text-slate-100 mb-1">
                    Q: {item.question}
                  </p>
                  <p className="text-xs text-slate-300 mb-2">
                    A: {item.answer}
                  </p>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-[11px] text-red-400 hover:text-red-300"
                  >
                    Odstrániť
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}