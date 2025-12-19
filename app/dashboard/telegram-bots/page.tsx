"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatedPage } from "@/components/AnimatedPage";
import {
  MessageCircle,
  ArrowLeft,
  Plus,
  Settings,
  Bot,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Clock,
  Activity,
} from "lucide-react";
import type { TelegramBot, TelegramBotStatus } from "@/lib/types/telegram";

const cardSpring = (delay: number) => ({
  type: "spring" as const,
  stiffness: 100,
  damping: 15,
  delay,
});

type FilterStatus = "all" | "active" | "inactive" | "error" | "draft";
type SortOption = "newest" | "name" | "activity";

export default function TelegramBotsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
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
      const { data: botsData, error } = await supabase
        .from("telegram_bots")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading bots:", error);
        setBots([]);
        setLoadingBots(false);
        return;
      }

      setBots((botsData || []) as TelegramBot[]);
    } catch (err) {
      console.error("Unexpected error loading bots:", err);
      setBots([]);
    } finally {
      setLoadingBots(false);
    }
  };

  const getStatusBadge = (status: TelegramBotStatus) => {
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
      case "draft":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Koncept
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

  // Filter and sort bots
  const filteredBots = bots
    .filter((bot) => {
      // Search filter
      if (searchQuery && !bot.bot_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !bot.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status filter
      if (filterStatus !== "all" && bot.status !== filterStatus) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "name":
          return a.bot_name.localeCompare(b.bot_name);
        case "activity":
          const aTime = a.last_activity ? new Date(a.last_activity).getTime() : 0;
          const bTime = b.last_activity ? new Date(b.last_activity).getTime() : 0;
          return bTime - aTime;
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

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
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Telegram Chatbot</h1>
                  <p className="text-muted-foreground">
                    Správa tvojich Telegram botov
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/dashboard/telegram-bots/new")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Vytvoriť nového bota
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          {bots.length > 0 && (
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hľadať bota podľa názvu alebo popisu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všetky</SelectItem>
                  <SelectItem value="active">Aktívne</SelectItem>
                  <SelectItem value="inactive">Neaktívne</SelectItem>
                  <SelectItem value="draft">Koncepty</SelectItem>
                  <SelectItem value="error">Chyby</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Najnovšie</SelectItem>
                  <SelectItem value="name">Podľa názvu</SelectItem>
                  <SelectItem value="activity">Aktivita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Bots List */}
          {loadingBots ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredBots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-border/50">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Bot className="h-10 w-10 text-blue-500" />
                  </div>
                  <CardTitle className="text-2xl mb-2">
                    {bots.length === 0 
                      ? "Ešte nemáš žiadneho Telegram bota"
                      : "Nenašli sa žiadne výsledky"}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {bots.length === 0
                      ? "Vytvor svojho prvého Telegram bota a pripoj ho na Telegram"
                      : "Skús zmeniť vyhľadávanie alebo filtre"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {bots.length === 0 && (
                    <>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Vytvor si svojho Telegram chatbota v niekoľkých jednoduchých krokoch. 
                        Bot bude schopný automatizovať komunikáciu na Telegrame, 
                        odpovedať na otázky a pomáhať používateľom.
                      </p>
                      <div className="pt-2 space-y-2">
                        <Button
                          onClick={() => router.push("/dashboard/telegram-bots/new")}
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
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBots.map((bot, index) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={cardSpring(index * 0.1)}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="flex"
                >
                  <Card className="group relative w-full flex flex-col h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/50 overflow-hidden border-border/50">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 transition-all duration-500 pointer-events-none opacity-0 group-hover:opacity-100" />
                    
                    <CardHeader className="relative z-10 pb-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          {bot.bot_avatar_url ? (
                            <img
                              src={bot.bot_avatar_url}
                              alt={bot.bot_name}
                              className="h-12 w-12 rounded-xl"
                            />
                          ) : (
                            <Bot className="h-6 w-6 text-blue-500" />
                          )}
                        </div>
                        {getStatusBadge(bot.status)}
                      </div>
                      <CardTitle className="text-xl mb-2">{bot.bot_name}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed flex-1">
                        {bot.description || "Telegram chatbot"}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{bot.total_messages || 0} správ</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          <span>{bot.unique_users || 0} používateľov</span>
                        </div>
                      </div>
                      {bot.last_activity && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Posledná aktivita: {new Date(bot.last_activity).toLocaleDateString("sk-SK")}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="relative z-10 pt-0 mt-auto">
                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="outline"
                          className="flex-1 group-hover:bg-blue-500/10 group-hover:border-blue-500/50 transition-colors"
                        >
                          <Link href={`/dashboard/telegram-bots/${bot.id}`} className="flex items-center justify-center gap-2">
                            <Settings className="h-4 w-4" />
                            <span>Nastavenia</span>
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
