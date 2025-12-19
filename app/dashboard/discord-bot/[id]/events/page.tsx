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
  Calendar,
  PlayCircle,
  Zap,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { FlowEditor, Flow } from "@/components/discord-bot/FlowEditor";
import { MessageTemplateBuilder, MessageTemplate } from "@/components/discord-bot/MessageTemplateBuilder";

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
  template_id?: string; // For template-based events
}

interface EventParticipant {
  id: string;
  user_id: string;
  status: string;
  data_json: any;
  created_at: string;
  updated_at: string;
  user_tag?: string; // Discord username#discriminator (will be fetched)
}

export default function EventsPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  const [flows, setFlows] = useState<FlowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [selectedGuildId, setSelectedGuildId] = useState<string>("");
  const [participants, setParticipants] = useState<Record<string, EventParticipant[]>>({});
  const [loadingParticipants, setLoadingParticipants] = useState<Record<string, boolean>>({});
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFlows();
  }, [botId]);

  const loadParticipants = async (templateId: string) => {
    setLoadingParticipants((prev) => ({ ...prev, [templateId]: true }));
    try {
      const { data, error } = await supabase
        .from("discord_message_state")
        .select("*")
        .eq("template_id", templateId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setParticipants((prev) => ({ ...prev, [templateId]: data || [] }));
    } catch (error) {
      console.error(`Error loading participants for template ${templateId}:`, error);
    } finally {
      setLoadingParticipants((prev) => ({ ...prev, [templateId]: false }));
    }
  };

  const loadFlows = async () => {
    try {
      // Load event templates (stored as message templates with event metadata)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: templates, error: templatesError } = await supabase
        .from("discord_message_templates")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });

      if (templatesError) throw templatesError;

      // Also load flows for backwards compatibility
      const { data: flowData, error: flowError } = await supabase
        .from("discord_bot_flows")
        .select("*")
        .eq("bot_id", botId)
        .eq("module", "event")
        .order("priority", { ascending: true });

      if (flowError) throw flowError;
      
      // Convert templates to flow format for display
      const templateFlows: FlowRecord[] = (templates || []).map((t: any) => {
        const templateAction = t.actions || [{ type: "send_template", config: { template_id: t.id } }];
        return {
          id: t.id,
          name: t.name,
          enabled: true,
          priority: 0,
          trigger_type: "scheduled",
          trigger_config: { schedule_type: "time" },
          conditions: {},
          actions: templateAction,
          created_at: t.created_at,
          template_id: t.id,
        };
      });

      setFlows([...templateFlows, ...(flowData || [])]);
      
      // Load participants for all template-based events
      templateFlows.forEach(flow => {
        if (flow.template_id) {
          loadParticipants(flow.template_id);
        }
      });
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
          module: "event",
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

  const handleDeleteFlow = async (flow: FlowRecord) => {
    if (!confirm("Naozaj chceš vymazať tento event?")) return;

    try {
      // Check if this is a template-based event
      const templateAction = flow.actions?.find((a: any) => a.type === "send_template");
      
      if (templateAction?.config?.template_id) {
        // Delete template first (this will cascade delete flows via foreign key if needed)
        const { error: templateError } = await supabase
          .from("discord_message_templates")
          .delete()
          .eq("id", templateAction.config.template_id);

        if (templateError) throw templateError;
      }
      
      // Delete flow
      const { error: flowError } = await supabase
        .from("discord_bot_flows")
        .delete()
        .eq("id", flow.id);

      if (flowError) throw flowError;
      loadFlows();
    } catch (error) {
      console.error("Error deleting flow:", error);
      alert("Chyba pri mazaní eventu");
    }
  };

  const handleNewEvent = () => {
    console.log("handleNewEvent called");
    // Use MessageTemplateBuilder for creating events
    // Start with empty guild_id - user will select it in the builder (if needed)
    const newTemplate: MessageTemplate = {
      name: "Nový event",
      guild_id: "",
      pages: [
        {
          name: "Main",
          embed: {
            title: "",
            description: "",
            color: "#22C55E",
          },
          components: {},
        },
      ],
      current_page_index: 0,
    };
    console.log("Setting editingTemplate:", newTemplate);
    setEditingTemplate(newTemplate);
    setSelectedGuildId("");
    setShowTemplateBuilder(true);
    console.log("showTemplateBuilder set to true");
  };

  const handleSaveEventTemplate = async (template: MessageTemplate) => {
    try {
      // Save template to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nie si prihlásený");

      const { data: savedTemplate, error: templateError } = await supabase
        .from("discord_message_templates")
        .upsert({
          id: template.id,
          owner_user_id: user.id,
          guild_id: template.guild_id || selectedGuildId,
          name: template.name,
          embed_json: template.pages[template.current_page_index]?.embed || {},
          components_json: template.pages[template.current_page_index]?.components || {},
          pages_json: template.pages,
          current_page_index: template.current_page_index,
          version: template.id ? undefined : 1, // Only set version on create
        }, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // If creating new event, create a flow that uses send_template action
      if (!template.id) {
        const flow: Flow = {
          name: template.name,
          enabled: true,
          priority: 0,
          trigger_type: "scheduled",
          trigger_config: {
            schedule_type: "time",
            time: new Date().toISOString(),
          },
          conditions: {},
          actions: [
            {
              type: "send_template",
              config: {
                template_id: savedTemplate.id,
                channel_id: "",
              },
            },
          ],
        };

        // Save flow to database
        const { error: flowError } = await supabase.from("discord_bot_flows").insert({
          ...flow,
          bot_id: botId,
          module: "event",
        });

        if (flowError) throw flowError;
      }

      setShowTemplateBuilder(false);
      setEditingTemplate(null);
      setSelectedGuildId("");
      loadFlows();
    } catch (error) {
      console.error("Error saving event template:", error);
      alert("Chyba pri ukladaní eventu");
    }
  };

  const handleSaveEvent = async (eventConfig: any) => {
    try {
      // Convert EventConfig to Flow format
      // Calculate timestamp from date + time
      const eventDateTime = new Date(`${eventConfig.eventDate}T${eventConfig.eventTime}`);
      const timestamp = Math.floor(eventDateTime.getTime() / 1000); // Unix timestamp
      
      // Build buttons array
      const buttons: any[] = [];
      if (eventConfig.showJoinButton) {
        buttons.push({
          id: `event_join_${Date.now()}`,
          label: "Join",
          style: "success",
        });
      }
      if (eventConfig.showMaybeButton) {
        buttons.push({
          id: `event_maybe_${Date.now()}`,
          label: "Maybe",
          style: "secondary",
        });
      }
      if (eventConfig.showLeaveButton) {
        buttons.push({
          id: `event_leave_${Date.now()}`,
          label: "Leave",
          style: "danger",
        });
      }
      if (eventConfig.showSettingsButton) {
        buttons.push({
          id: `event_settings_${Date.now()}`,
          label: "Settings",
          style: "primary",
        });
      }

      // Create embed with event details
      // Combine embed + buttons in single action (send_buttons can include embed)
      const flow: Flow = {
        name: eventConfig.name,
        enabled: eventConfig.enabled,
        priority: 0,
        trigger_type: "slash_command", // Events are created via slash command
        trigger_config: { command: "event" },
        conditions: {},
        actions: buttons.length > 0 ? [
          {
            type: "send_buttons",
            config: {
              channel_id: eventConfig.channelId,
              message: "", // Buttons will be attached to embed
              buttons: buttons,
              embed: {
                title: eventConfig.eventTitle,
                description: eventConfig.eventDescription,
                color: "#22C55E", // Green color like in the image
                fields: [
                  {
                    name: "👥 Players",
                    value: `0/${eventConfig.maxPlayers}`,
                    inline: true,
                  },
                  ...(eventConfig.voiceChannel
                    ? [
                        {
                          name: "💬 Voice channel",
                          value: `🔗 ${eventConfig.voiceChannel}`,
                          inline: true,
                        },
                      ]
                    : []),
                  {
                    name: "⏰ Time",
                    value: `${eventDateTime.toLocaleDateString("sk-SK")} ${eventConfig.eventTime} (${eventConfig.timezone})`,
                    inline: false,
                  },
                ],
                timestamp: timestamp, // Unix timestamp as number
              },
            },
          },
        ] : [
          {
            type: "send_embed",
            config: {
              channel_id: eventConfig.channelId,
              title: eventConfig.eventTitle,
              description: eventConfig.eventDescription,
              color: "#22C55E",
              fields: [
                {
                  name: "👥 Players",
                  value: `0/${eventConfig.maxPlayers}`,
                  inline: true,
                },
                ...(eventConfig.voiceChannel
                  ? [
                      {
                        name: "💬 Voice channel",
                        value: `🔗 ${eventConfig.voiceChannel}`,
                        inline: true,
                      },
                    ]
                  : []),
                {
                  name: "⏰ Time",
                  value: `${eventDateTime.toLocaleDateString("sk-SK")} ${eventConfig.eventTime} (${eventConfig.timezone})`,
                  inline: false,
                },
              ],
              timestamp: timestamp,
            },
          },
        ],
      };

      // Save to database
      const { error } = await supabase.from("discord_bot_flows").insert({
        ...flow,
        bot_id: botId,
        module: "event",
      });

      if (error) throw error;

      // This function is likely not used anymore, but keep for compatibility
      // setShowEventWizard(false);
      // setEditingEvent(null);
      loadFlows();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Chyba pri ukladaní eventu");
    }
  };

  const handleEditFlow = async (flow: FlowRecord) => {
    // Check if this is a template-based event (has send_template action)
    const templateAction = flow.actions?.find((a: any) => a.type === "send_template");
    
    if (templateAction?.config?.template_id) {
      // Load template and edit it
      const { data: template, error } = await supabase
        .from("discord_message_templates")
        .select("*")
        .eq("id", templateAction.config.template_id)
        .single();

      if (!error && template) {
        const templateData: MessageTemplate = {
          id: template.id,
          name: template.name,
          guild_id: template.guild_id,
          pages: template.pages_json || [
            {
              name: "Main",
              embed: template.embed_json || {},
              components: template.components_json || {},
            },
          ],
          current_page_index: template.current_page_index || 0,
        };
        setEditingTemplate(templateData);
        setSelectedGuildId(template.guild_id);
        setShowTemplateBuilder(true);
        return;
      }
    }

    // Fallback to FlowEditor for non-template flows
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

  const getTriggerLabel = (triggerType: string, config: any) => {
    switch (triggerType) {
      case "slash_command":
        return `Command: /${config?.command || "event"}`;
      case "button_interaction":
        return `Button: ${config?.button_id || ""}`;
      default:
        return triggerType;
    }
  };

  const getActionLabel = (actions: any[]) => {
    if (!actions || actions.length === 0) return "Žiadna akcia";
    const firstAction = actions[0];
    if (firstAction.type === "send_message") {
      return `Poslať správu: ${firstAction.config?.text?.substring(0, 50) || ""}...`;
    }
    if (firstAction.type === "create_event") {
      return `Vytvoriť event: ${firstAction.config?.name || ""}`;
    }
    return firstAction.type;
  };

  // Show MessageTemplateBuilder when creating/editing event (before loading check)
  if (showTemplateBuilder && editingTemplate) {
    console.log("Rendering MessageTemplateBuilder", { showTemplateBuilder, editingTemplate });
    return (
      <MessageTemplateBuilder
        template={editingTemplate}
        guildId={editingTemplate.guild_id || selectedGuildId || ""}
        onSave={handleSaveEventTemplate}
        onCancel={() => {
          console.log("Cancel clicked");
          setShowTemplateBuilder(false);
          setEditingTemplate(null);
          setSelectedGuildId("");
        }}
      />
    );
  }

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Eventy & Interakcie</h1>
            <p className="text-muted-foreground mt-1">
              Spravuj eventy, RSVP systémy a interaktívne komponenty
            </p>
          </div>
          <Button onClick={handleNewEvent}>
            <Plus className="h-4 w-4 mr-2" />
            Vytvoriť event
          </Button>
        </div>
      </div>

      {flows.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Ešte nemáš žiadne event flows
            </h3>
            <p className="text-muted-foreground mb-4">
              Vytvor event flow pre RSVP systémy, plánované eventy a interaktívne komponenty
            </p>
            <Button onClick={handleNewEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Vytvoriť prvý event
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
                        <span>Trigger: {getTriggerLabel(flow.trigger_type, flow.trigger_config)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-3 w-3" />
                        <span>Akcia: {getActionLabel(flow.actions)}</span>
                      </div>
                      {/* Participants count for template-based events */}
                      {flow.template_id && (
                        <div className="flex items-center gap-2 mt-2">
                          <Users className="h-3 w-3" />
                          <span className="text-xs">
                            Účastníci: {
                              participants[flow.template_id]?.filter(p => p.status === "going").length || 0
                            } prihlásených, {
                              participants[flow.template_id]?.filter(p => p.status === "maybe").length || 0
                            } možno, {
                              participants[flow.template_id]?.filter(p => p.status === "no").length || 0
                            } neprihlásených
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {flow.template_id && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => flow.template_id && loadParticipants(flow.template_id)}
                        title="Obnoviť zoznam účastníkov"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
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
                      onClick={() => handleDeleteFlow(flow)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {/* Participants list for template-based events - only show when expanded */}
              {flow.template_id && expandedEvents.has(flow.template_id) && (
                <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Zoznam účastníkov
                        </h4>
                        {loadingParticipants[flow.template_id!] && (
                          <div className="h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        )}
                      </div>
                      {!participants[flow.template_id!] || participants[flow.template_id!].length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          Žiadni účastníci
                        </div>
                      ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Going */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Prihlásení ({participants[flow.template_id].filter(p => p.status === "going").length})
                        </div>
                        <div className="space-y-1">
                          {participants[flow.template_id]
                            ?.filter(p => p.status === "going")
                            .map((p) => (
                              <div key={p.id} className="text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                <div className="font-medium text-foreground">
                                  {p.data_json?.user_tag || p.user_tag || `ID: ${p.user_id.substring(0, 8)}...`}
                                </div>
                              </div>
                            ))}
                          {(!participants[flow.template_id] || participants[flow.template_id].filter(p => p.status === "going").length === 0) && (
                            <div className="text-xs text-muted-foreground italic">Žiadni prihlásení</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Maybe */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                          <HelpCircle className="h-4 w-4" />
                          Možno ({participants[flow.template_id].filter(p => p.status === "maybe").length})
                        </div>
                        <div className="space-y-1">
                          {participants[flow.template_id]
                            ?.filter(p => p.status === "maybe")
                            .map((p) => (
                              <div key={p.id} className="text-xs p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                <div className="font-medium text-foreground">
                                  {p.data_json?.user_tag || p.user_tag || `ID: ${p.user_id.substring(0, 8)}...`}
                                </div>
                              </div>
                            ))}
                          {(!participants[flow.template_id] || participants[flow.template_id].filter(p => p.status === "maybe").length === 0) && (
                            <div className="text-xs text-muted-foreground italic">Nikto</div>
                          )}
                        </div>
                      </div>
                      
                      {/* No / Decline */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                          <XCircle className="h-4 w-4" />
                          Neprihlásení ({participants[flow.template_id].filter(p => p.status === "no").length})
                        </div>
                        <div className="space-y-1">
                          {participants[flow.template_id]
                            ?.filter(p => p.status === "no")
                            .map((p) => (
                              <div key={p.id} className="text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                <div className="font-medium text-foreground">
                                  {p.data_json?.user_tag || p.user_tag || `ID: ${p.user_id.substring(0, 8)}...`}
                                </div>
                              </div>
                            ))}
                          {(!participants[flow.template_id] || participants[flow.template_id].filter(p => p.status === "no").length === 0) && (
                            <div className="text-xs text-muted-foreground italic">Nikto</div>
                          )}
                        </div>
                      </div>
                    </div>
                    )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}


      {showEditor && editingFlow && (
        <FlowEditor
          botId={botId}
          flow={editingFlow}
          onSave={handleSaveFlow}
          onCancel={() => {
            setShowEditor(false);
            setEditingFlow(null);
          }}
          module="event"
        />
      )}
    </>
  );
}

