"use client";

import { useEffect, type MouseEvent } from "react";
import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";

export default function Home() {
  // vždy po načítaní začni hore
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const handleScrollToPricing = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const section = document.getElementById("pricing");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <AnimatedPage>
      <main className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white relative overflow-hidden">
        {/* Dekoratívne pozadie */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-32 top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute inset-x-0 top-40 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-40" />
        </div>

        {/* HEADER */}
        <header className="sticky top-0 z-20 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4 md:px-6">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <div className="relative h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-sm font-bold overflow-hidden">
                <span className="absolute inset-0 bg-emerald-500/10 blur-xl" />
                <span className="relative">AI</span>
              </div>
              <span className="font-semibold text-lg md:text-xl tracking-tight">
                AI Social Agent
              </span>
            </motion.div>

            <motion.nav
              className="flex items-center gap-3 md:gap-4 text-sm"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
            >
              <a
                href="#features"
                className="hidden sm:inline text-slate-300 hover:text-white transition-colors"
              >
                Funkcie
              </a>
              <a
                href="#pricing"
                onClick={handleScrollToPricing}
                className="hidden sm:inline text-slate-300 hover:text-white transition-colors"
              >
                Cenník
              </a>
              <a
                href="/login"
                className="px-3 py-2 rounded-md text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                Prihlásiť sa
              </a>
              <a
                href="/signup"
                className="px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-md shadow-emerald-500/30 transition-transform transition-colors hover:-translate-y-[1px]"
              >
                Vytvoriť účet
              </a>
            </motion.nav>
          </div>
        </header>

        {/* HERO – AI CHATBOT PRE FIRMY */}
        <section id="features" className="flex-1 relative">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16 grid md:grid-cols-2 gap-10 items-center">
            {/* Ľavý stĺpec */}
            <motion.div
              className="space-y-5"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.p
                className="inline-flex items-center gap-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 w-fit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                AI chatbot pre firmy – embed na web
              </motion.p>
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              >
                Premení tvoju webstránku
                <span className="block text-emerald-400">
                  na nonstop AI asistenta
                </span>
              </motion.h1>
              <motion.p
                className="text-slate-300 text-sm md:text-base max-w-xl"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
              >
                AI Social Agent je firemný AI chatbot, ktorý vie odpovedať na otázky
                zákazníkov, zbiera leady a pomáha s podporou – priamo na tvojom webe.
                Stačí vložiť krátky embed kód a chatbot beží 24/7.
              </motion.p>
              <motion.div
                className="flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              >
                <a
                  href="/signup"
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-md shadow-md shadow-emerald-500/30 text-sm md:text-base transition-transform hover:-translate-y-[1px]"
                >
                  Vytvoriť chatbota
                </a>
                <a
                  href="#pricing"
                  onClick={handleScrollToPricing}
                  className="border border-slate-700 hover:border-slate-500 text-slate-200 px-6 py-3 rounded-md text-sm md:text-base transition-colors"
                >
                  Pozrieť cenník
                </a>
              </motion.div>
              <motion.div
                className="flex flex-wrap gap-4 text-xs text-slate-400 pt-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Odpovede v reálnom čase, 24/7
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Jednoduchý embed na každý web
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Tréning na FAQ, článkoch a dokumentoch
                </div>
              </motion.div>
            </motion.div>

            {/* Pravý stĺpec – náhľad chatbota */}
            <motion.div
              className="relative bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-7 shadow-xl shadow-black/40 overflow-hidden"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/8 via-transparent to-cyan-500/10 pointer-events-none" />

              <div className="relative flex flex-col gap-4 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-emerald-400 font-semibold">
                    Ukážka AI chatbota
                  </p>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400 border border-slate-700 rounded-full px-2 py-0.5">
                    Live náhľad
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col gap-2 min-h-[190px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-7 w-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px] font-semibold text-emerald-300">
                      AI
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold">AI asistent</p>
                      <p className="text-slate-500">Nonstop online</p>
                    </div>
                  </div>

                  {/* Chat bubliny */}
                  <div className="space-y-2 text-[11px]">
                    <div className="max-w-[85%] rounded-2xl bg-slate-900 px-3 py-2 shadow-sm">
                      <p>Dobrý deň, zaujíma ma, ako funguje váš produkt.</p>
                    </div>
                    <motion.div
                      className="max-w-[85%] rounded-2xl bg-emerald-500/10 border border-emerald-500/40 px-3 py-2 ml-auto shadow-sm"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, ease: "easeOut", delay: 0.2 }}
                    >
                      <p>
                        Ahoj! Som AI chatbot tvojej firmy. Viem ti vysvetliť, čo robíme,
                        odporučiť vhodný plán a prepojiť ťa na podporu, ak bude treba.
                      </p>
                    </motion.div>
                    <div className="max-w-[75%] rounded-2xl bg-slate-900 px-3 py-2 shadow-sm">
                      <p>A vieš mi rovno odporučiť, ktorý plán je pre mňa?</p>
                    </div>
                    <motion.div
                      className="max-w-[90%] rounded-2xl bg-emerald-500/10 border border-emerald-500/40 px-3 py-2 ml-auto shadow-sm"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, ease: "easeOut", delay: 0.28 }}
                    >
                      <p>
                        Jasné! Na základe počtu návštevníkov a počtu otázok zvyčajne
                        odporúčame plán <span className="font-semibold">Pro</span>.
                        Môžeš však začať so Starter a neskôr prejsť vyššie.
                      </p>
                    </motion.div>
                  </div>
                </div>

                {/* Plávajúce tlačidlo widgetu v rohu */}
                <div className="relative h-16">
                  <motion.div
                    className="absolute bottom-0 right-0 flex items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut", delay: 0.3 }}
                  >
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      Takto sa zobrazí widget na tvojom webe
                    </span>
                    <button
                      type="button"
                      className="relative h-11 px-4 rounded-full flex items-center gap-2 text-xs font-semibold shadow-lg shadow-emerald-500/40"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(34,197,94,1), rgba(6,182,212,1))",
                      }}
                    >
                      <span className="inline-flex h-6 w-6 rounded-full bg-black/20 items-center justify-center text-[13px]">
                        💬
                      </span>
                      <span>Opýtať sa chatbota</span>
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-300 animate-ping" />
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* PRICING – PLÁNY PRE CHATBOTOV */}
        <section
          id="pricing"
          className="bg-slate-950/80 border-t border-slate-800/80"
        >
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-16">
            <motion.div
              className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div>
                <h2 className="text-3xl font-bold mb-2">Cenník</h2>
                <p className="text-slate-300 text-sm md:text-base max-w-xl">
                  Vyber si plán, ktorý sedí tvojej firme. Všetky plány obsahujú AI
                  chatbota, embed kód na web a základné štatistiky konverzácií.
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Bez viazanosti, možnosť mesačného alebo ročného fakturovania.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Starter */}
              <motion.div
                className="border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between bg-slate-900/70 shadow-lg shadow-black/40 transition-transform transition-shadow duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60 hover:border-emerald-500/60"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
              >
                <div>
                  <h3 className="font-semibold mb-1">Starter</h3>
                  <p className="text-2xl font-bold mb-1">39 € / mesiac</p>
                  <p className="text-xs text-slate-400 mb-4">
                    Ideálne pre malé firmy a jednoduché FAQ.
                  </p>
                  <ul className="text-sm text-slate-300 space-y-1 mb-4">
                    <li>• 1 web + 1 chatbot</li>
                    <li>• Základný embed widget</li>
                    <li>• Do 1 000 konverzácií mesačne</li>
                  </ul>
                </div>
                <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-2 rounded-md text-sm transition-colors">
                  Vybrať plán
                </button>
              </motion.div>

              {/* Pro */}
              <motion.div
                className="border border-emerald-500 rounded-2xl p-6 bg-slate-950 flex flex-col justify-between shadow-lg shadow-emerald-500/25 scale-[1.02] transition-transform transition-shadow duration-200 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/40"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
              >
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-2">
                    Najobľúbenejší
                  </p>
                  <h3 className="font-semibold mb-1">Pro (odporúčané)</h3>
                  <p className="text-2xl font-bold mb-1">89 € / mesiac</p>
                  <p className="text-xs text-slate-400 mb-4">
                    Pre firmy, ktoré chcú AI asistenta ako plnohodnotnú podporu.
                  </p>
                  <ul className="text-sm text-slate-300 space-y-1 mb-4">
                    <li>• 3 weby / projekty</li>
                    <li>• Pokročilé prispôsobenie widgetu</li>
                    <li>• Do 10 000 konverzácií mesačne</li>
                    <li>• Prioritná podpora</li>
                  </ul>
                </div>
                <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2 rounded-md text-sm transition-colors">
                  Vybrať plán
                </button>
              </motion.div>

              {/* Agency */}
              <motion.div
                className="border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between bg-slate-900/70 shadow-lg shadow-black/40 transition-transform transition-shadow duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60 hover:border-emerald-500/60"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
              >
                <div>
                  <h3 className="font-semibold mb-1">Agency</h3>
                  <p className="text-2xl font-bold mb-1">Na mieru</p>
                  <p className="text-xs text-slate-400 mb-4">
                    Pre agentúry a väčšie tímy s viacerými klientmi.
                  </p>
                  <ul className="text-sm text-slate-300 space-y-1 mb-4">
                    <li>• Neobmedzený počet chatbotov</li>
                    <li>• White-label možnosť</li>
                    <li>• Individuálne limity konverzácií</li>
                  </ul>
                </div>
                <button className="w-full border border-emerald-500 text-emerald-300 hover:bg-emerald-500 hover:text-black font-semibold py-2 rounded-md text-sm transition-colors">
                  Kontaktovať sales
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 bg-slate-950/90">
          © {new Date().getFullYear()} AI Social Agent. Všetky práva vyhradené.
        </footer>
      </main>
    </AnimatedPage>
  );
}