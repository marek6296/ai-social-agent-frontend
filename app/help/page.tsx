"use client";

import { AnimatedPage } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import Link from "next/link";

export default function HelpPage() {
  const sections = [
    {
      title: "Začíname",
      items: [
        {
          q: "Ako začať s AI chatbotom?",
          a: "Po registrácii sa prihlás do dashboardu. Najprv nastav základné informácie o svojej firme v sekcii 'Nastavenia chatbota', potom pridaj FAQ otázky a odpovede. Nakoniec skopíruj embed kód a vlož ho na svoju webstránku.",
        },
        {
          q: "Ako vložiť chatbot na moju stránku?",
          a: "V dashboarde nájdeš sekciu 'Embed kód na vloženie na web'. Skopíruj kód a vlož ho tesne pred ukončovaciu značku </body> na svojej HTML stránke. Widget sa automaticky načíta a zobrazí.",
        },
        {
          q: "Ako otestovať môjho chatbota?",
          a: "Použi sekciu 'Test môjho bota' v dashboarde. Tam si môžeš vyskúšať, ako bude chatbot odpovedať tvojim zákazníkom s tvojimi nastaveniami a FAQ.",
        },
      ],
    },
    {
      title: "Nastavenia",
      items: [
        {
          q: "Čo je tón komunikácie?",
          a: "Tón komunikácie určuje, ako formálne alebo neformálne chatbot odpovedá. Môžeš si vybrať medzi 'Prívetivý' (ľudský, moderný), 'Formálny' (profesionálny) alebo 'Uvoľnený' (veľmi friendly, mierny slang).",
        },
        {
          q: "Ako funguje zber kontaktov (leady)?",
          a: "V nastaveniach chatbota môžeš zapnúť 'Zobrazovať formulár na zber kontaktov v chate'. Keď to zapneš, návštevníci budú môcť zanechať svoje meno, email a poznámku. Všetky kontakty uvidíš v sekcii 'Leady z chatu'.",
        },
        {
          q: "Môžem zmeniť pozíciu chat widgetu?",
          a: "Áno, v nastaveniach chatbota si môžeš vybrať, či sa widget zobrazí v ľavom alebo pravom dolnom rohu stránky.",
        },
        {
          q: "Môžem prispôsobiť vzhľad widgetu?",
          a: "Áno! V nastaveniach chatbota nájdeš sekciu 'Pokročilé prispôsobenie widgetu', kde môžeš zmeniť farby, pridať vlastné logo a nastaviť úvodnú správu.",
        },
      ],
    },
    {
      title: "FAQ a odpovede",
      items: [
        {
          q: "Ako fungujú FAQ?",
          a: "FAQ (často kladené otázky) sú otázky a odpovede, ktoré chatbot uprednostní pri odpovedaní. Pridaj najčastejšie otázky svojich zákazníkov do sekcie 'FAQ & firemné odpovede'. Chatbot ich použije ako hlavný zdroj pri odpovedaní.",
        },
        {
          q: "Koľko FAQ môžem pridať?",
          a: "Môžeš pridať neobmedzený počet FAQ. Odporúčame začať s 5-10 najčastejšími otázkami a postupne pridať ďalšie podľa toho, čo sa návštevníci pýtajú.",
        },
        {
          q: "Ako chatbot používa FAQ?",
          a: "Chatbot automaticky porovnáva otázky návštevníkov s tvojimi FAQ a ak nájde podobnosť, použije tvoju odpoveď. Ak niečo nevie, prizná to a navrhne ďalší krok (kontakt, email).",
        },
      ],
    },
    {
      title: "Analytics a konverzácie",
      items: [
        {
          q: "Čo vidím v Analytics?",
          a: "V Analytics vidíš štatistiky o používaní chatbota: celkový počet konverzácií, aktivitu za posledných 7/30 dní, rozloženie podľa dňa a hodiny, najčastejšie typy otázok a konverzný pomer na leady.",
        },
        {
          q: "Môžem exportovať konverzácie?",
          a: "Áno! V sekcii 'Konverzácie bota' nájdeš tlačidlá 'Export CSV' a 'Export JSON', ktoré ti umožnia stiahnuť všetky konverzácie (vrátane filtrov).",
        },
        {
          q: "Ako vidím, čo sa návštevníci pýtajú najčastejšie?",
          a: "V Analytics nájdeš sekciu 'Najčastejšie typy otázok', ktorá ti ukáže rozdelenie otázok podľa kategórií (Cena, Objednávky, Podpora, atď.). Toto ti pomôže pochopiť, na čo sa zákazníci najviac pýtajú.",
        },
      ],
    },
    {
      title: "Limity a plány",
      items: [
        {
          q: "Ako fungujú limity konverzácií?",
          a: "Každý plán má limit konverzácií za mesiac. V sekcii 'Použitie a limity' vidíš, koľko konverzácií máš tento mesiac a koľko ti ešte zostáva. Limity sa resetujú každý mesiac.",
        },
        {
          q: "Čo sa stane, keď dosiahnem limit?",
          a: "Ak dosiahneš limit, chatbot prestane odpovedať až do začiatku nového mesiaca alebo do upgrade-u na vyšší plán. Dostaneš upozornenie, keď sa blížiš k limitu (80% a viac).",
        },
        {
          q: "Ako zmeniť plán?",
          a: "Plány a fakturácia budú dostupné čoskoro. Zatiaľ môžeš používať službu v demo režime.",
        },
      ],
    },
    {
      title: "Technické",
      items: [
        {
          q: "Ako funguje API?",
          a: "V nastaveniach účtu môžeš vygenerovať API kľúč, ktorý ti umožní prístup k tvojim dátam cez API. API dokumentácia bude dostupná čoskoro.",
        },
        {
          q: "Môžem použiť chatbot na viacerých stránkach?",
          a: "Záleží na tvojom pláne. Starter plán umožňuje 1 web, Pro plán 3 weby, Agency plán neobmedzený počet. Každý web používa rovnaký embed kód, ale môžeš mať rôzne nastavenia pre rôzne projekty.",
        },
        {
          q: "Je chatbot bezpečný?",
          a: "Áno, všetky konverzácie sú šifrované a bezpečne uložené. Chatbot neukladá citlivé údaje ako kreditné karty alebo heslá.",
        },
      ],
    },
  ];

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white relative overflow-hidden">
        {/* Dekoratívne pozadie */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-32 top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <motion.header
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Pomoc a dokumentácia
            </h1>
            <p className="text-slate-400 text-sm md:text-base">
              Všetko, čo potrebuješ vedieť o používaní AI Social Agent
            </p>
          </motion.header>

          <div className="space-y-8">
            {sections.map((section, sectionIdx) => (
              <motion.section
                key={section.title}
                className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-lg shadow-black/40"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: sectionIdx * 0.1 }}
              >
                <h2 className="text-xl font-semibold mb-4 text-emerald-400">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="border-l-2 border-emerald-500/30 pl-4 py-2"
                    >
                      <h3 className="text-sm font-semibold text-slate-200 mb-1">
                        {item.q}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-sm text-slate-400 mb-4">
              Nenašiel si odpoveď? Kontaktuj nás:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors"
              >
                Späť do dashboardu
              </Link>
              <a
                href="mailto:support@ai-social-agent.sk"
                className="px-6 py-3 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
              >
                Kontaktovať podporu
              </a>
            </div>
          </motion.div>
        </div>
      </main>
    </AnimatedPage>
  );
}


