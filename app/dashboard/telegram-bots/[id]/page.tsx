"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bot, CheckCircle2, XCircle, AlertCircle, MessageCircle, Activity, Settings } from "lucide-react";
import type { TelegramBot, TelegramBotStatus } from "@/lib/types/telegram";

export default function TelegramBotOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [bot, setBot] = useState<TelegramBot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBot();
  }, [botId]);

  const loadBot = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: botData, error: botError } = await supabase
        .from("telegram_bots")
        .select("*")
        .eq("id", botId)
        .single();

      if (botError) {
        console.error("Error loading bot:", botError);
        setError("Chyba pri načítaní bota");
        setLoading(false);
        return;
      }

      setBot(botData as TelegramBot);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Neočakávaná chyba");
    } finally {
      setLoading(false);
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

  const getConnectionBadge = (status: string) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Pripojené
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Chyba pripojenia
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Odpojené
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/telegram-bots")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Späť na Telegram botov
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || "Bot nebol nájdený"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/telegram-bots")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Späť
          </Button>
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
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{bot.bot_name}</h1>
              {getStatusBadge(bot.status)}
              {getConnectionBadge(bot.connection_status)}
            </div>
            {bot.description && (
              <p className="text-muted-foreground mt-1">{bot.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/telegram-bots/${bot.id}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Nastavenia
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Celkový počet správ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{bot.total_messages || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jedineční používatelia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{bot.unique_users || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Správy dnes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{bot.messages_today || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bot Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Základné informácie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Verejné meno</p>
              <p className="font-medium">{bot.public_name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jazyk</p>
              <p className="font-medium">{bot.bot_language}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Časové pásmo</p>
              <p className="font-medium">{bot.timezone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Režim odpovedania</p>
              <p className="font-medium">{bot.response_mode === "ai" ? "Bot + AI" : "Len bot"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prepojenie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Stav pripojenia</p>
              <div className="mt-1">{getConnectionBadge(bot.connection_status)}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Webhook</p>
              <p className="font-medium">{bot.webhook_enabled ? "Zapnutý" : "Vypnutý"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Long Polling</p>
              <p className="font-medium">{bot.long_polling_enabled ? "Zapnutý" : "Vypnutý"}</p>
            </div>
            {bot.last_connection_test && (
              <div>
                <p className="text-sm text-muted-foreground">Posledný test pripojenia</p>
                <p className="font-medium text-sm">
                  {new Date(bot.last_connection_test).toLocaleString("sk-SK")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Rýchle akcie</CardTitle>
          <CardDescription>Časté úlohy pre tohto bota</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/telegram-bots/${bot.id}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Nastavenia
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/telegram-bots/${bot.id}/commands`}>
                Príkazy & Flow
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/telegram-bots/${bot.id}/logs`}>
                Logy
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
