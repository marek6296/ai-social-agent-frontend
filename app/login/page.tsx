export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Prihlásiť sa</h1>

        <form className="space-y-4">
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
            Prihlásiť sa
          </button>
        </form>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Nemáš účet?{" "}
          <a href="/signup" className="text-emerald-400 hover:underline">
            Vytvoriť účet
          </a>
        </p>
      </div>
    </main>
  );
}