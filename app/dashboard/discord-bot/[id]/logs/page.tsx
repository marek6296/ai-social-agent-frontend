"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";

interface LogEntry {
  id: string;
  bot_id: string;
  log_type: string;
  message: string;
  metadata: any;
  created_at: string;
}

export default function LogsPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadLogs();
  }, [botId, filter]);

  const loadLogs = async () => {
    try {
      let query = supabase
        .from("discord_bot_logs")
        .select("*")
        .eq("bot_id", botId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("log_type", filter);
      }

      const { data, error } = await query;

      if (error) {
        // Ak je chyba typu "relation does not exist" alebo podobná, len nastav prázdne logs
        // Nechceme spamovať console s chybami, ak tabuľka neexistuje
        if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
          setLogs([]);
          return;
        }
        // Pre ostatné chyby, logni ich len v development móde
        if (process.env.NODE_ENV === "development") {
          console.warn("Error loading logs (table might not exist):", error.message);
        }
        setLogs([]);
        return;
      }
      
      setLogs(data || []);
    } catch (error: any) {
      // Tichý fallback - tabuľka pravdepodobne neexistuje
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (logType: string) => {
    switch (logType) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogBadgeColor = (logType: string) => {
    switch (logType) {
      case "error":
        return "destructive";
      case "success":
        return "default";
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/discord-bot")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Späť na Discord botov
      </Button>
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Logy & Diagnostika</h1>
          <p className="text-muted-foreground mt-1">
            Prehľad aktivít a chýb bota
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            Všetko
          </button>
          <button
            onClick={() => setFilter("error")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === "error"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            Chyby
          </button>
          <button
            onClick={() => setFilter("success")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === "success"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            Úspechy
          </button>
          <button
            onClick={() => setFilter("warning")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === "warning"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            Varovania
          </button>
          <button
            onClick={() => setFilter("info")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === "info"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            Info
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Žiadne logy
            </h3>
            <p className="text-muted-foreground">
              {filter === "all"
                ? "Ešte neboli zaznamenané žiadne logy. Po aktivácii bota sa tu objavia záznamy o aktivitách."
                : `Žiadne logy typu "${filter}"`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getLogIcon(log.log_type)}
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {log.message || "Log entry"}
                        <Badge variant={getLogBadgeColor(log.log_type) as any}>
                          {log.log_type}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {new Date(log.created_at).toLocaleString("sk-SK", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <CardContent className="pt-0">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Zobraziť metadata
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

