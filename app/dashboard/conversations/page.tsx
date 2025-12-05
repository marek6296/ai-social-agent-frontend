"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type ChatLog = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  category: string | null;
};

function inferCategory(log: ChatLog): string {
  const q = (log.question || "").toLowerCase();

  // Cena / pricing
  if (
    q.includes("cena") ||
    q.includes("koľko stojí") ||
    q.includes("kolko stoji") ||
    q.includes("price") ||
    q.includes("eur") ||
    q.includes("€") ||
    q.includes("predplatné") ||
    q.includes("predplatne") ||
    q.includes("platba") ||
    q.includes("faktur")
  ) {
    return "Cena";
  }

  // Objednávky / nákupy
  if (
    q.includes("objednávka") ||
    q.includes("objednavka") ||
    q.includes("objednať") ||
    q.includes("objednat") ||
    q.includes("kúpiť") ||
    q.includes("kupit") ||
    q.includes("order") ||
    q.includes("purchase") ||
    q.includes("zakúpiť") ||
    q.includes("zakupit")
  ) {
    return "Objednávky";
  }

  // Podpora / kontakt
  if (
    q.includes("podpora") ||
    q.includes("support") ||
    q.includes("kontakt") ||
    q.includes("pomoc") ||
    q.includes("help") ||
    q.includes("reklamácia") ||
    q.includes("reklamacia") ||
    q.includes("sťažnosť") ||
    q.includes("staznost")
  ) {
    return "Podpora";
  }

  // Technické
  if (
    q.includes("nefunguje") ||
    q.includes("chyba") ||
    q.includes("error") ||
    q.includes("bug") ||
    q.includes("nastavenie") ||
    q.includes("konfigurácia") ||
    q.includes("konfiguracia") ||
    q.includes("prihlásiť") ||
    q.includes("prihlasit") ||
    q.includes("login")
  ) {
    return "Technické";
  }

  // Produkt / služba
  if (
    q.includes("čo je") ||
    q.includes("co je") ||
    q.includes("ako funguje") ||
    q.includes("čo robí") ||
    q.includes("co robi") ||
    q.includes("ako to funguje") ||
    q.includes("funkcie") ||
    q.includes("features")
  ) {
    return "Produkt / služba";
  }

  // Ak máme kategóriu v DB, použijeme ju
  if (log.category) return log.category;

  return "Iné";
}

