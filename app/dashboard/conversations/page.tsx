"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type ChatLog = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
};

export default function ConversationsPage() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Musíš byť prihlásený, aby si videl konverzácie.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("chat_logs")
        .select("id, question, answer, created_at")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError("Nepodarilo sa načítať konverzácie.");
      } else {
        setLogs((data as ChatLog[]) ?? []);
      }

      setLoading(false);
    };

    load();
  }, []);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("sk-SK", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-slate-400">Načítavam konverzácie…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Konverzácie bota</h1>
            <p className="text-xs text-slate-400">
              Prehľad otázok a odpovedí, ktoré tvoj AI chatbot riešil s
              návštevníkmi. Vhodné na kontrolu kvality a insights.
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

        {logs.length === 0 ? (
          <p className="text-xs text-slate-400">
            Zatiaľ nemáš žiadne konverzácie. Skús si napísať do chatbota na
            hlavnej stránke a potom sa sem vráť.
          </p>
        ) : (
          <section className="space-y-3">
            {logs.map((log) => (
              <article
                key={log.id}
                className="border border-slate-800 rounded-2xl bg-slate-900/60 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-500">
                    {formatDate(log.created_at)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-100 mb-1">
                  🧑‍💻 Otázka:
                </p>
                <p className="text-sm text-slate-200 mb-3 whitespace-pre-wrap">
                  {log.question}
                </p>

                <p className="text-xs font-semibold text-slate-100 mb-1">
                  🤖 Odpoveď bota:
                </p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {log.answer}
                </p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}