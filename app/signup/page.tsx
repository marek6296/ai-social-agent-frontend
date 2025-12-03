export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Vytvoriť účet</h1>

        <form className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Názov firmy / značky</label>
            <input
              type="text"
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="Moja značka"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="ty@firma.sk"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Heslo</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2 rounded-md"
          >
            Vytvoriť účet
          </button>
        </form>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Už máš účet?{" "}
          <a href="/login" className="text-emerald-400 hover:underline">
            Prihlásiť sa
          </a>
        </p>
      </div>
    </main>
  );
}