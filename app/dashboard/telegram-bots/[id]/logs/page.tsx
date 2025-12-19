"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { TelegramBotLog } from "@/lib/types/telegram";

export default function TelegramBotLogsPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  const [logs, setLogs] = useState<TelegramBotLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [botId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("telegram_bot_logs")
        .select("*")
        .eq("bot_id", botId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        // Table might not exist yet, that's okay
        if (error.code === "PGRST116") {
          setLogs([]);
        } else {
          console.error("Error loading logs:", error);
        }
      } else {
        setLogs((data || []) as TelegramBotLog[]);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/telegram-bots/${botId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Späť na prehľad
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logy & Monitoring</CardTitle>
          <CardDescription>
            Prehľad udalostí a chýb bota
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Zatiaľ nie sú žiadne logy
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 border rounded-lg text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{log.event_type}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(log.created_at).toLocaleString("sk-SK")}
                    </span>
                  </div>
                  {log.message_text && (
                    <p className="text-muted-foreground mt-1">{log.message_text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
