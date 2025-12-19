"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Users,
  Hash,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { ChannelSelect } from "./ChannelSelect";
import { GuildSelect } from "./GuildSelect";

export interface EventConfig {
  name: string;
  enabled: boolean;
  
  // KROK 1: Základné info
  eventTitle: string;
  eventDescription: string;
  eventDate: string; // ISO date string
  eventTime: string; // HH:MM format
  timezone: string;
  
  // KROK 2: Detaily
  maxPlayers: number;
  voiceChannel: string; // Voice channel name or link
  channelId: string; // Where to post the event
  
  // KROK 3: Buttons (RSVP)
  enableRSVP: boolean;
  showJoinButton: boolean;
  showMaybeButton: boolean;
  showLeaveButton: boolean;
  showSettingsButton: boolean;
}

interface EventWizardProps {
  botId: string;
  initialConfig?: EventConfig;
  onSave: (config: EventConfig) => void;
  onCancel: () => void;
}

export function EventWizard({ botId, initialConfig, onSave, onCancel }: EventWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<EventConfig>(
    initialConfig || {
      name: "Nový event",
      enabled: true,
      eventTitle: "",
      eventDescription: "",
      eventDate: new Date().toISOString().split('T')[0],
      eventTime: "19:00",
      timezone: "CET",
      maxPlayers: 10,
      voiceChannel: "",
      guildId: "",
      channelId: "",
      enableRSVP: true,
      showJoinButton: true,
      showMaybeButton: true,
      showLeaveButton: true,
      showSettingsButton: false,
    }
  );

  const handleSave = () => {
    if (!config.name.trim()) {
      alert("Zadaj názov eventu");
      return;
    }
    
    if (!config.eventTitle.trim()) {
      alert("Zadaj názov eventu");
      return;
    }
    
    if (!config.guildId.trim()) {
      alert("Vyber server");
      return;
    }
    if (!config.channelId.trim()) {
      alert("Vyber kanál");
      return;
    }
    
    onSave(config);
  };

  const steps = [
    { number: 1, title: "Základné info" },
    { number: 2, title: "Detaily" },
    { number: 3, title: "RSVP buttons" },
    { number: 4, title: "Prehľad" },
  ];

  const progress = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Vytvoriť event</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              {steps.map((s) => (
                <div key={s.number} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      step >= s.number
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.number}
                  </div>
                  {step === s.number && (
                    <span className="text-foreground font-medium">{s.title}</span>
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* KROK 1: Základné info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Názov eventu (v dashboarde)</Label>
                <Input
                  value={config.name}
                  onChange={(e) =>
                    setConfig({ ...config, name: e.target.value })
                  }
                  placeholder="LOL Cup - 28.02."
                />
              </div>
              
              <div>
                <Label>Názov eventu (v Discorde)</Label>
                <Input
                  value={config.eventTitle}
                  onChange={(e) =>
                    setConfig({ ...config, eventTitle: e.target.value })
                  }
                  placeholder="LOL Cup - 28.02."
                />
              </div>

              <div>
                <Label>Popis eventu</Label>
                <Textarea
                  value={config.eventDescription}
                  onChange={(e) =>
                    setConfig({ ...config, eventDescription: e.target.value })
                  }
                  rows={4}
                  placeholder="Popíš, čo sa bude diať..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dátum</Label>
                  <Input
                    type="date"
                    value={config.eventDate}
                    onChange={(e) =>
                      setConfig({ ...config, eventDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Čas</Label>
                  <Input
                    type="time"
                    value={config.eventTime}
                    onChange={(e) =>
                      setConfig({ ...config, eventTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Časové pásmo</Label>
                <Input
                  value={config.timezone}
                  onChange={(e) =>
                    setConfig({ ...config, timezone: e.target.value })
                  }
                  placeholder="CET"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Napr. CET, UTC, EST...
                </p>
              </div>
            </div>
          )}

          {/* KROK 2: Detaily */}
          {step === 2 && (
            <div className="space-y-4">
              <GuildSelect
                botId={botId}
                value={config.guildId}
                onValueChange={(value) => {
                  setConfig({ ...config, guildId: value, channelId: "" }); // Reset channel when guild changes
                }}
                label="Server"
                required
              />
              {config.guildId && (
                <ChannelSelect
                  botId={botId}
                  guildId={config.guildId}
                  value={config.channelId}
                  onValueChange={(value) =>
                    setConfig({ ...config, channelId: value })
                  }
                  label="Kanál (kde sa má event postnúť)"
                  required
                />
              )}

              <div>
                <Label>Max počet hráčov/účastníkov</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.maxPlayers}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxPlayers: parseInt(e.target.value) || 10,
                    })
                  }
                />
              </div>

              <div>
                <Label>Voice channel (názov alebo link)</Label>
                <Input
                  value={config.voiceChannel}
                  onChange={(e) =>
                    setConfig({ ...config, voiceChannel: e.target.value })
                  }
                  placeholder="lol-cup alebo #lol-cup"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Názov voice kanála alebo link (zobrazí sa v embede)
                </p>
              </div>
            </div>
          )}

          {/* KROK 3: RSVP buttons */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enable-rsvp"
                  checked={config.enableRSVP}
                  onChange={(e) =>
                    setConfig({ ...config, enableRSVP: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="enable-rsvp">
                  Povoliť RSVP (Join/Maybe/Leave buttons)
                </Label>
              </div>

              {config.enableRSVP && (
                <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="join-btn"
                      checked={config.showJoinButton}
                      onChange={(e) =>
                        setConfig({ ...config, showJoinButton: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="join-btn">✅ Join button</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="maybe-btn"
                      checked={config.showMaybeButton}
                      onChange={(e) =>
                        setConfig({ ...config, showMaybeButton: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="maybe-btn">❓ Maybe button</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="leave-btn"
                      checked={config.showLeaveButton}
                      onChange={(e) =>
                        setConfig({ ...config, showLeaveButton: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="leave-btn">❌ Leave button</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="settings-btn"
                      checked={config.showSettingsButton}
                      onChange={(e) =>
                        setConfig({ ...config, showSettingsButton: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="settings-btn">⚙️ Settings button (voliteľné)</Label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KROK 4: Prehľad */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div>
                  <span className="text-sm font-semibold">Názov:</span>{" "}
                  <span className="text-sm">{config.name}</span>
                </div>
                <div>
                  <span className="text-sm font-semibold">Event:</span>{" "}
                  <span className="text-sm">{config.eventTitle}</span>
                </div>
                <div>
                  <span className="text-sm font-semibold">Dátum a čas:</span>{" "}
                  <span className="text-sm">
                    {config.eventDate} {config.eventTime} ({config.timezone})
                  </span>
                </div>
                <div>
                  <span className="text-sm font-semibold">Max hráčov:</span>{" "}
                  <span className="text-sm">{config.maxPlayers}</span>
                </div>
                {config.voiceChannel && (
                  <div>
                    <span className="text-sm font-semibold">Voice channel:</span>{" "}
                    <span className="text-sm">{config.voiceChannel}</span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-semibold">RSVP:</span>{" "}
                  <span className="text-sm">
                    {config.enableRSVP
                      ? `Join: ${config.showJoinButton ? "✅" : "❌"}, Maybe: ${config.showMaybeButton ? "✅" : "❌"}, Leave: ${config.showLeaveButton ? "✅" : "❌"}`
                      : "Vypnuté"}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Poznámka:</strong> Event sa vytvorí ako embed s
                  buttons. Po kliknutí na button sa použije RSVP systém.
                </p>
              </div>
            </div>
          )}

          {/* Navigácia */}
          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Späť
            </Button>
            {step < steps.length ? (
              <Button onClick={() => setStep(step + 1)}>
                Ďalej
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Uložiť event
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

