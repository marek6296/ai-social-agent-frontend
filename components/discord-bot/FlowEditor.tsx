"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChannelSelect } from "./ChannelSelect";
import { GuildSelect } from "./GuildSelect";
import {
  Zap,
  Filter,
  PlayCircle,
  X,
  Plus,
  Trash2,
} from "lucide-react";

export type TriggerType =
  | "new_message"
  | "mention"
  | "slash_command"
  | "member_join"
  | "member_leave"
  | "role_added"
  | "role_removed"
  | "reaction_add"
  | "button_click"
  | "select_menu"
  | "modal_submit"
  | "scheduled"
  | "keyword_match"
  | "regex_match"
  | "inactivity";

export type ActionType =
  | "send_message"
  | "send_embed"
  | "send_dm"
  | "ping_role"
  | "assign_role"
  | "create_thread"
  | "pin_message"
  | "delete_message"
  | "send_buttons"
  | "send_select_menu"
  | "open_modal"
  | "save_to_db"
  | "notify_admin"
  | "ai_response"
  | "send_template"
  | "warn"
  | "timeout"
  | "kick"
  | "ban";

export interface Flow {
  id?: string;
  name: string;
  enabled: boolean;
  priority: number;
  trigger_type: TriggerType;
  trigger_config: Record<string, any>;
  conditions: Record<string, any>;
  actions: Array<{ type: ActionType; config: Record<string, any> }>;
  ai_config?: Record<string, any>;
}

interface FlowEditorProps {
  botId: string;
  flow: Flow | null;
  onSave: (flow: Flow) => void;
  onCancel: () => void;
  module: string;
}

