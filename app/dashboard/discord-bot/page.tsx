"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/AnimatedPage";
import {
  MessageCircle,
  ArrowLeft,
  Plus,
  Settings,
  Server,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Bot,
  ExternalLink,
} from "lucide-react";

type DiscordBot = {
  id: string;
  bot_name: string;
  bot_avatar_url: string | null;
  description: string | null;
  status: "inactive" | "active" | "error";
  total_servers: number;
  total_messages: number;
  created_at: string;
  updated_at: string;
};

const cardSpring = (delay: number) => ({
  type: "spring" as const,
  stiffness: 100,
  damping: 15,
  delay,
});

export default function DiscordBotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<DiscordBot[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        // Handle refresh token errors
        if (error.message?.includes("Refresh Token") || error.message?.includes("refresh_token")) {
          await supabase.auth.signOut();
          router.push("/login");
          return;
        }
        router.push("/login");
        return;
      }
      if (!data.user) {
        router.push("/login");
        return;
      }
      setLoading(false);
      loadBots();
    };
    checkAuth();
  }, [router]);

  const loadBots = async () => {
    setLoadingBots(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoadingBots(false);
      return;
    }

    try {
      // Load bots without subquery (RLS might block subquery access)
      const { data: botsData, error } = await supabase
        .from("discord_bots")
        .select(`
          id,
          bot_name,
          bot_avatar_url,
          description,
          status,
          total_messages,
          created_at,
          updated_at
        `)
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading bots:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        setBots([]);
        setLoadingBots(false);
        return;
      }

      // Load server counts separately for each bot
      if (botsData && botsData.length > 0) {
        const botsWithServers = await Promise.all(
          botsData.map(async (bot) => {
            const { count } = await supabase
              .from("discord_bot_servers")
              .select("*", { count: "exact", head: true })
              .eq("bot_id", bot.id)
              .eq("is_active", true);
            
            return {
              ...bot,
              total_servers: count || 0,
              total_messages: bot.total_messages || 0,
            };
          })
        );
        setBots(botsWithServers as DiscordBot[]);
      } else {
        setBots([]);
      }
    } catch (err) {
      console.error("Unexpected error loading bots:", err);
      setBots([]);
    } finally {
      setLoadingBots(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aktívny
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Chyba
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <XCircle className="h-3 w-3 mr-1" />
            Neaktívny
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Späť na produkty
            </Button>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Discord Chatbot</h1>
                  <p className="text-muted-foreground">
                    Správa tvojich Discord botov
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/dashboard/discord-bot/create")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Vytvoriť nového bota
              </Button>
            </div>
          </div>

          {/* Bots List */}
          {loadingBots ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : bots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-border/50">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto h-20 w-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                    <Bot className="h-10 w-10 text-indigo-500" />
                  </div>
                  <CardTitle className="text-2xl mb-2">
                    Ešte nemáš žiadneho Discord bota
                  </CardTitle>
                  <CardDescription className="text-base">
                    Vytvor svojho prvého Discord bota a pripoj ho na svoj Discord server
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Vytvor si svojho Discord chatbota v niekoľkých jednoduchých krokoch. 
                    Bot bude schopný automatizovať komunikáciu na tvojom Discord serveri, 
                    odpovedať na otázky a pomáhať používateľom.
                  </p>
                  <div className="pt-2 space-y-2">
                    <Button
                      onClick={() => router.push("/dashboard/discord-bot/create")}
                      size="lg"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Vytvoriť prvého bota
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Môžeš vytvoriť toľko botov, koľko potrebuješ
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bots.map((bot, index) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={cardSpring(index * 0.1)}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="flex"
                >
                  <Card className="group relative w-full flex flex-col h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 overflow-hidden border-border/50">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 transition-all duration-500 pointer-events-none opacity-0 group-hover:opacity-100" />
                    
                    <CardHeader className="relative z-10 pb-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                          {bot.bot_avatar_url ? (
                            <img
                              src={bot.bot_avatar_url}
                              alt={bot.bot_name}
                              className="h-12 w-12 rounded-xl"
                            />
                          ) : (
                            <Bot className="h-6 w-6 text-indigo-500" />
                          )}
                        </div>
                        {getStatusBadge(bot.status)}
                      </div>
                      <CardTitle className="text-xl mb-2">{bot.bot_name}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed flex-1">
                        {bot.description || "Discord chatbot pre tvoj server"}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Server className="h-4 w-4" />
                          <span>{bot.total_servers || 0} serverov</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{bot.total_messages || 0} správ</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-0 mt-auto">
                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="outline"
                          className="flex-1 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/50 transition-colors"
                        >
                          <Link href={`/dashboard/discord-bot/${bot.id}`} className="flex items-center justify-center gap-2">
                            <Settings className="h-4 w-4" />
                            <span>Nastavenia</span>
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="flex-1 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/50 transition-colors"
                        >
                          <Link href={`/dashboard/discord-bot/${bot.id}/servers`} className="flex items-center justify-center gap-2">
                            <Server className="h-4 w-4" />
                            <span>Servery</span>
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
