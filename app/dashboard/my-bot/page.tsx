"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { ChatWidget } from "@/components/ChatWidget";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bot, Sparkles, CheckCircle2, Zap, Lightbulb } from "lucide-react";
import Link from "next/link";

type UserProfile = {
  id: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
};

export default function MyBotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.push("/login");
        return;
      }

      const { id, email, user_metadata } = data.user;

      setUser({
        id,
        email: email ?? null,
        firstName: user_metadata?.firstName,
        lastName: user_metadata?.lastName,
      });

      setLoading(false);
    };

    loadUser();
  }, [router]);

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

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
            <p className="text-sm text-muted-foreground">Načítavam tvojho bota…</p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <motion.header
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <Badge variant="secondary" className="mb-2 gap-1.5">
                <Bot className="h-3 w-3" />
                Test tvojho AI chatbota
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {fullName || user.email} – tvoj firemný bot
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Na tejto stránke si vieš vyskúšať, ako bude tvoj AI chatbot odpovedať reálnym zákazníkom na tvojej webovej stránke – s tvojimi nastaveniami bota a firemnými FAQ.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Tento test vidíš len ty
              </Badge>
              <Button variant="outline" asChild>
                <Link href="/dashboard" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Späť
                </Link>
              </Button>
            </div>
          </motion.header>

          {/* Tips */}
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex"
            >
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 h-full w-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    Ako testovať tvojho bota
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <ul className="space-y-3 text-sm flex-1">
                    {[
                      "Spýtaj sa na cenu, balíky alebo spoluprácu.",
                      "Over, či vie popísať tvoju firmu podľa nastavení bota.",
                      "Skús otázky, ktoré si pridal do FAQ & firemné odpovede.",
                      "Skús aj \"blbé\" otázky – mal by slušne priznať, čo nevie.",
                      "Skús kliknúť na možnosť \"Chceš, aby sa ti niekto ozval? Zanechaj kontakt.\" a otestuj ukladanie leadov.",
                    ].map((tip, index) => (
                      <motion.li
                        key={index}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{tip}</span>
                      </motion.li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border/50 mt-auto">
                    Vpravo dole vidíš bublinku tvojho firemného bota – presne takto sa bude správať na tvojej webovej stránke.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex"
            >
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 h-full w-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                    </div>
                    Tipy pre lepšie odpovede
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <ul className="space-y-3 text-sm flex-1">
                    {[
                      { num: "1", text: "Dopln si podrobný popis firmy v nastaveniach bota – AI bude vedieť, čo presne ponúkaš." },
                      { num: "2", text: "Pridaj najčastejšie otázky do sekcie FAQ & firemné odpovede." },
                      { num: "3", text: "Otestuj konverzácie v rôznych scenároch (nový zákazník, existujúci klient, reklamácia...)." },
                      { num: "4", text: "Pozri si históriu konverzácií a analytiku, aby si videl, aké otázky sa pýtajú najviac." },
                      { num: "5", text: "Otestuj aj formulár na zber kontaktov v chate – zákazník môže nechať email a ty ho uvidíš v prehľade leadov." },
                    ].map((tip, index) => (
                      <motion.li
                        key={index}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + index * 0.05 }}
                      >
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {tip.num}
                        </span>
                        <span className="leading-relaxed">{tip.text}</span>
                      </motion.li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border/50 mt-auto">
                    Všetky zmeny v nastaveniach bota a FAQ sa okamžite prejavia aj v tomto teste.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Rýchle akcie
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Uprav nastavenia bota alebo pridaj FAQ pre lepšie odpovede
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/bot-settings">
                        Nastavenia bota
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/dashboard/faq">
                        Pridať FAQ
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Chat Widget */}
        <ChatWidget ownerUserId={user.id} />
      </div>
    </AnimatedPage>
  );
}
