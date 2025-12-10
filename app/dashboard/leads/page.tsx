"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Users, Mail, MessageSquare, Calendar, Search, Filter } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTarget, setSearchTarget] = useState<"all" | "email" | "name" | "note">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [useDateFilter, setUseDateFilter] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

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
          console.error("Leads API error:", {
            status: res.status,
            statusText: res.statusText,
            data,
            userId,
          });
          setError(`Nepodarilo sa načítať kontakty z chatu. ${data.error || ""} ${data.details ? `(${data.details})` : ""}`);
        } else {
          const data = (await res.json()) as { leads?: Lead[] };
          console.log("Leads loaded:", data.leads?.length || 0, "for userId:", userId);
          setLeads(data.leads ?? []);
        }
      } catch (err) {
        console.error("Chyba pri volaní /api/dashboard/leads:", err);
        setError(`Nastala chyba pri načítaní kontaktov: ${err instanceof Error ? err.message : String(err)}`);
      }

      setLoading(false);
    };

    loadLeads();
  }, [router]);

  // Filtered leads
  const filteredLeads = (() => {
    const base = sortOrder === "desc" ? leads : [...leads].reverse();

    return base.filter((lead) => {
      // Text search
      let sourceText = "";
      if (searchTarget === "all") {
        sourceText = `${lead.email} ${lead.name || ""} ${lead.note || ""}`.toLowerCase();
      } else if (searchTarget === "email") {
        sourceText = lead.email.toLowerCase();
      } else if (searchTarget === "name") {
        sourceText = (lead.name || "").toLowerCase();
      } else {
        sourceText = (lead.note || "").toLowerCase();
      }

      const term = searchTerm.toLowerCase();
      const textMatch = term ? sourceText.includes(term) : true;

      // Date filter
      if (!useDateFilter) {
        return textMatch;
      }

      if (!lead.created_at) {
        return textMatch && false; // If no date and filter is on, exclude
      }

      const created = new Date(lead.created_at).getTime();
      const fromOk = dateFrom
        ? created >= new Date(dateFrom + "T00:00:00").getTime()
        : true;
      const toOk = dateTo
        ? created <= new Date(dateTo + "T23:59:59").getTime()
        : true;

      return textMatch && fromOk && toOk;
    });
  })();

  const handleExport = () => {
    const headers = ["Dátum", "Meno", "Email", "Poznámka"];
    const rows = filteredLeads.map((lead) => [
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

          {/* Filters */}
          {leads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Filter className="h-4 w-4 text-primary" />
                    </div>
                    Filtre a vyhľadávanie
                  </CardTitle>
                  <CardDescription>
                    Filtruj a vyhľadávaj v kontaktoch podľa emailu, mena, poznámky alebo dátumu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Vyhľadávanie</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="napr. email, meno, poznámka..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 h-[52px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Kde vyhľadávať</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {(["all", "email", "name", "note"] as const).map((target) => (
                          <button
                            key={target}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSearchTarget(target);
                            }}
                            className={`relative p-3 rounded-xl border-2 text-center transition-all cursor-pointer overflow-hidden h-[52px] ${
                              searchTarget === target
                                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                                : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                            }`}
                          >
                            {searchTarget === target && (
                              <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-primary" />
                            )}
                            {searchTarget === target && (
                              <div className="absolute top-1 right-1 text-white text-[10px] font-bold z-10">
                                ✓
                              </div>
                            )}
                            <div className="font-semibold text-xs">
                              {target === "all" ? "Všetko" : target === "email" ? "Email" : target === "name" ? "Meno" : "Poznámka"}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Filtrovať podľa dátumu</Label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setUseDateFilter(!useDateFilter);
                          if (!useDateFilter) {
                            // Ak zapíname filter, ponecháme dátumy
                          } else {
                            // Ak vypíname filter, vymažeme dátumy
                            setDateFrom("");
                            setDateTo("");
                          }
                        }}
                        className={`relative w-full p-3 rounded-xl border-2 text-center transition-all cursor-pointer overflow-hidden h-[52px] ${
                          useDateFilter
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                            : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                        }`}
                      >
                        {useDateFilter && (
                          <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-primary" />
                        )}
                        {useDateFilter && (
                          <div className="absolute top-1 right-1 text-white text-[10px] font-bold z-10">
                            ✓
                          </div>
                        )}
                        <div className="font-semibold text-sm">
                          {useDateFilter ? "Zapnuté" : "Vypnuté"}
                        </div>
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Label>Dátum od</Label>
                      </div>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                          setDateFrom(e.target.value);
                          if (e.target.value) {
                            setUseDateFilter(true);
                          }
                        }}
                        disabled={!useDateFilter}
                        className="h-[52px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dátum do</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                          setDateTo(e.target.value);
                          if (e.target.value) {
                            setUseDateFilter(true);
                          }
                        }}
                        disabled={!useDateFilter}
                        className="h-[52px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Zoradenie</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["desc", "asc"] as const).map((order) => (
                          <button
                            key={order}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSortOrder(order);
                            }}
                            className={`relative p-3 rounded-xl border-2 text-center transition-all cursor-pointer overflow-hidden h-[52px] ${
                              sortOrder === order
                                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                                : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                            }`}
                          >
                            {sortOrder === order && (
                              <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-primary" />
                            )}
                            {sortOrder === order && (
                              <div className="absolute top-1 right-1 text-white text-[10px] font-bold z-10">
                                ✓
                              </div>
                            )}
                            <div className="font-semibold text-sm">
                              {order === "desc" ? "Najnovšie" : "Najstaršie"}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-primary" />
                      Kontakty ({filteredLeads.length} / {leads.length})
                    </CardTitle>
                    <CardDescription>
                      {leads.length === 0
                        ? "Zatiaľ nemáš žiadne leady. Zapni si vo Nastaveniach chatbota možnosť Zobrazovať formulár na zber kontaktov v chate."
                        : filteredLeads.length !== leads.length
                        ? `Zobrazené ${filteredLeads.length} z ${leads.length} kontaktov.`
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
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Žiadne kontakty nezodpovedajú filtrom.</p>
                    <p className="text-sm mt-2">
                      Skús zmeniť kritériá vyhľadávania alebo filtrov.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredLeads.map((lead, index) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card className="border-border/50 hover:border-primary/50 transition-all hover:shadow-md h-full flex flex-col">
                          <CardContent className="p-6 flex flex-col flex-1">
                            {/* Email a meno - symetrické */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Mail className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-base mb-1 truncate">{lead.email}</p>
                                {lead.name && (
                                  <p className="text-sm text-muted-foreground truncate">{lead.name}</p>
                                )}
                              </div>
                            </div>

                            {/* Dátum - symetrické */}
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <p className="text-xs text-muted-foreground">
                                {lead.created_at
                                  ? new Date(lead.created_at).toLocaleString("sk-SK", {
                                      dateStyle: "long",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </p>
                            </div>
                              
                            {/* Poznámka - symetrické */}
                            {lead.note ? (
                              <div className="flex items-start gap-3 flex-1">
                                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-muted-foreground leading-relaxed flex-1 break-words">{lead.note}</p>
                              </div>
                            ) : (
                              <div className="flex-1" />
                            )}
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
