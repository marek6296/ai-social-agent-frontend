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
  UserPlus,
  PlayCircle,
  Zap,
} from "lucide-react";
import { WelcomeWizard, WelcomeConfig } from "@/components/discord-bot/WelcomeWizard";

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

export default function WelcomePage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  const [flows, setFlows] = useState<FlowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<WelcomeConfig | null>(null);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    loadFlows();
  }, [botId]);

  const loadFlows = async () => {
    try {
      const { data, error } = await supabase
        .from("discord_bot_flows")
        .select("*")
        .eq("bot_id", botId)
        .eq("module", "welcome")
        .order("priority", { ascending: true });

      if (error) throw error;
      setFlows(data || []);
    } catch (error) {
      console.error("Error loading flows:", error);
    } finally {
      setLoading(false);
    }
  };

  // Konvertovať WelcomeConfig na Flow formát pre databázu
  const configToFlow = (config: WelcomeConfig) => {
    const actions: any[] = [];
    
    // Ak sa má poslať do kanála
    if (config.sendToChannel && config.channelId) {
      actions.push({
        type: "send_message",
        config: {
          text: config.actions.find(a => a.type === "message" && a.config.channelId)?.config.text || "Vitaj {user}!",
          channel_id: config.channelId,
        },
      });
    }
    
    // Ak sa má poslať DM
    if (config.sendDM && config.dmMessage) {
      actions.push({
        type: "send_dm",
        config: { text: config.dmMessage },
      });
    }
    
    // Pridať ostatné akcie z config.actions
    config.actions.forEach(action => {
      if (action.type === "role") {
        actions.push({
          type: "assign_role",
          config: { role_id: action.config.roleId },
        });
      } else if (action.type === "buttons") {
        actions.push({
          type: "send_buttons",
          config: {
            message: action.config.message || "",
            buttons: action.config.buttons || [],
          },
        });
      } else if (action.type === "message" && (!config.sendToChannel || action.config.channelId !== config.channelId)) {
        // Ak je to iná správa než hlavná
        actions.push({
          type: "send_message",
          config: {
            text: action.config.text,
            channel_id: action.config.channelId,
          },
        });
      }
    });
    
    return {
      name: config.name,
      enabled: config.enabled,
      priority: 0,
      trigger_type: "member_join",
      trigger_config: {},
      conditions: {
        require_role: config.requireRole || undefined,
        ignored_role: config.ignoreRole || undefined,
        once_per_user: config.onlyOnce || undefined,
        cooldown_seconds: config.cooldownSeconds || undefined,
      },
      actions,
    };
  };

  const handleSaveConfig = async (config: WelcomeConfig) => {
    try {
      const flow = configToFlow(config);
      
      if (editingFlowId) {
        const { error } = await supabase
          .from("discord_bot_flows")
          .update(flow)
          .eq("id", editingFlowId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("discord_bot_flows").insert({
          ...flow,
          bot_id: botId,
          module: "welcome",
        });

        if (error) throw error;
      }

      setShowWizard(false);
      setEditingConfig(null);
      setEditingFlowId(null);
      loadFlows();
    } catch (error) {
      console.error("Error saving flow:", error);
      alert("Chyba pri ukladaní scenára");
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

  // Konvertovať Flow z databázy na WelcomeConfig
  const flowToConfig = (flow: FlowRecord): WelcomeConfig => {
    const conditions = flow.conditions || {};
    const actions = flow.actions || [];
    
    // Zistiť, kde sa posiela správa
    const messageAction = actions.find((a: any) => a.type === "send_message");
    const dmAction = actions.find((a: any) => a.type === "send_dm");
    
    const welcomeActions: any[] = [];
    actions.forEach((action: any) => {
      if (action.type === "assign_role") {
        welcomeActions.push({
          type: "role",
          config: { roleId: action.config.role_id },
        });
      } else if (action.type === "send_buttons") {
        welcomeActions.push({
          type: "buttons",
          config: {
            message: action.config.message || "",
            buttons: action.config.buttons || [],
          },
        });
      } else if (action.type === "send_message" && action.config.channel_id) {
        welcomeActions.push({
          type: "message",
          config: {
            text: action.config.text || "",
            channelId: action.config.channel_id,
          },
        });
      }
    });
    
    return {
      name: flow.name,
      enabled: flow.enabled,
      sendToChannel: !!messageAction?.config?.channel_id,
      guildId: messageAction?.config?.guild_id || "",
      channelId: messageAction?.config?.channel_id || "",
      sendDM: !!dmAction,
      dmMessage: dmAction?.config?.text || "",
      allMembers: !conditions.require_role,
      requireRole: conditions.require_role || "",
      ignoreRole: conditions.ignored_role || "",
      actions: welcomeActions,
      onlyOnce: conditions.once_per_user || false,
      cooldownSeconds: conditions.cooldown_seconds || 0,
    };
  };

  const handleNewFlow = () => {
    setEditingConfig(null);
    setEditingFlowId(null);
    setShowWizard(true);
  };

  const handleEditFlow = (flow: FlowRecord) => {
    setEditingConfig(flowToConfig(flow));
    setEditingFlowId(flow.id);
    setShowWizard(true);
  };

  const getActionLabel = (actions: any[]) => {
    if (!actions || actions.length === 0) return "Žiadna akcia";
    const firstAction = actions[0];
    if (firstAction.type === "send_message") {
      return `Poslať správu: ${firstAction.config?.text?.substring(0, 50) || ""}...`;
    }
    if (firstAction.type === "assign_role") {
      return `Pridať rolu: ${firstAction.config?.role_id || ""}`;
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
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/discord-bot")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Späť na Discord botov
        </Button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome & Onboarding</h1>
            <p className="text-muted-foreground mt-1">
              Nastav, ako má bot privítať nových členov na serveri
            </p>
          </div>
          <Button onClick={handleNewFlow}>
            <Plus className="h-4 w-4 mr-2" />
            Pridať welcome scenár
          </Button>
        </div>
      </div>

      {flows.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Ešte nemáš žiadny welcome scenár
            </h3>
            <p className="text-muted-foreground mb-4">
              Vytvor welcome scenár, aby bot privítal nových členov na serveri
            </p>
            <Button onClick={handleNewFlow}>
              <Plus className="h-4 w-4 mr-2" />
              Vytvoriť welcome scenár
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
                        <span>Trigger: Nový člen (join server)</span>
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

      {showWizard && (
        <WelcomeWizard
          botId={botId}
          initialConfig={editingConfig || undefined}
          onSave={handleSaveConfig}
          onCancel={() => {
            setShowWizard(false);
            setEditingConfig(null);
            setEditingFlowId(null);
          }}
        />
      )}
    </>
  );
}