export function FlowEditor({ botId, flow, onSave, onCancel, module }: FlowEditorProps) {
  const [formData, setFormData] = useState<Flow>(
    flow || {
      name: "",
      enabled: true,
      priority: 0,
      trigger_type: "new_message",
      trigger_config: {},
      conditions: {},
      actions: [{ type: "send_message", config: { text: "" } }],
    }
  );

  const [activeTab, setActiveTab] = useState("trigger");
  
  // Extract guild_id from first action's config or use empty
  // For scheduled/welcome flows, we need to select a guild first
  const getInitialGuildId = (): string => {
    // Try to find a guild_id in any action config (if we stored it)
    const firstAction = formData.actions.find(a => a.config.channel_id);
    return firstAction?.config.guild_id || "";
  };
  const [selectedGuildId, setSelectedGuildId] = useState<string>(getInitialGuildId());
  
  // Update selectedGuildId when formData changes (e.g., when editing existing flow)
  // Only update once when flow is first loaded or when actions change externally
  useEffect(() => {
    if (flow?.id) {
      // Only initialize once when editing an existing flow
      const guildId = getInitialGuildId();
      if (guildId && !selectedGuildId) {
        setSelectedGuildId(guildId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow?.id]);

  // Trigger options podľa modulu
  const getTriggerOptions = (): TriggerType[] => {
    switch (module) {
      case "message_reply":
        return ["new_message", "mention", "keyword_match", "regex_match"];
      case "welcome":
        return ["member_join"];
      case "scheduled":
        return ["scheduled"];
      case "rule":
        return ["new_message", "mention", "keyword_match", "regex_match", "slash_command"];
      case "event":
        return ["button_click", "select_menu", "modal_submit"];
      default:
        return ["new_message", "mention", "keyword_match"];
    }
  };

  const triggerOptions = getTriggerOptions();

  // Action options podľa modulu
  const getActionOptions = (): ActionType[] => {
    const baseActions: ActionType[] = [
      "send_message",
      "send_embed",
      "send_dm",
      "ping_role",
      "assign_role",
    ];

    if (module === "message_reply" || module === "rule") {
      return [...baseActions, "ai_response"];
    }

    if (module === "event") {
      return [
        ...baseActions,
        "send_buttons",
        "send_select_menu",
        "open_modal",
        "save_to_db",
        "notify_admin",
      ];
    }

    return baseActions;
  };

  const handleTriggerChange = (triggerType: TriggerType) => {
    setFormData({
      ...formData,
      trigger_type: triggerType,
      trigger_config: {}, // Reset config pri zmene triggeru
    });
  };

  const handleActionAdd = () => {
    setFormData({
      ...formData,
      actions: [
        ...formData.actions,
        { type: "send_message", config: { text: "" } },
      ],
    });
  };

  const handleActionRemove = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  const handleActionChange = (index: number, type: ActionType) => {
    const newActions = [...formData.actions];
    const defaultConfig: Record<string, any> = {};
    
    // Set default config based on action type
    if (type === "send_message" || type === "send_dm") {
      defaultConfig.text = "";
    } else if (type === "send_embed") {
      defaultConfig.title = "";
      defaultConfig.description = "";
      defaultConfig.color = "#5865F2";
    } else if (type === "send_buttons") {
      defaultConfig.message = "";
      defaultConfig.buttons = [];
    } else if (type === "send_select_menu") {
      defaultConfig.message = "";
      defaultConfig.menu_id = "";
      defaultConfig.placeholder = "";
      defaultConfig.options = [];
    } else if (type === "open_modal") {
      defaultConfig.modal_id = "";
      defaultConfig.title = "";
      defaultConfig.inputs = [];
    } else if (type === "assign_role" || type === "ping_role") {
      defaultConfig.role_id = "";
    }
    
    newActions[index] = {
      type,
      config: defaultConfig,
    };
    setFormData({ ...formData, actions: newActions });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert("Názov flow je povinný");
      return;
    }

    if (formData.actions.length === 0) {
      alert("Pridaj aspoň jednu akciu");
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-background">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {flow ? "Upraviť flow" : "Nový flow"}
              </CardTitle>
              <CardDescription>
                Konfigurácia pravidla: Trigger → Conditions → Actions
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {/* Základné nastavenia */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flow-name">Názov flow *</Label>
                <Input
                  id="flow-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Napríklad: FAQ odpoveď na cenu"
                />
              </div>
              <div>
                <Label htmlFor="flow-priority">Priorita (nižšie = vyššia priorita)</Label>
                <Input
                  id="flow-priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="flow-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
              <Label htmlFor="flow-enabled">Flow je aktívny</Label>
            </div>
          </div>

          {/* 3 taby: Trigger, Conditions, Actions */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger 
                value="trigger" 
                className={`flex items-center gap-2 ${
                  activeTab === "trigger" ? "bg-primary text-primary-foreground font-semibold" : ""
                }`}
              >
                <Zap className="h-4 w-4" />
                Kedy (Trigger)
                {activeTab === "trigger" && formData.trigger_type && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {formData.trigger_type === "new_message" ? "Nová správa" :
                     formData.trigger_type === "mention" ? "@mention" :
                     formData.trigger_type === "keyword_match" ? "Keyword" :
                     formData.trigger_type === "scheduled" ? "Naplánované" :
                     formData.trigger_type}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="conditions" 
                className={`flex items-center gap-2 ${
                  activeTab === "conditions" ? "bg-primary text-primary-foreground font-semibold" : ""
                }`}
              >
                <Filter className="h-4 w-4" />
                Podmienky
                {activeTab === "conditions" && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {Object.keys(formData.conditions || {}).filter(k => formData.conditions[k]).length} aktívnych
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="actions" 
                className={`flex items-center gap-2 ${
                  activeTab === "actions" ? "bg-primary text-primary-foreground font-semibold" : ""
                }`}
              >
                <PlayCircle className="h-4 w-4" />
                Akcia
                {activeTab === "actions" && formData.actions.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {formData.actions.length} {formData.actions.length === 1 ? "akcia" : "akcie"}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Trigger */}
            <TabsContent value="trigger" className="space-y-4 mt-4">
              <div>
                <Label className="text-base font-semibold">Kedy sa má flow spustiť?</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value: TriggerType) => handleTriggerChange(value)}
                >
                    <SelectTrigger className="bg-primary/10 border-primary/50 focus:border-primary">
                      <SelectValue>
                        {formData.trigger_type && (() => {
                          const triggerLabels: Record<string, string> = {
                            "new_message": "Nová správa v kanáli",
                            "mention": "@mention bota",
                            "keyword_match": "Správa obsahuje keyword",
                            "regex_match": "Správa zodpovedá regex",
                            "slash_command": "Slash command",
                            "member_join": "Nový člen (join server)",
                            "member_leave": "Člen odišiel (leave)",
                            "scheduled": "Naplánovaný čas",
                            "button_click": "Klik na button",
                            "select_menu": "Select menu",
                          };
                          return (
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="font-semibold">
                                {triggerLabels[formData.trigger_type] || formData.trigger_type}
                              </Badge>
                            </div>
                          );
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                  <SelectContent>
                    {triggerOptions.includes("new_message") && (
                      <SelectItem value="new_message">Nová správa v kanáli</SelectItem>
                    )}
                    {triggerOptions.includes("mention") && (
                      <SelectItem value="mention">@mention bota</SelectItem>
                    )}
                    {triggerOptions.includes("keyword_match") && (
                      <SelectItem value="keyword_match">Správa obsahuje keyword</SelectItem>
                    )}
                    {triggerOptions.includes("regex_match") && (
                      <SelectItem value="regex_match">Správa zodpovedá regex</SelectItem>
                    )}
                    {triggerOptions.includes("slash_command") && (
                      <SelectItem value="slash_command">Slash command</SelectItem>
                    )}
                    {triggerOptions.includes("member_join") && (
                      <SelectItem value="member_join">Nový člen (join server)</SelectItem>
                    )}
                    {triggerOptions.includes("member_leave") && (
                      <SelectItem value="member_leave">Člen odišiel (leave)</SelectItem>
                    )}
                    {triggerOptions.includes("scheduled") && (
                      <SelectItem value="scheduled">Naplánovaný čas</SelectItem>
                    )}
                    {triggerOptions.includes("button_click") && (
                      <SelectItem value="button_click">Klik na button</SelectItem>
                    )}
                    {triggerOptions.includes("select_menu") && (
                      <SelectItem value="select_menu">Select menu</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Konfigurácia triggeru podľa typu */}
              {formData.trigger_type === "keyword_match" && (
                <div>
                  <Label>Keywords (oddelené čiarkou)</Label>
                  <Input
                    value={formData.trigger_config.keywords || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trigger_config: {
                          ...formData.trigger_config,
                          keywords: e.target.value,
                        },
                      })
                    }
                    placeholder="cena, koľko stojí, price"
                  />
                </div>
              )}

              {formData.trigger_type === "regex_match" && (
                <div>
                  <Label>Regex pattern</Label>
                  <Input
                    value={formData.trigger_config.pattern || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trigger_config: {
                          ...formData.trigger_config,
                          pattern: e.target.value,
                        },
                      })
                    }
                    placeholder="/^cena.*$/i"
                  />
                </div>
              )}

              {formData.trigger_type === "slash_command" && (
                <div>
                  <Label>Názov commandu (bez /)</Label>
                  <Input
                    value={formData.trigger_config.command || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trigger_config: {
                          ...formData.trigger_config,
                          command: e.target.value,
                        },
                      })
                    }
                    placeholder="help"
                  />
                </div>
              )}

              {formData.trigger_type === "scheduled" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Typ plánovania</Label>
                    <Select
                      value={formData.trigger_config.schedule_type || "time"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          trigger_config: {
                            ...formData.trigger_config,
                            schedule_type: value,
                            // Reset other values when switching
                            time: value === "time" ? formData.trigger_config.time : undefined,
                            interval_minutes: value === "interval" ? formData.trigger_config.interval_minutes : undefined,
                          },
                        })
                      }
                    >
                      <SelectTrigger className="bg-primary/10 border-primary/50 focus:border-primary">
                        <SelectValue>
                          {formData.trigger_config.schedule_type && (
                            <Badge variant="default" className="font-semibold">
                              {formData.trigger_config.schedule_type === "time" ? "Konkrétny čas" : "Interval"}
                            </Badge>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time">Konkrétny čas (napr. 14:30 každý deň)</SelectItem>
                        <SelectItem value="interval">Interval (každých X minút/hodín)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.trigger_config.schedule_type === "interval" ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Interval (minúty)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.trigger_config.interval_minutes || "60"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              trigger_config: {
                                ...formData.trigger_config,
                                interval_minutes: parseInt(e.target.value) || 60,
                              },
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Príklady: 5 = každých 5 minút, 60 = každú hodinu, 1440 = každý deň
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>Čas (HH:MM)</Label>
                        <Input
                          type="time"
                          value={formData.trigger_config.time || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              trigger_config: {
                                ...formData.trigger_config,
                                time: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Dni v týždni (voliteľné - prázdne = každý deň)</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {["Po", "Ut", "St", "Št", "Pi", "So", "Ne"].map((day, idx) => (
                            <Badge
                              key={idx}
                              variant={
                                formData.trigger_config.days?.includes(idx + 1)
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer"
                              onClick={() => {
                                const days = formData.trigger_config.days || [];
                                const newDays = days.includes(idx + 1)
                                  ? days.filter((d: number) => d !== idx + 1)
                                  : [...days, idx + 1];
                                setFormData({
                                  ...formData,
                                  trigger_config: {
                                    ...formData.trigger_config,
                                    days: newDays,
                                  },
                                });
                              }}
                            >
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Conditions */}
            <TabsContent value="conditions" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded-lg">
                Podmienky sú voliteľné. Ak nič nenastavíš, flow sa spustí vždy, keď sa trigger aktivuje.
              </div>

              <div>
                <Label className="text-base font-semibold">Povolené kanály</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Prázdne = všetky kanály
                </p>
                {!selectedGuildId && (
                  <div className="mb-2">
                    <GuildSelect
                      botId={botId}
                      value={selectedGuildId}
                      onValueChange={(value) => {
                        setSelectedGuildId(value);
                      }}
                      label="Najprv vyber server"
                      required
                    />
                  </div>
                )}
                {selectedGuildId && (
                  <div className="space-y-2">
                    <ChannelSelect
                      botId={botId}
                      guildId={selectedGuildId}
                      value={
                        Array.isArray(formData.conditions.channels) && formData.conditions.channels.length > 0
                          ? formData.conditions.channels[0]
                          : ""
                      }
                      onValueChange={(value) => {
                        const channels = value ? [value] : [];
                        setFormData({
                          ...formData,
                          conditions: {
                            ...formData.conditions,
                            channels,
                          },
                        });
                      }}
                      label="Vyber kanál"
                    />
                    {Array.isArray(formData.conditions.channels) && formData.conditions.channels.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.conditions.channels.map((channelId, idx) => (
                          <Badge key={idx} variant="secondary" className="font-mono text-xs">
                            {channelId.substring(0, 10)}...
                            <button
                              type="button"
                              onClick={() => {
                                const newChannels = formData.conditions.channels.filter((_: any, i: number) => i !== idx);
                                setFormData({
                                  ...formData,
                                  conditions: {
                                    ...formData.conditions,
                                    channels: newChannels,
                                  },
                                });
                              }}
                              className="ml-2 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-base font-semibold">Ignorované kanály</Label>
                {selectedGuildId && (
                  <div className="space-y-2 mt-2">
                    <ChannelSelect
                      botId={botId}
                      guildId={selectedGuildId}
                      value={
                        Array.isArray(formData.conditions.ignored_channels) && formData.conditions.ignored_channels.length > 0
                          ? formData.conditions.ignored_channels[0]
                          : ""
                      }
                      onValueChange={(value) => {
                        const ignored_channels = value ? [value] : [];
                        setFormData({
                          ...formData,
                          conditions: {
                            ...formData.conditions,
                            ignored_channels,
                          },
                        });
                      }}
                      label="Vyber kanál na ignorovanie"
                    />
                    {Array.isArray(formData.conditions.ignored_channels) && formData.conditions.ignored_channels.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.conditions.ignored_channels.map((channelId, idx) => (
                          <Badge key={idx} variant="destructive" className="font-mono text-xs">
                            {channelId.substring(0, 10)}...
                            <button
                              type="button"
                              onClick={() => {
                                const newChannels = formData.conditions.ignored_channels.filter((_, i) => i !== idx);
                                setFormData({
                                  ...formData,
                                  conditions: {
                                    ...formData.conditions,
                                    ignored_channels: newChannels,
                                  },
                                });
                              }}
                              className="ml-2 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!selectedGuildId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Najprv vyber server v "Povolené kanály"
                  </p>
                )}
              </div>

              <div>
                <Label>Požadované roly (Role IDs, jeden na riadok)</Label>
                <Textarea
                  value={
                    Array.isArray(formData.conditions.require_roles)
                      ? formData.conditions.require_roles.join("\n")
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        require_roles: e.target.value
                          .split("\n")
                          .map((v) => v.trim())
                          .filter((v) => v),
                      },
                    })
                  }
                  placeholder="123456789012345678"
                  rows={3}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  User musí mať aspoň jednu z týchto rolí
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="admin-only"
                  checked={formData.conditions.admin_only || false}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        admin_only: checked,
                      },
                    })
                  }
                />
                <Label htmlFor="admin-only">Len admin/mod roly</Label>
              </div>

              <div>
                <Label>Cooldown (sekundy)</Label>
                <Input
                  type="number"
                  value={formData.conditions.cooldown_seconds || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        cooldown_seconds: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder="30"
                />
              </div>

              <div>
                <Label className="text-base font-semibold">Cooldown per</Label>
                <Select
                  value={formData.conditions.cooldown_per || "user"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        cooldown_per: value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="bg-primary/10 border-primary/50 focus:border-primary">
                    <SelectValue>
                      {formData.conditions.cooldown_per && (() => {
                        const cooldownLabels: Record<string, string> = {
                          "user": "User",
                          "channel": "Channel",
                          "server": "Server",
                        };
                        return (
                          <Badge variant="secondary" className="font-semibold">
                            {cooldownLabels[formData.conditions.cooldown_per] || formData.conditions.cooldown_per}
                          </Badge>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="channel">Channel</SelectItem>
                    <SelectItem value="server">Server</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="once-per-user"
                  checked={formData.conditions.once_per_user || false}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        once_per_user: checked,
                      },
                    })
                  }
                />
                <Label htmlFor="once-per-user">Len raz na používateľa</Label>
              </div>
            </TabsContent>

            {/* TAB 3: Actions */}
            <TabsContent value="actions" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label>Akcie (čo bot spraví)</Label>
                  <p className="text-xs text-muted-foreground">
                    Môžeš pridať viacero akcií - vykonajú sa v poradí
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleActionAdd}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Pridať akciu
                </Button>
              </div>

              {formData.actions.map((action, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Akcia {index + 1}</CardTitle>
                      {formData.actions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleActionRemove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Typ akcie</Label>
                      <Select
                        value={action.type}
                        onValueChange={(value: ActionType) =>
                          handleActionChange(index, value)
                        }
                      >
                        <SelectTrigger className="bg-primary/10 border-primary/50 focus:border-primary">
                          <SelectValue>
                            {action.type && (() => {
                              const actionLabels: Record<string, string> = {
                                "send_message": "Poslať správu",
                                "send_embed": "Poslať embed",
                                "send_dm": "Poslať DM",
                                "ping_role": "Ping rolu",
                                "assign_role": "Pridať/odobrať rolu",
                                "create_thread": "Vytvoriť thread",
                                "pin_message": "Pripnúť správu",
                                "delete_message": "Vymazať správu",
                                "send_buttons": "Poslať buttony",
                                "send_select_menu": "Poslať select menu",
                                "open_modal": "Otvoriť modal",
                                "save_to_db": "Uložiť do DB",
                                "notify_admin": "Notifikovať admina",
                                "ai_response": "AI odpoveď",
                              };
                              return (
                                <Badge variant="default" className="font-semibold">
                                  {actionLabels[action.type] || action.type}
                                </Badge>
                              );
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {getActionOptions().map((actionType) => (
                            <SelectItem key={actionType} value={actionType}>
                              {actionType === "send_message" && "Poslať správu"}
                              {actionType === "send_embed" && "Poslať embed"}
                              {actionType === "send_dm" && "Poslať DM"}
                              {actionType === "ping_role" && "Ping rolu"}
                              {actionType === "assign_role" && "Pridať/odobrať rolu"}
                              {actionType === "create_thread" && "Vytvoriť thread"}
                              {actionType === "pin_message" && "Pripnúť správu"}
                              {actionType === "delete_message" && "Vymazať správu"}
                              {actionType === "send_buttons" && "Poslať buttony"}
                              {actionType === "send_select_menu" && "Poslať select menu"}
                              {actionType === "open_modal" && "Otvoriť modal"}
                              {actionType === "save_to_db" && "Uložiť do DB"}
                              {actionType === "notify_admin" && "Notifikovať admina"}
                              {actionType === "ai_response" && "AI odpoveď"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Konfigurácia akcie podľa typu */}
                    {action.type === "send_message" && (
                      <div className="space-y-4">
                        <div>
                          <Label>Text správy</Label>
                          <Textarea
                            value={action.config.text || ""}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.text = e.target.value;
                              setFormData({ ...formData, actions: newActions });
                            }}
                            rows={4}
                            placeholder="Text správy..."
                          />
                        </div>
                        {(module === "scheduled" || module === "welcome") && (
                          <div className="space-y-2">
                            <GuildSelect
                              botId={botId}
                              value={selectedGuildId}
                              onValueChange={(value) => {
                                setSelectedGuildId(value);
                                // Reset channel when guild changes
                                const newActions = [...formData.actions];
                                newActions[index].config.channel_id = "";
                                newActions[index].config.guild_id = value;
                                setFormData({ ...formData, actions: newActions });
                              }}
                              label="Server"
                              required
                            />
                            {selectedGuildId && (
                              <ChannelSelect
                                botId={botId}
                                guildId={selectedGuildId}
                                value={action.config.channel_id || ""}
                                onValueChange={(value) => {
                                  const newActions = [...formData.actions];
                                  newActions[index].config.channel_id = value;
                                  setFormData({ ...formData, actions: newActions });
                                }}
                                label="Kanál (kde sa má správa odoslať)"
                                required
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {action.type === "ai_response" && (
                      <div className="space-y-4">
                        <div>
                          <Label>AI Persona (voliteľné)</Label>
                          <Textarea
                            value={action.config.persona || ""}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.persona = e.target.value;
                              setFormData({ ...formData, actions: newActions });
                            }}
                            rows={3}
                            placeholder="Popíš, kým má bot byť..."
                          />
                        </div>
                        <div>
                          <Label>Max tokens</Label>
                          <Input
                            type="number"
                            value={action.config.max_tokens || 300}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.max_tokens = parseInt(
                                e.target.value
                              ) || 300;
                              setFormData({ ...formData, actions: newActions });
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {action.type === "send_embed" && (
                      <div className="space-y-4">
                        <div>
                          <Label>Nadpis (Title)</Label>
                          <Input
                            value={action.config.title || ""}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.title = e.target.value;
                              setFormData({ ...formData, actions: newActions });
                            }}
                            placeholder="Nadpis embedu"
                          />
                        </div>
                        <div>
                          <Label>Popis (Description)</Label>
                          <Textarea
                            value={action.config.description || ""}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.description = e.target.value;
                              setFormData({ ...formData, actions: newActions });
                            }}
                            rows={4}
                            placeholder="Popis embedu..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Farba (hex, napr. #5865F2)</Label>
                            <Input
                              value={action.config.color || ""}
                              onChange={(e) => {
                                const newActions = [...formData.actions];
                                newActions[index].config.color = e.target.value;
                                setFormData({ ...formData, actions: newActions });
                              }}
                              placeholder="#5865F2"
                              className="font-mono text-sm"
                            />
                          </div>
                          <div>
                            <Label>Obrázok URL (voliteľné)</Label>
                            <Input
                              value={action.config.image_url || ""}
                              onChange={(e) => {
                                const newActions = [...formData.actions];
                                newActions[index].config.image_url = e.target.value;
                                setFormData({ ...formData, actions: newActions });
                              }}
                              placeholder="https://example.com/image.png"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Footer text (voliteľné)</Label>
                          <Input
                            value={action.config.footer || ""}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.footer = e.target.value;
                              setFormData({ ...formData, actions: newActions });
                            }}
                            placeholder="Footer text"
                          />
                        </div>
                      </div>
                    )}

                    {action.type === "send_buttons" && (
                      <div className="space-y-4">
                        <div>
                          <Label>Text správy (voliteľné, nad buttonmi)</Label>
                          <Textarea
                            value={action.config.message || ""}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.message = e.target.value;
                              setFormData({ ...formData, actions: newActions });
                            }}
                            rows={2}
                            placeholder="Text, ktorý sa zobrazí nad buttonmi..."
                          />
                        </div>
                        <div>
                          <Label>Buttons (max 5)</Label>
                          <div className="space-y-2 mt-2">
                            {(action.config.buttons || []).map((btn: any, btnIndex: number) => (
                              <div key={btnIndex} className="flex gap-2 items-center p-2 border rounded">
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                  <Input
                                    placeholder="Label (text na button)"
                                    value={btn.label || ""}
                                    onChange={(e) => {
                                      const newActions = [...formData.actions];
                                      const buttons = [...(newActions[index].config.buttons || [])];
                                      buttons[btnIndex] = { ...buttons[btnIndex], label: e.target.value };
                                      newActions[index].config.buttons = buttons;
                                      setFormData({ ...formData, actions: newActions });
                                    }}
                                  />
                                  <Input
                                    placeholder="ID (unique)"
                                    value={btn.id || ""}
                                    onChange={(e) => {
                                      const newActions = [...formData.actions];
                                      const buttons = [...(newActions[index].config.buttons || [])];
                                      buttons[btnIndex] = { ...buttons[btnIndex], id: e.target.value };
                                      newActions[index].config.buttons = buttons;
                                      setFormData({ ...formData, actions: newActions });
                                    }}
                                    className="font-mono text-sm"
                                  />
                                  <Select
                                    value={btn.style || "primary"}
                                    onValueChange={(value) => {
                                      const newActions = [...formData.actions];
                                      const buttons = [...(newActions[index].config.buttons || [])];
                                      buttons[btnIndex] = { ...buttons[btnIndex], style: value };
                                      newActions[index].config.buttons = buttons;
                                      setFormData({ ...formData, actions: newActions });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="primary">Primary (modrá)</SelectItem>
                                      <SelectItem value="secondary">Secondary (šedá)</SelectItem>
                                      <SelectItem value="success">Success (zelená)</SelectItem>
                                      <SelectItem value="danger">Danger (červená)</SelectItem>
                                      <SelectItem value="link">Link (šedá, bez okraja)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newActions = [...formData.actions];
                                    const buttons = [...(newActions[index].config.buttons || [])];
                                    buttons.splice(btnIndex, 1);
                                    newActions[index].config.buttons = buttons;
                                    setFormData({ ...formData, actions: newActions });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            {(action.config.buttons || []).length < 5 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newActions = [...formData.actions];
                                  const buttons = [...(newActions[index].config.buttons || []), { id: "", label: "", style: "primary" }];
                                  newActions[index].config.buttons = buttons;
                                  setFormData({ ...formData, actions: newActions });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Pridať button
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            💡 Button ID sa použije pri interakcii - môžeš vytvoriť ďalší flow s trigger "button_click" a týmto ID
                          </p>
                        </div>
                      </div>
                    )}

                    {action.type === "send_select_menu" && (
                      <div className="space-y-4">
                        <div>
                          <Label>Text správy (voliteľné, nad menu)</Label>
                          <Textarea
                            value={action.config.message || ""}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.message = e.target.value;
                              setFormData({ ...formData, actions: newActions });
                            }}
                            rows={2}
                            placeholder="Text, ktorý sa zobrazí nad select menu..."
                          />
                        </div>
                        <div>
                          <Label>Menu ID (unique identifier)</Label>
                          <Input
                            value={action.config.menu_id || ""}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.menu_id = e.target.value;
                              setFormData({ ...formData, actions: newActions });
                            }}
                            placeholder="language_select"
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <Label>Placeholder text</Label>
                          <Input
                            value={action.config.placeholder || ""}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.placeholder = e.target.value;
                              setFormData({ ...formData, actions: newActions });
                            }}
                            placeholder="Vyber jazyk..."
                          />
                        </div>
                        <div>
                          <Label>Options (max 25)</Label>
                          <div className="space-y-2 mt-2">
                            {(action.config.options || []).map((opt: any, optIndex: number) => (
                              <div key={optIndex} className="flex gap-2 items-center p-2 border rounded">
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                  <Input
                                    placeholder="Label (text)"
                                    value={opt.label || ""}
                                    onChange={(e) => {
                                      const newActions = [...formData.actions];
                                      const options = [...(newActions[index].config.options || [])];
                                      options[optIndex] = { ...options[optIndex], label: e.target.value };
                                      newActions[index].config.options = options;
                                      setFormData({ ...formData, actions: newActions });
                                    }}
                                  />
                                  <Input
                                    placeholder="Value (ID)"
                                    value={opt.value || ""}
                                    onChange={(e) => {
                                      const newActions = [...formData.actions];
                                      const options = [...(newActions[index].config.options || [])];
                                      options[optIndex] = { ...options[optIndex], value: e.target.value };
                                      newActions[index].config.options = options;
                                      setFormData({ ...formData, actions: newActions });
                                    }}
                                    className="font-mono text-sm"
                                  />
                                  <Input
                                    placeholder="Description (voliteľné)"
                                    value={opt.description || ""}
                                    onChange={(e) => {
                                      const newActions = [...formData.actions];
                                      const options = [...(newActions[index].config.options || [])];
                                      options[optIndex] = { ...options[optIndex], description: e.target.value };
                                      newActions[index].config.options = options;
                                      setFormData({ ...formData, actions: newActions });
                                    }}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newActions = [...formData.actions];
                                    const options = [...(newActions[index].config.options || [])];
                                    options.splice(optIndex, 1);
                                    newActions[index].config.options = options;
                                    setFormData({ ...formData, actions: newActions });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            {(action.config.options || []).length < 25 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newActions = [...formData.actions];
                                  const options = [...(newActions[index].config.options || []), { label: "", value: "", description: "" }];
                                  newActions[index].config.options = options;
                                  setFormData({ ...formData, actions: newActions });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Pridať option
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            💡 Value sa použije pri interakcii - môžeš vytvoriť ďalší flow s trigger "select_menu" a týmto menu_id
                          </p>
                        </div>
                      </div>
                    )}

                    {action.type === "open_modal" && (
                      <div className="space-y-4">
                        <div>
                          <Label>Modal ID (unique identifier)</Label>
                          <Input
                            value={action.config.modal_id || ""}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.modal_id = e.target.value;
                              setFormData({ ...formData, actions: newActions });
                            }}
                            placeholder="event_application"
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <Label>Modal title</Label>
                          <Input
                            value={action.config.title || ""}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.title = e.target.value;
                              setFormData({ ...formData, actions: newActions });
                            }}
                            placeholder="Prihláška na event"
                          />
                        </div>
                        <div>
                          <Label>Input fields (max 5)</Label>
                          <div className="space-y-2 mt-2">
                            {(action.config.inputs || []).map((input: any, inputIndex: number) => (
                              <div key={inputIndex} className="p-3 border rounded space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Label"
                                    value={input.label || ""}
                                    onChange={(e) => {
                                      const newActions = [...formData.actions];
                                      const inputs = [...(newActions[index].config.inputs || [])];
                                      inputs[inputIndex] = { ...inputs[inputIndex], label: e.target.value };
                                      newActions[index].config.inputs = inputs;
                                      setFormData({ ...formData, actions: newActions });
                                    }}
                                  />
                                  <Input
                                    placeholder="ID (unique per modal)"
                                    value={input.id || ""}
                                    onChange={(e) => {
                                      const newActions = [...formData.actions];
                                      const inputs = [...(newActions[index].config.inputs || [])];
                                      inputs[inputIndex] = { ...inputs[inputIndex], id: e.target.value };
                                      newActions[index].config.inputs = inputs;
                                      setFormData({ ...formData, actions: newActions });
                                    }}
                                    className="font-mono text-sm"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Select
                                    value={input.style || "short"}
                                    onValueChange={(value) => {
                                      const newActions = [...formData.actions];
                                      const inputs = [...(newActions[index].config.inputs || [])];
                                      inputs[inputIndex] = { ...inputs[inputIndex], style: value };
                                      newActions[index].config.inputs = inputs;
                                      setFormData({ ...formData, actions: newActions });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="short">Short (jednoriadkové)</SelectItem>
                                      <SelectItem value="paragraph">Paragraph (viacriadkové)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={input.required || false}
                                      onChange={(e) => {
                                        const newActions = [...formData.actions];
                                        const inputs = [...(newActions[index].config.inputs || [])];
                                        inputs[inputIndex] = { ...inputs[inputIndex], required: e.target.checked };
                                        newActions[index].config.inputs = inputs;
                                        setFormData({ ...formData, actions: newActions });
                                      }}
                                      className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <Label className="text-xs">Required</Label>
                                  </div>
                                </div>
                                <Input
                                  placeholder="Placeholder (voliteľné)"
                                  value={input.placeholder || ""}
                                  onChange={(e) => {
                                    const newActions = [...formData.actions];
                                    const inputs = [...(newActions[index].config.inputs || [])];
                                    inputs[inputIndex] = { ...inputs[inputIndex], placeholder: e.target.value };
                                    newActions[index].config.inputs = inputs;
                                    setFormData({ ...formData, actions: newActions });
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newActions = [...formData.actions];
                                    const inputs = [...(newActions[index].config.inputs || [])];
                                    inputs.splice(inputIndex, 1);
                                    newActions[index].config.inputs = inputs;
                                    setFormData({ ...formData, actions: newActions });
                                  }}
                                  className="w-full"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Odstrániť field
                                </Button>
                              </div>
                            ))}
                            {(action.config.inputs || []).length < 5 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newActions = [...formData.actions];
                                  const inputs = [...(newActions[index].config.inputs || []), { label: "", id: "", style: "short", required: false }];
                                  newActions[index].config.inputs = inputs;
                                  setFormData({ ...formData, actions: newActions });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Pridať input field
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            💡 Modal sa otvorí, keď užívateľ klikne na button. Odpoveď sa zachytí v flow s trigger "modal_submit" a týmto modal_id
                          </p>
                        </div>
                      </div>
                    )}

                    {action.type === "assign_role" && (
                      <div className="space-y-2">
                        <Label>Role ID</Label>
                        <Input
                          value={action.config.role_id || ""}
                          onChange={(e) => {
                            const newActions = [...formData.actions];
                            newActions[index].config.role_id = e.target.value;
                            setFormData({ ...formData, actions: newActions });
                          }}
                          placeholder="123456789012345678"
                          className="font-mono text-sm"
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={action.config.remove || false}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index].config.remove = e.target.checked;
                              setFormData({ ...formData, actions: newActions });
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label className="text-sm">Odstrániť rolu namiesto pridania</Label>
                        </div>
                      </div>
                    )}

                    {action.type === "send_dm" && (
                      <div>
                        <Label>Text správy</Label>
                        <Textarea
                          value={action.config.text || ""}
                          onChange={(e) => {
                            const newActions = [...formData.actions];
                            newActions[index].config.text = e.target.value;
                            setFormData({ ...formData, actions: newActions });
                          }}
                          rows={4}
                          placeholder="Text správy do DM..."
                        />
                      </div>
                    )}

                    {action.type === "ping_role" && (
                      <div className="space-y-2">
                        <Label>Role ID</Label>
                        <Input
                          value={action.config.role_id || ""}
                          onChange={(e) => {
                            const newActions = [...formData.actions];
                            newActions[index].config.role_id = e.target.value;
                            setFormData({ ...formData, actions: newActions });
                          }}
                          placeholder="123456789012345678"
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Bot pingne túto rolu v odpovedi
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>

        <div className="border-t p-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Zrušiť
          </Button>
          <Button type="button" onClick={handleSave}>Uložiť flow</Button>
        </div>
      </Card>
    </div>
  );
}

