const dummyPosts = [
  {
    id: 1,
    channel: "Instagram",
    status: "Naplánované",
    time: "Dnes 18:00",
    title: "Nový produkt – AI agent",
  },
  {
    id: 2,
    channel: "Facebook",
    status: "Publikované",
    time: "Dnes 10:15",
    title: "5 spôsobov, ako ušetriť čas s AI",
  },
  {
    id: 3,
    channel: "X (Twitter)",
    status: "Čaká na schválenie",
    time: "Zajtra 09:30",
    title: "Trendy v AI marketingu na rok 2025",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
        <div className="font-bold text-lg mb-6">AI Social Agent</div>

        <nav className="space-y-2 flex-1">
          <a href="/dashboard" className="block text-sm text-emerald-400">
            📊 Prehľad
          </a>
          <a
            href="/dashboard/posts"
            className="block text-sm text-slate-300 hover:text-white"
          >
            📝 Príspevky
          </a>
          <a
            href="/dashboard/sources"
            className="block text-sm text-slate-300 hover:text-white"
          >
            🔎 Zdroje & témy
          </a>
          <a
            href="/dashboard/settings"
            className="block text-sm text-slate-300 hover:text-white"
          >
            ⚙️ Nastavenia
          </a>
        </nav>

        <a href="/" className="text-xs text-slate-400">
          ← Späť na web
        </a>
      </aside>

      {/* Hlavný obsah */}
      <section className="flex-1 p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Prehľad účtu</h1>
            <p className="text-sm text-slate-400">
              Zhrnutie aktivít tvojho AI marketing agenta.
            </p>
          </div>

          <button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-md text-sm">
            + Vygenerovať nové posty
          </button>
        </header>

        {/* Stat boxy */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Posty tento týždeň</p>
            <p className="text-2xl font-bold">14</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Priemerné engagement</p>
            <p className="text-2xl font-bold">5.8%</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Pripojené profily</p>
            <p className="text-2xl font-bold">3</p>
          </div>
        </div>

        {/* Tabuľka postov */}
        <h2 className="font-semibold mb-3">Najbližšie naplánované posty</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-300 text-left">
              <tr>
                <th className="px-4 py-2">Kanál</th>
                <th className="px-4 py-2">Nadpis</th>
                <th className="px-4 py-2">Stav</th>
                <th className="px-4 py-2">Čas</th>
              </tr>
            </thead>
            <tbody>
              {dummyPosts.map((post) => (
                <tr key={post.id} className="border-t border-slate-800">
                  <td className="px-4 py-2">{post.channel}</td>
                  <td className="px-4 py-2">{post.title}</td>
                  <td className="px-4 py-2 text-emerald-400">{post.status}</td>
                  <td className="px-4 py-2 text-slate-300">{post.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}