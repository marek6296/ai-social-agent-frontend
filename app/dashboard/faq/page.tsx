"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, MessageSquare, Download, Sparkles } from "lucide-react";
import Link from "next/link";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export default function FaqPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<FaqItem[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Musíš byť prihlásený, aby si videl FAQ.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("faq_items")
        .select("id, question, answer")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError("Nepodarilo sa načítať FAQ.");
      } else {
        setItems((data as FaqItem[]) ?? []);
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || !answer.trim()) {
      setError("Otázka aj odpoveď musia byť vyplnené.");
      return;
    }

    setSaving(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Musíš byť prihlásený.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("faq_items")
      .insert({
        user_id: user.id,
        question: question.trim(),
        answer: answer.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setError("Nepodarilo sa pridať FAQ.");
    } else {
      setItems((prev) => [data as FaqItem, ...prev]);
      setQuestion("");
      setAnswer("");
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Naozaj chceš odstrániť túto FAQ položku?");
    if (!confirmed) return;

    const { error } = await supabase.from("faq_items").delete().eq("id", id);

    if (error) {
      console.error(error);
      setError("Nepodarilo sa odstrániť FAQ.");
    } else {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleExport = () => {
    const csv = [
      ["Otázka", "Odpoveď"],
      ...items.map((item) => [item.question, item.answer]),
    ]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `faq-export-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Načítavam FAQ…</p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <motion.header
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <Badge variant="secondary" className="mb-2 gap-1.5">
                <MessageSquare className="h-3 w-3" />
                FAQ & firemné odpovede
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                FAQ &amp; firemné odpovede
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Tu si vieš pridať často kladené otázky a odpovede, ktoré bude AI používať pri odpovedaní návštevníkom.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {items.length > 0 && (
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

          {/* Add FAQ Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Pridať novú FAQ</CardTitle>
                    <CardDescription>
                      Pridaj otázku a odpoveď, ktoré bude tvoj bot používať pri komunikácii.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question" className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Otázka (čo sa klienti pýtajú)
                    </Label>
                    <Input
                      id="question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Napr. Ako funguje váš produkt?"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="answer" className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Odpoveď (čo má AI odpovedať)
                    </Label>
                    <Textarea
                      id="answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      rows={4}
                      placeholder="Stručná, jasná odpoveď v štýle tvojej značky."
                      className="bg-background resize-none"
                    />
                  </div>
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Ukladám…
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Pridať FAQ
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* FAQ List */}
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
                      <Sparkles className="h-5 w-5 text-primary" />
                      Tvoje FAQ
                    </CardTitle>
                    <CardDescription>
                      {items.length === 0
                        ? "Zatiaľ nemáš žiadne FAQ. Pridaj aspoň 3–5 najčastejších otázok a odpovedí."
                        : `Máš ${items.length} ${items.length === 1 ? "FAQ položku" : items.length < 5 ? "FAQ položky" : "FAQ položiek"}.`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Zatiaľ nemáš žiadne FAQ.</p>
                    <p className="text-sm mt-1">Pridaj aspoň 3–5 najčastejších otázok a odpovedí.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card className="border-border/50 hover:border-primary/50 transition-all hover:shadow-md group">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div>
                                <Badge variant="outline" className="mb-3 bg-primary/5 border-primary/20 text-primary">
                                  Otázka
                                </Badge>
                                <p className="font-semibold text-base leading-relaxed">{item.question}</p>
                              </div>
                              <div>
                                <Badge variant="outline" className="mb-3 bg-muted">
                                  Odpoveď
                                </Badge>
                                <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                              </div>
                              <div className="flex justify-end pt-2 border-t border-border/50">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Odstrániť
                                </Button>
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
