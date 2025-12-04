"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);

    alert("Klikol si na Prihlásiť sa");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Supabase error: " + error.message);
        setError(error.message);
      } else {
        alert("Prihlásenie OK, idem na dashboard");
        router.push("/dashboard");
      }
    } catch (err: any) {
      alert("Chyba v kóde: " + (err.message ?? "neznáma chyba"));
      setError(err.message ?? "Nastala neznáma chyba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Prihlásiť sa</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="ty@firma.sk"
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
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-semibold py-2 rounded-md"
          >
            {loading ? "Prihlasujem..." : "Prihlásiť sa"}
          </button>
        </div>

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