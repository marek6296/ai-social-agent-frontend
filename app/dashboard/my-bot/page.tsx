"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ChatWidget } from "@/components/ChatWidget";
import { AnimatedPage } from "@/components/AnimatedPage";

type UserProfile = {
  id: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
};

export default function MyBotPage() {
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

      const { id, email, user_metadata } = data.user;

      setUser({
        id,
        email: email ?? null,
        firstName: user_metadata?.firstName,
        lastName: user_metadata?.lastName,
      });

      setLoading(false);
    };

    loadUser();
  }, [router]);

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  if (loading) {
    return (
      <AnimatedPage>
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-white flex items-center justify-center">
          <p className="text-sm text-slate-400">Načítavam tvojho bota…</p>
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
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col gap-6 md:gap-8">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-emerald-400/80 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Test tvojho AI chatbota
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {fullName || user.email} – tvoj firemný bot
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-xl">
                Na tejto stránke si vieš vyskúšať, ako bude tvoj AI chatbot
                odpovedať reálnym zákazníkom na tvojej webovej stránke – s tvojimi
                nastaveniami bota a firemnými FAQ.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 text-[11px] text-slate-400">
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-colors"
              >
                ← Späť na dashboard
              </a>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 border border-slate-800 text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Tento test vidíš len ty ako administrátor.</span>
              </div>
            </div>
          </header>

          <section className="grid md:grid-cols-2 gap-4 md:gap-6 items-start">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:p-5 shadow-lg shadow-black/40 text-xs md:text-sm text-slate-300 space-y-3">
              <h2 className="text-sm md:text-base font-semibold flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-400/40 text-[13px]">
                  🤖
                </span>
                Ako testovať tvojho bota
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Spýtaj sa na cenu, balíky alebo spoluprácu.</li>
                <li>Over, či vie popísať tvoju firmu podľa nastavení bota.</li>
                <li>Skús otázky, ktoré si pridal do FAQ &amp; firemné odpovede.</li>
                <li>Skús aj „blbé“ otázky – mal by slušne priznať, čo nevie.</li>
                <li>Skús kliknúť na možnosť „Chceš, aby sa ti niekto ozval? Zanechaj kontakt.“ a otestuj ukladanie leadov.</li>
              </ul>
              <p className="pt-1 text-[11px] text-slate-500">
                Vpravo dole vidíš bublinku tvojho firemného bota – presne takto sa
                bude správať na tvojej webovej stránke.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-5 shadow-lg shadow-black/40 text-[11px] md:text-xs text-slate-300 space-y-3">
              <h3 className="text-sm font-semibold mb-1">Tipy pre lepšie odpovede</h3>
              <ul className="space-y-1.5">
                <li>
                  <span className="text-slate-400">1.</span> Dopln si podrobný popis
                  firmy v nastaveniach bota – AI bude vedieť, čo presne ponúkaš.
                </li>
                <li>
                  <span className="text-slate-400">2.</span> Pridaj najčastejšie
                  otázky do sekcie <strong>FAQ &amp; firemné odpovede</strong>.
                </li>
                <li>
                  <span className="text-slate-400">3.</span> Otestuj konverzácie v
                  rôznych scenároch (nový zákazník, existujúci klient,
                  reklamácia...).
                </li>
                <li>
                  <span className="text-slate-400">4.</span> Pozri si históriu
                  konverzácií a analytiku, aby si videl, aké otázky sa pýtajú
                  najviac.
                </li>
                <li>
                  <span className="text-slate-400">5.</span> Otestuj aj formulár na zber kontaktov v chate – zákazník môže nechať email a ty ho uvidíš v prehľade leadov.
                </li>
              </ul>
              <p className="pt-2 text-[11px] text-slate-500">
                Všetky zmeny v nastaveniach bota a FAQ sa okamžite prejavia aj v
                tomto teste.
              </p>
            </div>
          </section>
        </div>

        {/* TU JE KLÚČ: bublina s botom KONKRÉTNEHO USERA */}
        <ChatWidget ownerUserId={user.id} />
      </main>
    </AnimatedPage>
  );
}