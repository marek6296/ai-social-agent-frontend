"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type UserProfile = {
  email: string | null;
  firstName?: string;
  lastName?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.push("/login");
        return;
      }

      const { email, user_metadata } = data.user;

      setUser({
        email: email ?? null,
        firstName: user_metadata?.firstName,
        lastName: user_metadata?.lastName,
      });

      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  const embedCode = `<script src="https://tvoja-domena.sk/embed.js" data-bot-id="TVOJ_BOT_ID"></script>`;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-white flex items-center justify-center">
        <p className="text-sm text-slate-400">Načítavam tvoj dashboard…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 flex flex-col gap-6">
        {/* Horný bar */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-sm font-bold">
              AI
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Vitaj späť</p>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                Ahoj, {fullName || user?.email}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Tu spravuješ svoj firemný AI chatbot – nastavenia, FAQ a prehľad
                konverzácií.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-wide text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Chatbot plán (demo)
            </span>
            <button
              onClick={handleLogout}
              className="text-xs md:text-sm px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Odhlásiť sa
            </button>
          </div>
        </header>

        {/* Hlavné karty – nastavenia, FAQ, konverzácie */}
        <section className="grid gap-4 md:grid-cols-3">
          {/* Nastavenia chatbota */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col justify-between gap-3">
            <div>
              <h2 className="text-sm md:text-base font-semibold mb-1">
                Nastavenia chatbota
              </h2>
              <p className="text-xs text-slate-400">
                Uprav meno bota, firmu, popis a štýl komunikácie, ktorý bude
                používať pri odpovediach.
              </p>
            </div>
            <Link
              href="/dashboard/bot-settings"
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Otvoriť nastavenia →
            </Link>
          </div>

          {/* FAQ */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col justify-between gap-3">
            <div>
              <h2 className="text-sm md:text-base font-semibold mb-1">
                FAQ &amp; firemné odpovede
              </h2>
              <p className="text-xs text-slate-400">
                Pridaj otázky a odpovede, ktoré má AI uprednostniť pri
                odpovedaní návštevníkom.
              </p>
            </div>
            <Link
              href="/dashboard/faq"
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Spravovať FAQ →
            </Link>
          </div>

          {/* Konverzácie */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col justify-between gap-3">
            <div>
              <h2 className="text-sm md:text-base font-semibold mb-1">
                Konverzácie bota
              </h2>
              <p className="text-xs text-slate-400">
                Pozri si, čo sa návštevníci pýtajú a ako tvoj chatbot
                odpovedá. Ideálne na kontrolu kvality a nápady na obsah.
              </p>
            </div>
            <Link
              href="/dashboard/conversations"
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Zobraziť konverzácie →
            </Link>
          </div>
        </section>

        {/* Embed kód */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm md:text-base font-semibold">
                Embed kód na vloženie na web
              </h2>
              <p className="text-xs text-slate-400">
                Toto je ukážkový kód, ako budeš neskôr vkladať chat widget na
                web svojich klientov.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(embedCode)}
              className="text-[11px] px-3 py-1.5 rounded-md border border-slate-700 hover:bg-slate-800 text-slate-100"
            >
              Skopírovať kód
            </button>
          </div>

          <div className="relative mt-1">
            <textarea
              readOnly
              className="w-full rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-200 p-3 resize-none min-h-[100px]"
              value={embedCode}
            />
            <div className="pointer-events-none absolute inset-0 rounded-lg border border-slate-800/40" />
          </div>

          <p className="text-[11px] text-slate-500">
            Neskôr sem doplníme skutočný script, ktorý načíta tvojho AI
            chatbota podľa ID klienta a jeho nastavení v databáze.
          </p>
        </section>
      </div>
    </main>
  );
}