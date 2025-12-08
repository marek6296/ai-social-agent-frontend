"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // základna validácia – všetky polia povinné
    if (!firstName || !lastName || !email || !password) {
      setError("Vyplň prosím všetky polia.");
      return;
    }

    // jednoduchá validácia formátu emailu
    const emailPattern = /^\S+@\S+\.\S+$/;
    if (!emailPattern.test(email)) {
      setError("Zadaj prosím platný email.");
      return;
    }

    // heslo – minimálna dĺžka
    if (password.length < 8) {
      setError("Heslo musí mať aspoň 8 znakov.");
      return;
    }

    setLoading(true);

    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/login` // po potvrdení emailu pôjde na /login
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already") && (msg.includes("registered") || msg.includes("exists"))) {
          setError("Tento email už je zaregistrovaný. Skús sa prihlásiť.");
        } else {
          setError("Registráciu sa nepodarilo dokončiť: " + error.message);
        }
        return;
      }

      // ak Supabase nevytvoril session (napr. treba potvrdiť email alebo účet už existuje)
      if (!data.session) {
        setError(
          "Registrácia nebola dokončená. Skontroluj prosím svoj email (potvrdenie) alebo skús sa prihlásiť, ak už účet existuje."
        );
        return;
      }

      // úspešná registrácia so session
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Nastala neznáma chyba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <motion.div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-2xl font-bold mb-6 text-center">Vytvoriť účet</h1>

          <form onSubmit={handleSignup} className="space-y-4">

            <div>
              <label className="block text-sm mb-1">Meno</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="Tvoje meno"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Priezvisko</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="Tvoje priezvisko"
                required
              />
            </div>

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
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-semibold py-2 rounded-md"
            >
              {loading ? "Vytváram účet..." : "Vytvoriť účet"}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-4 text-center">
            Už máš účet?{" "}
            <a href="/login" className="text-emerald-400 hover:underline">
              Prihlásiť sa
            </a>
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}