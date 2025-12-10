"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Search, Download, FileText, Filter, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";

type ChatLog = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  category: string | null;
};

function inferCategory(log: ChatLog): string {
  const q = (log.question || "").toLowerCase();

  if (
    q.includes("cena") ||
    q.includes("koľko stojí") ||
    q.includes("kolko stoji") ||
    q.includes("price") ||
    q.includes("eur") ||
    q.includes("€") ||
    q.includes("predplatné") ||
    q.includes("predplatne") ||
    q.includes("platba") ||
    q.includes("faktur")
  ) {
    return "Cena";
  }

  if (
    q.includes("objednávka") ||
    q.includes("objednavka") ||
    q.includes("objednať") ||
    q.includes("objednat") ||
    q.includes("kúpiť") ||
    q.includes("kupit") ||
    q.includes("order") ||
    q.includes("purchase") ||
    q.includes("zakúpiť") ||
    q.includes("zakupit")
  ) {
    return "Objednávky";
  }

  if (
    q.includes("podpora") ||
    q.includes("support") ||
    q.includes("kontakt") ||
    q.includes("pomoc") ||
    q.includes("help") ||
    q.includes("reklamácia") ||
    q.includes("reklamacia") ||
    q.includes("sťažnosť") ||
    q.includes("staznost")
  ) {
    return "Podpora";
  }

  if (
    q.includes("nefunguje") ||
    q.includes("chyba") ||
    q.includes("error") ||
    q.includes("bug") ||
    q.includes("nastavenie") ||
    q.includes("konfigurácia") ||
    q.includes("konfiguracia") ||
    q.includes("prihlásiť") ||
    q.includes("prihlasit") ||
    q.includes("login")
  ) {
    return "Technické";
  }

  if (
    q.includes("čo je") ||
    q.includes("co je") ||
    q.includes("ako funguje") ||
    q.includes("čo robí") ||
    q.includes("co robi") ||
    q.includes("ako to funguje") ||
    q.includes("funkcie") ||
    q.includes("features")
  ) {
    return "Produkt / služba";
  }

  if (log.category) return log.category;
  return "Iné";
}

const categories = ["Všetko", "Cena", "Objednávky", "Podpora", "Technické", "Produkt / služba", "Iné"];

