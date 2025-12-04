"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type UserProfile = {
  email: string | null;
  firstName?: string;
  lastName?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  // jednoduché nastavenia chatbota (zatiaľ len v state – neskôr to dáme do DB)
  const [botName, setBotName] = useState("AI asistent");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Ahoj! Som AI chatbot tvojej firmy. Ako ti môžem pomôcť?"
  );
  const [primaryColor, setPrimaryColor] = useState("#22c55e");
  const [companyName, setCompanyName] = useState("Moja firma");
  const [widgetPosition, setWidgetPosition] = useState<"right" | "left">("right");

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

  const embedCode = `<script>
  window.aiChatbotConfig = {
    botName: "${botName}",
    companyName: "${companyName}",
    welcomeMessage: "${welcomeMessage.replace(/"/g, '\\"')}",
    primaryColor: "${primaryColor}",
    position: "${widgetPosition}"
  };
  // TODO: sem neskôr pridáme načítanie skutočného chat widgetu z tvojho servera
  console.log("AI chatbot init", window.aiChatbotConfig);
</script>`;

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
                Tu nastavíš svoj firemný AI chatbot a získaš embed kód na web.
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

        {/* Horné 2 stĺpce: nastavenia + ukážka widgetu */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Nastavenia chatbota */}
          <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div>
                <h2 className="text-sm md:text-base font-semibold">
                  Nastavenia AI chatbota
                </h2>
                <p className="text-xs text-slate-400">
                  Zadaj základné informácie, podľa ktorých sa bude chatbot správať.
                </p>
              </div>
              <span className="text-[11px] text-slate-500 border border-slate-700 rounded-full px-3 py-1">
                Krok 1 z 2 – nastavenie bota
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">
                  Názov firmy / brandu
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  placeholder="Moja firma s.r.o."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">
                  Meno chatbota
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  placeholder="AI asistent"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs text-slate-300">
                  Úvodná správa (pozdrav)
                </label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500 min-h-[70px]"
                  placeholder="Ahoj! Som AI chatbot tvojej firmy. Ako ti môžem pomôcť?"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">
                  Primárna farba widgetu
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 w-10 rounded-md bg-transparent border border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">
                  Pozícia widgetu
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setWidgetPosition("left")}
                    className={`flex-1 rounded-md border px-3 py-2 ${
                      widgetPosition === "left"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-700 bg-slate-900 text-slate-200"
                    }`}
                  >
                    Dolný ľavý roh
                  </button>
                  <button
                    type="button"
                    onClick={() => setWidgetPosition("right")}
                    className={`flex-1 rounded-md border px-3 py-2 ${
                      widgetPosition === "right"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-700 bg-slate-900 text-slate-200"
                    }`}
                  >
                    Dolný pravý roh
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              Neskôr tieto nastavenia uložíme do databázy a chatbot bude odpovedať podľa
              firemných dokumentov, FAQ a obsahu webu.
            </p>
          </div>

          {/* Ukážka, ako bude widget vyzerať na webe */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg shadow-black/40 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold mb-2">Náhľad chat widgetu</h3>
              <p className="text-xs text-slate-400 mb-4">
                Takto približne bude chatbot vyzerať na stránke tvojho webu.
              </p>
            </div>

            <div className="relative mt-2 h-64 rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden flex items-end justify-end p-4">
              {/* falošná stránka */}
              <div className="absolute inset-4 rounded-lg border border-slate-800/60 bg-slate-950/80" />
              {/* widget bublina */}
              <div
                className={`relative z-10 w-64 rounded-2xl shadow-lg ${
                  widgetPosition === "right" ? "ml-auto" : "mr-auto"
                }`}
              >
                <div
                  className="rounded-t-2xl px-3 py-2 text-xs font-semibold flex items-center justify-between"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>{botName}</span>
                  <span className="text-[10px] bg-black/20 rounded-full px-2 py-0.5">
                    Online
                  </span>
                </div>
                <div className="bg-slate-950/95 border-x border-b border-slate-800/80 rounded-b-2xl px-3 py-3 text-[11px] text-slate-200 space-y-2">
                  <p className="bg-slate-900/80 rounded-2xl px-3 py-2">
                    {welcomeMessage}
                  </p>
                  <p className="text-slate-500 text-[10px]">
                    Chatbot je trénovaný na obsahu: {companyName || "tvoja firma"}.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-3">
              V ďalšom kroku pridáme možnosť vložiť vlastné FAQ, dokumenty a prepojenie s
              OpenAI, aby chatbot odpovedal ako tvoja firma.
            </p>
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
                Skopíruj tento kód a vlož ho pred koniec &lt;/body&gt; tagu na svojom
                webe.
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
              className="w-full rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-200 p-3 resize-none min-h-[140px]"
              value={embedCode}
            />
            <div className="pointer-events-none absolute inset-0 rounded-lg border border-slate-800/40" />
          </div>

          <p className="text-[11px] text-slate-500">
            Zatiaľ je to len ukážkový konfig kód. Neskôr sem doplníme skutočný script,
            ktorý načíta tvojho AI chatbota z backendu.
          </p>
        </section>
      </div>
    </main>
  );
}