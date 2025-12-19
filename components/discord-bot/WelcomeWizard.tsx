"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Mail,
  Hash,
  UserPlus,
  Settings,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelSelect } from "./ChannelSelect";
import { GuildSelect } from "./GuildSelect";

export interface WelcomeConfig {
  name: string;
  enabled: boolean;
  
  // KROK 2: Kde
  sendToChannel: boolean;
  guildId: string;
  channelId: string;
  sendDM: boolean;
  dmMessage: string;
  
  // Pre koho
  allMembers: boolean;
  requireRole: string;
  ignoreRole: string;
  
  // KROK 3: Čo
  actions: Array<{
    type: "message" | "role" | "buttons";
    config: any;
  }>;
  
  // KROK 4: Obmedzenia (voliteľné)
  onlyOnce: boolean;
  cooldownSeconds: number;
}

interface WelcomeWizardProps {
  botId: string;
  initialConfig?: WelcomeConfig;
  onSave: (config: WelcomeConfig) => void;
  onCancel: () => void;
}

export function WelcomeWizard({ botId, initialConfig, onSave, onCancel }: WelcomeWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<WelcomeConfig>(
    initialConfig || {
      name: "Welcome správa",
      enabled: true,
      sendToChannel: true,
      guildId: "",
      channelId: "",
      sendDM: false,
      dmMessage: "",
      allMembers: true,
      requireRole: "",
      ignoreRole: "",
      actions: [],
      onlyOnce: false,
      cooldownSeconds: 0,
    }
  );

  const handleSave = () => {
    if (!config.name.trim()) {
      alert("Zadaj názov scenára");
      return;
    }
    
    if (!config.sendToChannel && !config.sendDM) {
      alert("Vyber aspoň jeden spôsob, kam sa má správa poslať");
      return;
    }
    
    if (config.sendToChannel && !config.guildId.trim()) {
      alert("Vyber server");
      return;
    }
    if (config.sendToChannel && !config.channelId.trim()) {
      alert("Vyber kanál");
      return;
    }
    
    if (config.sendDM && !config.dmMessage.trim()) {
      alert("Zadaj text pre DM správu");
      return;
    }

    onSave(config);
  };

  const addAction = (type: "message" | "role" | "buttons") => {
    const newAction: any = { type, config: {} };
    
    if (type === "message") {
      newAction.config = { text: "", channelId: config.channelId || "" };
    } else if (type === "role") {
      newAction.config = { roleId: "" };
    } else if (type === "buttons") {
      newAction.config = { message: "", buttons: [] };
    }
    
    setConfig({
      ...config,
      actions: [...config.actions, newAction],
    });
  };

  const removeAction = (index: number) => {
    setConfig({
      ...config,
      actions: config.actions.filter((_, i) => i !== index),
    });
  };

  const updateAction = (index: number, updates: any) => {
    const newActions = [...config.actions];
    newActions[index] = {
      ...newActions[index],
      config: { ...newActions[index].config, ...updates },
    };
    setConfig({ ...config, actions: newActions });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-background">
        {/* Hlavička */}
        <CardHeader className="border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">👋 Welcome správa pre nových členov</CardTitle>
                  <CardDescription className="mt-1">
                    Keď nový člen vstúpi na server, bot ho privíta a vykoná nasledujúce akcie.
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, enabled: checked })
                    }
                  />
                  <Label className="text-sm font-medium">Scenár aktívny</Label>
                </div>
                
                <div className="flex-1">
                  <Input
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    placeholder="Názov scenára (len pre teba)"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {/* Progress steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    s === step
                      ? "bg-primary border-primary text-primary-foreground"
                      : s < step
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-muted border-muted-foreground/20 text-muted-foreground"
                  }`}
                >
                  {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                {s < 5 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      s < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* KROK 1: Kedy */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Kedy sa to stane?</h2>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UserPlus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Nový člen vstúpi na server</p>
                        <p className="text-sm text-muted-foreground">
                          Toto je automaticky nastavené pre Welcome modul
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* KROK 2: Kde a pre koho */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Kde sa má welcome správa poslať?</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      checked={config.sendToChannel}
                      onChange={() => setConfig({ ...config, sendToChannel: true })}
                      className="h-4 w-4"
                    />
                    <Hash className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Verejný kanál</p>
                      <p className="text-sm text-muted-foreground">
                        Správa sa zobrazí v kanáli pre všetkých
                      </p>
                    </div>
                  </label>

                  {config.sendToChannel && (
                    <div className="ml-8 space-y-2">
                      <Label>Channel ID</Label>
                      <Input
                        value={config.channelId}
                        onChange={(e) =>
                          setConfig({ ...config, channelId: e.target.value })
                        }
                        placeholder="123456789012345678"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Pravým klikom na kanál → Copy ID (Developer Mode musí byť zapnuté)
                      </p>
                    </div>
                  )}

                  <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      checked={config.sendDM}
                      onChange={() => setConfig({ ...config, sendDM: true })}
                      className="h-4 w-4"
                    />
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Súkromná správa (DM)</p>
                      <p className="text-sm text-muted-foreground">
                        Bot pošle správu priamo do DM
                      </p>
                    </div>
                  </label>

                  {config.sendDM && (
                    <div className="ml-8 space-y-2">
                      <Label>Text správy</Label>
                      <Textarea
                        value={config.dmMessage}
                        onChange={(e) =>
                          setConfig({ ...config, dmMessage: e.target.value })
                        }
                        rows={4}
                        placeholder="Vitaj na našom serveri, {user}!"
                      />
                      <p className="text-xs text-muted-foreground">
                        {"{user}"} sa nahradí za meno používateľa, {"{server}"} za názov servera
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">Platí pre:</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={config.allMembers}
                      onChange={(e) =>
                        setConfig({ ...config, allMembers: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <div>
                      <p className="font-medium">Všetkých nových členov</p>
                    </div>
                  </label>

                  <div className="space-y-2">
                    <Label>Vyžadovať rolu (voliteľné)</Label>
                    <Input
                      value={config.requireRole}
                      onChange={(e) =>
                        setConfig({ ...config, requireRole: e.target.value })
                      }
                      placeholder="Role ID - len členovia s touto rolou"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ignorovať rolu (voliteľné)</Label>
                    <Input
                      value={config.ignoreRole}
                      onChange={(e) =>
                        setConfig({ ...config, ignoreRole: e.target.value })
                      }
                      placeholder="Role ID - ignorovať členov s touto rolou"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KROK 3: Čo bot spraví */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Čo má bot spraviť?</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Môžeš pridať viacero akcií - vykonajú sa v poradí
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAction("message")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Správa
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAction("role")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Rola
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAction("buttons")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tlačidlá
                  </Button>
                </div>
              </div>

              {config.actions.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-12 pb-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      Zatiaľ nemáš žiadne akcie. Pridaj prvú akciu vyššie.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {config.actions.map((action, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{index + 1}</Badge>
                            <CardTitle className="text-base">
                              {action.type === "message" && "📨 Poslať správu"}
                              {action.type === "role" && "🏷️ Prideliť rolu"}
                              {action.type === "buttons" && "🔘 Poslať tlačidlá"}
                            </CardTitle>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAction(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {action.type === "message" && (
                          <>
                            <div>
                              <Label>Kanál</Label>
                              <Input
                                value={action.config.channelId || config.channelId}
                                onChange={(e) =>
                                  updateAction(index, { channelId: e.target.value })
                                }
                                placeholder="123456789012345678"
                                className="font-mono text-sm"
                              />
                            </div>
                            <div>
                              <Label>Obsah správy</Label>
                              <Textarea
                                value={action.config.text || ""}
                                onChange={(e) =>
                                  updateAction(index, { text: e.target.value })
                                }
                                rows={4}
                                placeholder="Vitaj {user} na našom serveri!"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                {"{user}"} = meno používateľa, {"{server}"} = názov servera
                              </p>
                            </div>
                          </>
                        )}

                        {action.type === "role" && (
                          <div>
                            <Label>Role ID</Label>
                            <Input
                              value={action.config.roleId || ""}
                              onChange={(e) =>
                                updateAction(index, { roleId: e.target.value })
                              }
                              placeholder="123456789012345678"
                              className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Rola sa pridá novému členovi
                            </p>
                          </div>
                        )}

                        {action.type === "buttons" && (
                          <div className="space-y-4">
                            <div>
                              <Label>Text nad buttonmi</Label>
                              <Textarea
                                value={action.config.message || ""}
                                onChange={(e) =>
                                  updateAction(index, { message: e.target.value })
                                }
                                rows={2}
                                placeholder="Prečítal si pravidlá?"
                              />
                            </div>
                            <div>
                              <Label>Buttons</Label>
                              <div className="space-y-2 mt-2">
                                {(action.config.buttons || []).map((btn: any, btnIndex: number) => (
                                  <div key={btnIndex} className="flex gap-2">
                                    <Input
                                      placeholder="Text na button (napr. 'Súhlasím')"
                                      value={btn.label || ""}
                                      onChange={(e) => {
                                        const buttons = [...(action.config.buttons || [])];
                                        buttons[btnIndex] = { ...buttons[btnIndex], label: e.target.value };
                                        updateAction(index, { buttons });
                                      }}
                                    />
                                    <Input
                                      placeholder="Button ID"
                                      value={btn.id || ""}
                                      onChange={(e) => {
                                        const buttons = [...(action.config.buttons || [])];
                                        buttons[btnIndex] = { ...buttons[btnIndex], id: e.target.value };
                                        updateAction(index, { buttons });
                                      }}
                                      className="font-mono text-sm w-40"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const buttons = [...(action.config.buttons || [])];
                                        buttons.splice(btnIndex, 1);
                                        updateAction(index, { buttons });
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
                                      const buttons = [...(action.config.buttons || []), { label: "", id: "" }];
                                      updateAction(index, { buttons });
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Pridať button
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* KROK 4: Obmedzenia (voliteľné) */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Rozšírené nastavenia</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Tieto nastavenia väčšina používateľov nepotrebuje
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Poslať len raz</Label>
                    <p className="text-sm text-muted-foreground">
                      Každý člen dostane welcome správu len raz
                    </p>
                  </div>
                  <Switch
                    checked={config.onlyOnce}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, onlyOnce: checked })
                    }
                  />
                </div>

                <div className="p-4 border rounded-lg">
                  <Label>Cooldown (sekundy)</Label>
                  <Input
                    type="number"
                    value={config.cooldownSeconds}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cooldownSeconds: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimálny čas medzi welcome správami (0 = bez obmedzenia)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* KROK 5: Prehľad */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-4">📌 Tento scenár:</h2>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Kedy sa spustí:</p>
                    <p className="mt-1">Keď nový člen vstúpi na server</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Kde sa pošle:</p>
                    <p className="mt-1">
                      {config.sendToChannel && config.channelId && "Verejný kanál"}
                      {config.sendToChannel && config.sendDM && " + "}
                      {config.sendDM && "Súkromná správa (DM)"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Platí pre:</p>
                    <p className="mt-1">
                      {config.allMembers ? "Všetkých nových členov" : "Konkrétne roly"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Akcie:</p>
                    <ul className="mt-2 space-y-1">
                      {config.actions.map((action, index) => (
                        <li key={index} className="text-sm">
                          {index + 1}.{" "}
                          {action.type === "message" && "📨 Poslať správu"}
                          {action.type === "role" && "🏷️ Prideliť rolu"}
                          {action.type === "buttons" && "🔘 Poslať tlačidlá"}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {config.onlyOnce && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Obmedzenia:</p>
                      <p className="mt-1 text-sm">Poslať len raz</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Späť
          </Button>

          <div className="flex gap-2">
            {step < 5 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
              >
                Ďalej
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSave}>
                Uložiť scenár
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

