"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Clock,
  PlayCircle,
  Zap,
} from "lucide-react";
import { FlowEditor, Flow } from "@/components/discord-bot/FlowEditor";

interface FlowRecord {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  trigger_type: string;
  trigger_config: any;
  conditions: any;
  actions: any[];
  created_at: string;
}

export default function ScheduledPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  const [flows, setFlows] = useState<FlowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    loadFlows();
  }, [botId]);

  const loadFlows = async () => {
    try {
      const { data, error } = await supabase
        .from("discord_bot_flows")
        .select("*")
        .eq("bot_id", botId)
        .eq("module", "scheduled")
        .order("priority", { ascending: true });

      if (error) throw error;
      setFlows(data || []);
    } catch (error) {
      console.error("Error loading flows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFlow = async (flow: Flow) => {
    try {
      if (editingFlow?.id) {
        const { error } = await supabase
          .from("discord_bot_flows")
          .update(flow)
          .eq("id", editingFlow.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("discord_bot_flows").insert({
          ...flow,
          bot_id: botId,
          module: "scheduled",
        });

        if (error) throw error;
      }

      setShowEditor(false);
      setEditingFlow(null);
      loadFlows();
    } catch (error) {
      console.error("Error saving flow:", error);
      alert("Chyba pri ukladaní flow");
    }
  };

  const handleDeleteFlow = async (id: string) => {
    if (!confirm("Naozaj chceš vymazať tento flow?")) return;

    try {
      const { error } = await supabase
        .from("discord_bot_flows")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadFlows();
    } catch (error) {
      console.error("Error deleting flow:", error);
      alert("Chyba pri mazaní flow");
    }
  };

  const handleNewFlow = () => {
    setEditingFlow({
      name: "",
      enabled: true,
      priority: 0,
      trigger_type: "scheduled",
      trigger_config: {},
      conditions: {},
      actions: [{ type: "send_message", config: { text: "" } }],
    });
    setShowEditor(true);
  };

  const handleEditFlow = (flow: FlowRecord) => {
    setEditingFlow({
      id: flow.id,
      name: flow.name,
      enabled: flow.enabled,
      priority: flow.priority,
      trigger_type: flow.trigger_type as any,
      trigger_config: flow.trigger_config || {},
      conditions: flow.conditions || {},
      actions: flow.actions || [],
    });
    setShowEditor(true);
  };

  const getScheduleLabel = (config: any) => {
    if (!config) return "Nenastavené";
    
    // Check if it's interval-based or time-based
    const scheduleType = config.schedule_type || 'time';
    
    if (scheduleType === 'interval') {
      const intervalMinutes = config.interval_minutes || 60;
      if (intervalMinutes < 60) {
        return `Každých ${intervalMinutes} minút`;
      } else if (intervalMinutes === 60) {
        return `Každú hodinu`;
      } else if (intervalMinutes === 1440) {
        return `Každý deň`;
      } else {
        const hours = Math.floor(intervalMinutes / 60);
        const minutes = intervalMinutes % 60;
        if (minutes === 0) {
          return `Každých ${hours} hodín`;
        } else {
          return `Každých ${hours}h ${minutes}m`;
        }
      }
    } else {
      // Time-based
      const time = config.time || "00:00";
      const days = config.days || [];
      const dayNames = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];
      const dayLabels = days.map((d: number) => dayNames[d - 1]).join(", ");
      return `${time} (${dayLabels || "Všetky dni"})`;
    }
  };

  const getActionLabel = (actions: any[]) => {
    if (!actions || actions.length === 0) return "Žiadna akcia";
    const firstAction = actions[0];
    if (firstAction.type === "send_message") {
      return `Poslať správu: ${firstAction.config?.text?.substring(0, 50) || ""}...`;
    }
    if (firstAction.type === "send_embed") {
      return `Poslať embed: ${firstAction.config?.title || ""}`;
    }
    return firstAction.type;
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Plánované správy</h1>
            <p className="text-muted-foreground mt-1">
              Nastav automatické správy, ktoré bot odošle v určenom čase
            </p>
          </div>
          <Button onClick={handleNewFlow}>
            <Plus className="h-4 w-4 mr-2" />
            Pridať plánovanú správu
          </Button>
        </div>
      </div>

      {flows.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Ešte nemáš žiadne plánované správy
            </h3>
            <p className="text-muted-foreground mb-4">
              Vytvor plánovanú správu, ktorú bot odošle v určenom čase
            </p>
            <Button onClick={handleNewFlow}>
              <Plus className="h-4 w-4 mr-2" />
              Pridať prvú plánovanú správu
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {flows.map((flow) => (
            <Card key={flow.id} className={!flow.enabled ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{flow.name}</CardTitle>
                      {flow.enabled ? (
                        <Badge variant="default">Aktívny</Badge>
                      ) : (
                        <Badge variant="secondary">Neaktívny</Badge>
                      )}
                      <Badge variant="outline">Priorita: {flow.priority}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1 mt-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3" />
                        <span>Schedule: {getScheduleLabel(flow.trigger_config)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-3 w-3" />
                        <span>Akcia: {getActionLabel(flow.actions)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditFlow(flow)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteFlow(flow.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {showEditor && (
        <FlowEditor
          botId={botId}
          flow={editingFlow}
          onSave={handleSaveFlow}
          onCancel={() => {
            setShowEditor(false);
            setEditingFlow(null);
          }}
          module="scheduled"
        />
      )}
    </>
  );
}

