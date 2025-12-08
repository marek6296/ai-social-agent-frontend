"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Vyplň prosím email aj heslo.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setTimeout(() => {
          setLoading(false);
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message ?? "Nastala neznáma chyba");
    }
  }

  return (
    <AnimatedPage>
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-white px-4">
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 rounded-2xl p-8 shadow-xl shadow-black/50 backdrop-blur-md">
          <div className="mb-6 text-center">
            <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-400/80 mb-1">
              AI Social Agent
            </p>
            <h1 className="text-2xl font-bold">Prihlásiť sa</h1>
            <p className="text-xs text-slate-400 mt-2">
              Prihlás sa do svojho účtu a spravuj svoj firemný AI chatbot.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="ty@firma.sk"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Heslo</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-semibold py-2 rounded-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-black/40 border-t-black animate-spin rounded-full"></span>
                  Prihlasujem...
                </>
              ) : (
                "Prihlásiť sa"
              )}
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
    </AnimatedPage>
  );
}