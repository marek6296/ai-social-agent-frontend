"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ChatWidget } from "@/components/ChatWidget";
import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";

type UserProfile = {
  id: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
};

const cardSpring = (delay: number) => ({
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  delay,
});

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  // Embed kód pre tohto používateľa – data-bot-id = jeho user.id
  const embedCode = `<script src="https://ai-social-agent-frontend.vercel.app/embed.js" data-bot-id="${
    user?.id ?? "TVOJ_BOT_ID"
  }"></script>`;

  if (loading) {
    return (
      <AnimatedPage>
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-white flex items-center justify-center">
          <motion.p
            className="text-sm text-slate-400"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            Načítavam tvoj dashboard…
          </motion.p>
        </main>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 flex flex-col gap-6 md:gap-8">
          {/* Horný bar */}
          <motion.header
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={cardSpring(0.05)}
            >
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-sm font-bold">
                AI
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-1 flex items-center gap-2">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Vitaj späť v AI Social Agent
                </p>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                  Ahoj, {fullName || user?.email}
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Tu spravuješ svoj firemný AI chatbot – nastavenia, FAQ,
                  históriu konverzácií a analýzy. Všetko na jednom mieste.
                </p>
              </div>
            </motion.div>
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={cardSpring(0.1)}
            >
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Chatbot plán · Demo
              </span>
              <button
                onClick={handleLogout}
                className="text-xs md:text-sm px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Odhlásiť sa
              </button>
            </motion.div>
          </motion.header>

          {/* Hlavné karty – nastavenia, FAQ, konverzácie, analytics */}
          <motion.section
            className="grid gap-4 md:grid-cols-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.06 }}
          >
            {/* Nastavenia chatbota */}
            <motion.div
              className="relative rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col justify-between gap-3 transition-shadow duration-200 hover:shadow-xl hover:shadow-black/60 hover:border-emerald-500/50 cursor-pointer"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={cardSpring(0.12)}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div>
                <h2 className="text-sm md:text-base font-semibold mb-1">
                  Nastavenia chatbota
                </h2>
                <p className="text-xs text-slate-400">
                  Uprav meno bota, firmu, popis a štýl komunikácie, ktorý bude
                  používať pri odpovediach.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span>Otvoriť nastavenia</span>
                <span>→</span>
              </div>
              {/* celý box je klikateľný */}
              <Link
                href="/dashboard/bot-settings"
                aria-label="Otvoriť nastavenia chatbota"
                className="absolute inset-0"
              />
            </motion.div>

            {/* FAQ */}
            <motion.div
              className="relative rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col justify-between gap-3 transition-shadow duration-200 hover:shadow-xl hover:shadow-black/60 hover:border-emerald-500/50 cursor-pointer"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={cardSpring(0.14)}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div>
                <h2 className="text-sm md:text-base font-semibold mb-1">
                  FAQ &amp; firemné odpovede
                </h2>
                <p className="text-xs text-slate-400">
                  Pridaj otázky a odpovede, ktoré má AI uprednostniť pri
                  odpovedaní návštevníkom.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span>Spravovať FAQ</span>
                <span>→</span>
              </div>
              <Link
                href="/dashboard/faq"
                aria-label="Spravovať FAQ"
                className="absolute inset-0"
              />
            </motion.div>

            {/* Konverzácie */}
            <motion.div
              className="relative rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col justify-between gap-3 transition-shadow duration-200 hover:shadow-xl hover:shadow-black/60 hover:border-emerald-500/50 cursor-pointer"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={cardSpring(0.16)}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div>
                <h2 className="text-sm md:text-base font-semibold mb-1">
                  Konverzácie bota
                </h2>
                <p className="text-xs text-slate-400">
                  Pozri si, čo sa návštevníci pýtajú a ako tvoj chatbot odpovedá.
                  Ideálne na kontrolu kvality a nápady na obsah.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span>Zobraziť konverzácie</span>
                <span>→</span>
              </div>
              <Link
                href="/dashboard/conversations"
                aria-label="Zobraziť konverzácie"
                className="absolute inset-0"
              />
            </motion.div>

            {/* Analytics bota */}
            <motion.div
              className="relative rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col justify-between gap-3 transition-shadow duration-200 hover:shadow-xl hover:shadow-black/60 hover:border-emerald-500/50 cursor-pointer"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={cardSpring(0.18)}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div>
                <h2 className="text-sm md:text-base font-semibold mb-1">
                  Analytics bota
                </h2>
                <p className="text-xs text-slate-400">
                  Zisti, koľko konverzácií vzniká, v ktoré dni je bot
                  najaktívnejší a ako sa používanie mení v čase.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span>Otvoriť štatistiky</span>
                <span>→</span>
              </div>
              <Link
                href="/dashboard/analytics"
                aria-label="Otvoriť štatistiky"
                className="absolute inset-0"
              />
            </motion.div>

            {/* Leady z chatu */}
            <motion.div
              className="relative rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col justify-between gap-3 transition-shadow duration-200 hover:shadow-xl hover:shadow-black/60 hover:border-emerald-500/50 cursor-pointer"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={cardSpring(0.2)}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div>
                <h2 className="text-sm md:text-base font-semibold mb-1">
                  Leady z chatu
                </h2>
                <p className="text-xs text-slate-400">
                  Zobraz si kontakty, ktoré návštevníci zanechali vo formulári v chate
                  tvojho AI chatbota.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span>Otvoriť leady</span>
                <span>→</span>
              </div>
              <Link
                href="/dashboard/leads"
                aria-label="Otvoriť leady z chatu"
                className="absolute inset-0"
              />
            </motion.div>
          </motion.section>

          {/* Druhý rad – Test bota + Asistent */}
          <motion.section
            className="grid gap-4 md:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
          >
            {/* Test môjho bota */}
            <motion.div
              className="relative rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col justify-between gap-3 transition-shadow duration-200 hover:shadow-xl hover:shadow-black/60 hover:border-emerald-500/50 cursor-pointer"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={cardSpring(0.18)}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div>
                <h2 className="text-sm md:text-base font-semibold mb-1">
                  Test môjho bota
                </h2>
                <p className="text-xs text-slate-400">
                  Otvor samostatnú stránku, kde si môžeš skúšať svojho bota so
                  všetkými nastaveniami a FAQ z tvojho účtu.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span>Otvoriť test bota</span>
                <span>→</span>
              </div>
              <Link
                href="/dashboard/my-bot"
                aria-label="Otvoriť test bota"
                className="absolute inset-0"
              />
            </motion.div>

            {/* Asistent pri nastavovaní bota (globálny helper) */}
            <motion.div
              className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col gap-3 md:col-span-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={cardSpring(0.22)}
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <div>
                  <h2 className="text-sm md:text-base font-semibold">
                    Asistent pri nastavovaní bota
                  </h2>
                  <p className="text-xs text-slate-400">
                    Tento AI asistent ti pomôže pochopiť, ako fungujú nastavenia,
                    FAQ, embed kód a celá platforma. Môžeš sa ho pýtať na
                    používanie AI Social Agent.
                  </p>
                </div>
              </div>

              <div className="max-w-md">
                <ChatWidget />
              </div>
            </motion.div>
          </motion.section>

          {/* Embed kód */}
          <motion.section
            className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={cardSpring(0.24)}
          >
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
              Tento kód vlož na web svojho klienta tesne pred ukončovaciu značku{" "}
              <code>&lt;/body&gt;</code>. Widget načíta AI chatbota podľa{" "}
              <code>data-bot-id</code> (ID tvojho účtu).
            </p>
          </motion.section>
        </div>
      </main>
    </AnimatedPage>
  );
}