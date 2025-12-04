export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-4 px-4">
          <div className="font-bold text-xl">AI Social Agent</div>
          <nav className="flex gap-3 items-center">
            <a href="#features" className="text-sm text-slate-300 hover:text-white">
              Funkcie
            </a>
            <a href="#pricing" className="text-sm text-slate-300 hover:text-white">
              Cenník
            </a>

            {/* Login link */}
            <a
              href="/login"
              className="text-sm text-slate-300 hover:text-white px-3 py-2 rounded-md"
            >
              Prihlásiť sa
            </a>

            {/* Signup tlačidlo */}
            <a
              href="/signup"
              className="text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-md"
            >
              Vytvoriť účet
            </a>
          </nav>
        </div>
      </header>

      <section className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Automatizovaný AI marketing agent pre sociálne siete
            </h1>
            <p className="text-slate-300 mb-6">
              Tvoj osobný AI asistent, ktorý vyhľadáva novinky, generuje posty a publikuje ich
              na Instagram, Facebook a X – úplne automaticky.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/signup"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-md"
              >
                Vyskúšať zdarma
              </a>
              <a
                href="#pricing"
                className="border border-slate-700 hover:border-slate-500 text-slate-200 px-6 py-3 rounded-md"
              >
                Pozrieť cenník
              </a>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-sm text-emerald-400 font-semibold mb-2">
              Ukážka workflowu
            </p>
            <ul className="space-y-3 text-sm text-slate-200">
              <li>🔎 AI vyhľadá najnovšie novinky v tvojej oblasti</li>
              <li>🧠 ChatGPT zhrnie obsah do krátkych bodov</li>
              <li>✍️ Vygeneruje príspevky pre IG, FB a X</li>
              <li>📅 Naplánuje publikáciu na vhodný čas</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-6">Cenník</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-slate-700 rounded-2xl p-6">
              <h3 className="font-semibold mb-2">Starter</h3>
              <p className="text-2xl font-bold mb-2">49 € / mesiac</p>
              <ul className="text-sm text-slate-300 space-y-1 mb-4">
                <li>• 1 značka</li>
                <li>• 3 sociálne siete</li>
                <li>• 30 postov mesačne</li>
              </ul>
              <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2 rounded-md">
                Vybrať plán
              </button>
            </div>

            <div className="border border-emerald-500 rounded-2xl p-6 bg-slate-950">
              <h3 className="font-semibold mb-2">Pro (odporúčané)</h3>
              <p className="text-2xl font-bold mb-2">99 € / mesiac</p>
              <ul className="text-sm text-slate-300 space-y-1 mb-4">
                <li>• 3 značky</li>
                <li>• 5 sociálnych sietí</li>
                <li>• 90 postov mesačne</li>
                <li>• Prioritná podpora</li>
              </ul>
              <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2 rounded-md">
                Vybrať plán
              </button>
            </div>

            <div className="border border-slate-700 rounded-2xl p-6">
              <h3 className="font-semibold mb-2">Agency</h3>
              <p className="text-2xl font-bold mb-2">199 € / mesiac</p>
              <ul className="text-sm text-slate-300 space-y-1 mb-4">
                <li>• 10 značiek</li>
                <li>• všetky sociálne siete</li>
                <li>• Neobmedzený počet postov</li>
              </ul>
              <button className="w-full border border-emerald-500 text-emerald-300 hover:bg-emerald-500 hover:text-black font-semibold py-2 rounded-md">
                Kontaktovať sales
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} AI Social Agent. Všetky práva vyhradené.
      </footer>
    </main>
  );
}