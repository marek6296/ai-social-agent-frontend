"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";

type Lead = {
  id: string;
  owner_user_id: string | null;
  name: string | null;
  email: string;
  note: string | null;
  created_at: string | null;
};

export default function LeadsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeads = async () => {
      setError(null);
      setLoading(true);

      // 1) Zisti prihláseného usera
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        router.push("/login");
        return;
      }

      const userId = userData.user.id;

      // 2) Načítaj leady cez API (server používa service role, obíde RLS)
      try {
        const res = await fetch(
          `/api/dashboard/leads?ownerUserId=${encodeURIComponent(userId)}`
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error("Leads API error:", data);
          setError("Nepodarilo sa načítať kontakty z chatu.");
        } else {
          const data = (await res.json()) as { leads?: Lead[] };
          setLeads(data.leads ?? []);
        }
      } catch (err) {
        console.error("Chyba pri volaní /api/dashboard/leads:", err);
        setError("Nastala chyba pri načítaní kontaktov.");
      }

      setLoading(false);
    };

    loadLeads();
  }, [router]);

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 flex flex-col gap-6">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <p className="text-xs text-emerald-300 mb-1">Kontakty z chatu</p>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                Leady / Zanechané kontakty
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Tu vidíš všetky kontakty, ktoré návštevníci zanechali cez formulár
                v chate tvojho AI chatbota.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="self-start md:self-auto px-3 py-1.5 rounded-full border border-slate-700 text-xs text-slate-200 hover:border-slate-500 hover:bg-slate-900/60 transition-colors"
            >
              ← Späť na dashboard
            </button>
          </header>

          {/* Obsah */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:p-5 shadow-lg shadow-black/40">
            {loading ? (
              <p className="text-sm text-slate-400">Načítavam kontakty…</p>
            ) : error ? (
              <p className="text-sm text-red-400">{error}</p>
            ) : leads.length === 0 ? (
              <div className="text-sm text-slate-400">
                Zatiaľ nemáš žiadne leady.
                <br />
                Zapni si vo{" "}
                <span className="text-emerald-400">
                  &bdquo;Nastaveniach chatbota&ldquo; možnosť &bdquo;Zobrazovať formulár
                  na zber kontaktov v chate&ldquo; a keď niekto odošle kontaktný formulár,
                  uvidíš ho tu.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Počet kontaktov:{" "}
                  <span className="text-emerald-300 font-medium">
                    {leads.length}
                  </span>
                </p>

                <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/80">
                  <table className="min-w-full text-xs md:text-sm border-collapse">
                    <thead className="bg-slate-900/80 border-b border-slate-800">
                      <tr className="text-left text-slate-400">
                        <th className="px-3 py-2 font-medium">Meno</th>
                        <th className="px-3 py-2 font-medium">Email</th>
                        <th className="px-3 py-2 font-medium hidden md:table-cell">
                          Poznámka
                        </th>
                        <th className="px-3 py-2 font-medium whitespace-nowrap">
                          Dátum
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-t border-slate-800/70 hover:bg-slate-900/70 transition-colors"
                        >
                          <td className="px-3 py-2 align-top text-slate-100">
                            {lead.name || "—"}
                          </td>
                          <td className="px-3 py-2 align-top text-emerald-300">
                            {lead.email}
                          </td>
                          <td className="px-3 py-2 align-top text-slate-300 hidden md:table-cell">
                            {lead.note || <span className="text-slate-500">—</span>}
                          </td>
                          <td className="px-3 py-2 align-top text-slate-400 whitespace-nowrap">
                            {lead.created_at
                              ? new Date(lead.created_at).toLocaleString("sk-SK", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </AnimatedPage>
  );
}