export default function ConversationsPage() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchTarget, setSearchTarget] = useState<"both" | "question" | "answer">(
    "both"
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [useDateFilter, setUseDateFilter] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("Všetko");

  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null);

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
        .select("id, question, answer, created_at, category")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError("Nepodarilo sa načítať konverzácie.");
      } else {
        const rows = (data as ChatLog[]) ?? [];
        setLogs(rows);
        if (rows.length > 0) {
          setSelectedLog(rows[0]);
        }
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

  const filteredLogs = (() => {
    // základné zoradenie podľa nastavenia
    const base = sortOrder === "desc" ? logs : [...logs].reverse();

    return base.filter((log) => {
      // textový filter
      let sourceText = "";
      if (searchTarget === "both") {
        sourceText = (log.question + " " + log.answer).toLowerCase();
      } else if (searchTarget === "question") {
        sourceText = log.question.toLowerCase();
      } else {
        sourceText = log.answer.toLowerCase();
      }

      const term = searchTerm.toLowerCase();
      const textMatch = term ? sourceText.includes(term) : true;

      // filter podľa kategórie – používame odhad kategórie z otázky
      const effectiveCategory = inferCategory(log);
      const categoryMatch =
        categoryFilter === "Všetko"
          ? true
          : effectiveCategory === categoryFilter;

      // ak nepoužívame dátumy, riešime len text + kategóriu
      if (!useDateFilter) {
        return textMatch && categoryMatch;
      }

      const created = new Date(log.created_at).getTime();

      const fromOk = dateFrom
        ? created >= new Date(dateFrom + "T00:00:00").getTime()
        : true;

      const toOk = dateTo
        ? created <= new Date(dateTo + "T23:59:59").getTime()
        : true;

      return textMatch && categoryMatch && fromOk && toOk;
    });
  })();

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-slate-400">Načítavam konverzácie…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
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

        {/* Filtrovací panel */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
          {/* Vrchný riadok – vyhľadávanie + režim vyhľadávania + kategórie */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 space-y-2">
              <label className="block text-[11px] uppercase tracking-wide text-slate-400">
                Vyhľadávanie
              </label>
              <input
                type="text"
                placeholder="napr. cena, objednávka, problém, email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                Kde vyhľadávať
              </span>
              <div className="inline-flex rounded-full border border-slate-700 bg-slate-950/80 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSearchTarget("both")}
                  className={`px-3 py-1.5 rounded-full ${
                    searchTarget === "both"
                      ? "bg-emerald-500 text-black"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Otázka + odpoveď
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTarget("question")}
                  className={`px-3 py-1.5 rounded-full ${
                    searchTarget === "question"
                      ? "bg-emerald-500 text-black"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Len otázka
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTarget("answer")}
                  className={`px-3 py-1.5 rounded-full ${
                    searchTarget === "answer"
                      ? "bg-emerald-500 text-black"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Len odpoveď
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                Kategória
              </span>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {[
                  "Všetko",
                  "Cena",
                  "Objednávky",
                  "Podpora",
                  "Technické",
                  "Produkt / služba",
                  "Iné",
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-full border ${
                      categoryFilter === cat
                        ? "bg-emerald-500 text-black border-emerald-400"
                        : "border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Spodný riadok – dátum + zoradenie */}
          <div className="flex flex-col md:flex-row gap-4 md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-[11px] uppercase tracking-wide text-slate-400">
                  Dátumy
                </span>
                <div className="inline-flex rounded-full border border-slate-700 bg-slate-950/80 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setUseDateFilter(false);
                      setDateFrom("");
                      setDateTo("");
                    }}
                    className={`px-3 py-1.5 rounded-full ${
                      !useDateFilter
                        ? "bg-emerald-500 text-black"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    Všetky dátumy
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseDateFilter(true)}
                    className={`px-3 py-1.5 rounded-full ${
                      useDateFilter
                        ? "bg-emerald-500 text-black"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    Filtrovať
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="space-y-1 flex-1">
                  <label className="block text-[10px] text-slate-400">
                    Od
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    disabled={!useDateFilter}
                    className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/70 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <label className="block text-[10px] text-slate-400">
                    Do
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    disabled={!useDateFilter}
                    className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/70 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-500">
                Režim „Všetky dátumy“ ignoruje čas a zobrazí celý prehľad.
              </p>
            </div>

            <div className="space-y-2">
              <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                Zoradenie
              </span>
              <div className="inline-flex rounded-full border border-slate-700 bg-slate-950/80 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSortOrder("desc")}
                  className={`px-3 py-1.5 rounded-full ${
                    sortOrder === "desc"
                      ? "bg-emerald-500 text-black"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Najnovšie hore
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrder("asc")}
                  className={`px-3 py-1.5 rounded-full ${
                    sortOrder === "asc"
                      ? "bg-emerald-500 text-black"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Najstaršie hore
                </button>
              </div>
            </div>
          </div>
        </section>

        {filteredLogs.length === 0 ? (
          <p className="text-xs text-slate-400">
            Nenašli sa žiadne konverzácie pre zadané filtre. Skús upraviť
            vyhľadávanie alebo filtre.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            {/* Zoznam konverzácií */}
            <section className="space-y-3">
              {filteredLogs.map((log) => (
                <article
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`border rounded-2xl p-4 cursor-pointer transition-colors bg-slate-900/60 hover:bg-slate-900 border-slate-800 ${
                    selectedLog?.id === log.id
                      ? "border-emerald-500/70 shadow-[0_0_0_1px_rgba(16,185,129,0.5)]"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-[11px] text-slate-500">
                      {formatDate(log.created_at)}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
                      {inferCategory(log)}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-100 mb-1">
                    🧑‍💻 Otázka:
                  </p>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap line-clamp-2">
                    {log.question}
                  </p>

                  <p className="text-[11px] text-slate-500 mt-2">
                    Klikni pre detail celej konverzácie.
                  </p>
                </article>
              ))}
            </section>

            {/* Detail konverzácie */}
            <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 h-fit lg:sticky lg:top-6">
              {selectedLog ? (
                <>
                  <p className="text-[11px] font-semibold text-slate-300 mb-1">
                    Detail konverzácie
                  </p>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-[11px] text-slate-500">
                      {formatDate(selectedLog.created_at)}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
                      {inferCategory(selectedLog)}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-100 mb-1">
                    🧑‍💻 Otázka:
                  </p>
                  <p className="text-sm text-slate-200 mb-3 whitespace-pre-wrap">
                    {selectedLog.question}
                  </p>

                  <p className="text-xs font-semibold text-slate-100 mb-1">
                    🤖 Odpoveď bota:
                  </p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {selectedLog.answer}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400">
                  Vyber konverzáciu vľavo, aby si videl jej detail.
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}