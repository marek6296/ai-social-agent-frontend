"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Users, Mail, MessageSquare, Calendar } from "lucide-react";
import Link from "next/link";

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

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        router.push("/login");
        return;
      }

      const userId = userData.user.id;

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

  const handleExport = () => {
    const headers = ["Dátum", "Meno", "Email", "Poznámka"];
    const rows = leads.map((lead) => [
      lead.created_at
        ? new Date(lead.created_at).toLocaleString("sk-SK", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "",
      lead.name || "",
      lead.email,
      `"${(lead.note || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leady-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" style={{ animation: 'spin 1s linear infinite' }} />
            <p className="text-sm text-muted-foreground">Načítavam kontakty…</p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <motion.header
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <Badge variant="secondary" className="mb-2 gap-1.5">
                <Users className="h-3 w-3" />
                Kontakty z chatu
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Leady / Zanechané kontakty
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Tu vidíš všetky kontakty, ktoré návštevníci zanechali cez formulár v chate tvojho AI chatbota.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {leads.length > 0 && (
                <Button variant="outline" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/dashboard" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Späť
                </Link>
              </Button>
            </div>
          </motion.header>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-primary" />
                      Kontakty ({leads.length})
                    </CardTitle>
                    <CardDescription>
                      {leads.length === 0
                        ? "Zatiaľ nemáš žiadne leady. Zapni si vo Nastaveniach chatbota možnosť Zobrazovať formulár na zber kontaktov v chate."
                        : "Všetky kontakty zanechané cez chat formulár."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Zatiaľ nemáš žiadne leady.</p>
                    <p className="text-sm mt-2">
                      Zapni si vo{" "}
                      <Link href="/dashboard/bot-settings" className="text-primary hover:underline font-medium">
                        Nastaveniach chatbota
                      </Link>{" "}
                      možnosť „Zobrazovať formulár na zber kontaktov v chate".
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {leads.map((lead, index) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card className="border-border/50 hover:border-primary/50 transition-all hover:shadow-md h-full">
                          <CardContent className="p-5">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Mail className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-sm">{lead.email}</p>
                                      {lead.name && (
                                        <p className="text-xs text-muted-foreground">{lead.name}</p>
                                      )}
                                    </div>
                                  </div>
                                  {lead.note && (
                                    <div className="pt-2 border-t border-border/50">
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-muted-foreground leading-relaxed">{lead.note}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs gap-1.5 whitespace-nowrap">
                                  <Calendar className="h-3 w-3" />
                                  {lead.created_at
                                    ? new Date(lead.created_at).toLocaleString("sk-SK", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      })
                                    : "—"}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
}