const categoryColors: Record<string, string> = {
  Cena: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Objednávky: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Podpora: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Technické: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "Produkt / služba": "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  Iné: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export default function ConversationsPage() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchTarget, setSearchTarget] = useState<"both" | "question" | "answer">("both");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [useDateFilter, setUseDateFilter] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("Všetko");
  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Musíš byť prihlásený, aby si videl konverzácie.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("chat_logs")
        .select("id, question, answer, created_at, category")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError("Nepodarilo sa načítať konverzácie.");
      } else {
        const rows = (data as ChatLog[]) ?? [];
        setLogs(rows);
        if (rows.length > 0) {
          setSelectedLog(rows[0]);
        }
      }

      setLoading(false);
    };

    load();
  }, []);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("sk-SK", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredLogs = (() => {
    const base = sortOrder === "desc" ? logs : [...logs].reverse();

    return base.filter((log) => {
      let sourceText = "";
      if (searchTarget === "both") {
        sourceText = (log.question + " " + log.answer).toLowerCase();
      } else if (searchTarget === "question") {
        sourceText = log.question.toLowerCase();
      } else {
        sourceText = log.answer.toLowerCase();
      }

      const term = searchTerm.toLowerCase();
      const textMatch = term ? sourceText.includes(term) : true;

      const effectiveCategory = inferCategory(log);
      const categoryMatch =
        categoryFilter === "Všetko"
          ? true
          : effectiveCategory === categoryFilter;

      if (!useDateFilter) {
        return textMatch && categoryMatch;
      }

      const created = new Date(log.created_at).getTime();
      const fromOk = dateFrom
        ? created >= new Date(dateFrom + "T00:00:00").getTime()
        : true;
      const toOk = dateTo
        ? created <= new Date(dateTo + "T23:59:59").getTime()
        : true;

      return textMatch && categoryMatch && fromOk && toOk;
    });
  })();

  const handleExportCSV = () => {
    const headers = ["Dátum", "Kategória", "Otázka", "Odpoveď"];
    const rows = filteredLogs.map((log) => [
      formatDate(log.created_at),
      inferCategory(log),
      `"${log.question.replace(/"/g, '""')}"`,
      `"${log.answer.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `konverzacii-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(
      filteredLogs.map((log) => ({
        dátum: formatDate(log.created_at),
        kategória: inferCategory(log),
        otázka: log.question,
        odpoveď: log.answer,
      })),
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `konverzacii-${new Date().toISOString().split("T")[0]}.json`;
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
            <p className="text-sm text-muted-foreground">Načítavam konverzácie…</p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <motion.header
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <Badge variant="secondary" className="mb-2 gap-1.5">
                <FileText className="h-3 w-3" />
                Prehľad reálnych konverzácií
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Konverzácie tvojho AI bota
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Všetko, čo tvoj bot riešil s návštevníkmi. Ideálne na kontrolu kvality odpovedí, pochopenie najčastejších otázok a zlepšovanie FAQ a nastavení bota.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" size="default" asChild className="gap-2 px-4 py-2 font-semibold">
                <Link href="/dashboard" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Späť
                </Link>
              </Button>
            </div>
          </motion.header>

          {/* Actions */}
          {filteredLogs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="pb-2"
            >
              <div className="flex flex-wrap items-center gap-3 justify-start">
                <Button variant="outline" size="default" onClick={handleExportCSV} className="gap-2 px-4 py-2 font-semibold">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="outline" size="default" onClick={handleExportJSON} className="gap-2 px-4 py-2 font-semibold">
                  <Download className="h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </motion.div>
          )}

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
                  Filtruj a vyhľadávaj v konverzáciách podľa kategórie, dátumu alebo obsahu
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
                        placeholder="napr. cena, objednávka, problém..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-[52px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Kde vyhľadávať</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["both", "question", "answer"] as const).map((target) => (
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
                          <div className="font-semibold text-sm">
                            {target === "both" ? "Všetko" : target === "question" ? "Otázka" : "Odpoveď"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Kategória</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCategoryFilter(cat);
                        }}
                        className={`relative px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer overflow-hidden ${
                          categoryFilter === cat
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                            : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                        }`}
                      >
                        {categoryFilter === cat && (
                          <div className="absolute top-0 right-0 w-0 h-0 border-l-[16px] border-l-transparent border-t-[16px] border-t-primary" />
                        )}
                        {categoryFilter === cat && (
                          <div className="absolute top-0.5 right-0.5 text-white text-[9px] font-bold z-10">
                            ✓
                          </div>
                        )}
                        {cat}
                      </button>
                    ))}
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSortOrder("desc");
                        }}
                        className={`relative p-3 rounded-xl border-2 text-center transition-all cursor-pointer overflow-hidden h-[52px] ${
                          sortOrder === "desc"
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                            : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                        }`}
                      >
                        {sortOrder === "desc" && (
                          <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-primary" />
                        )}
                        {sortOrder === "desc" && (
                          <div className="absolute top-1 right-1 text-white text-[10px] font-bold z-10">
                            ✓
                          </div>
                        )}
                        <div className="font-semibold text-sm">Najnovšie</div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSortOrder("asc");
                        }}
                        className={`relative p-3 rounded-xl border-2 text-center transition-all cursor-pointer overflow-hidden h-[52px] ${
                          sortOrder === "asc"
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                            : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                        }`}
                      >
                        {sortOrder === "asc" && (
                          <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-primary" />
                        )}
                        {sortOrder === "asc" && (
                          <div className="absolute top-1 right-1 text-white text-[10px] font-bold z-10">
                            ✓
                          </div>
                        )}
                        <div className="font-semibold text-sm">Najstaršie</div>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* List */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Konverzácie ({filteredLogs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Žiadne konverzácie</p>
                      <p className="text-xs mt-1">Skús zmeniť filtre</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                      {filteredLogs.map((log, index) => {
                        const category = inferCategory(log);
                        const categoryColor = categoryColors[category] || categoryColors["Iné"];
                        return (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.02 }}
                          >
                            <Card
                              className={`cursor-pointer transition-all border-border/50 hover:border-primary/50 hover:shadow-md ${
                                selectedLog?.id === log.id
                                  ? "border-primary bg-primary/5 shadow-lg"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() => setSelectedLog(log)}
                            >
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <Badge variant="outline" className={`text-xs ${categoryColor}`}>
                                      {category}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {formatDate(log.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium line-clamp-2 leading-relaxed">
                                    {log.question}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Detail */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {selectedLog ? (
                <motion.div
                  key={selectedLog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Detail konverzácie
                          </CardTitle>
                          <CardDescription>{formatDate(selectedLog.created_at)}</CardDescription>
                        </div>
                        <Badge variant="outline" className={categoryColors[inferCategory(selectedLog)] || categoryColors["Iné"]}>
                          {inferCategory(selectedLog)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="mb-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          Otázka
                        </Label>
                        <Card className="bg-muted/30 border-border/50">
                          <CardContent className="p-4">
                            <p className="text-sm leading-relaxed">{selectedLog.question}</p>
                          </CardContent>
                        </Card>
                      </div>
                      <div>
                        <Label className="mb-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          Odpoveď
                        </Label>
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="p-4">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedLog.answer}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">Vyber konverzáciu zoznamu</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
