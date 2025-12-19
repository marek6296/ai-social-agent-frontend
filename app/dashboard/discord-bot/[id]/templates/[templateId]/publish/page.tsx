"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Send, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DiscordChannel {
  id: string;
  name: string;
  type: "text" | "announcement";
  parent: {
    id: string;
    name: string;
  } | null;
}

export default function PublishTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<any>(null);
  const [guildId, setGuildId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishType, setPublishType] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  useEffect(() => {
    if (guildId) {
      loadChannels();
    }
  }, [guildId, botId]);

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("discord_message_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) throw error;
      setTemplate(data);
      // Set guild_id from template
      if (data.guild_id) {
        setGuildId(data.guild_id);
      }
    } catch (error) {
      console.error("Error loading template:", error);
      alert("Chyba pri načítaní template");
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    if (!guildId || !botId) return;

    setLoadingChannels(true);
    try {
      const response = await fetch(
        `/api/discord-bot/${botId}/channels?guild_id=${guildId}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Error loading channels:", response.status, errorData);
        
        let errorMessage = errorData.error || `HTTP ${response.status}`;
        
        if (response.status === 429) {
          errorMessage = "Discord API má rate limit. Počkaj chvíľu a skús to znova.";
        }
        
        alert(`Chyba pri načítaní kanálov: ${errorMessage}`);
        setLoadingChannels(false);
        return;
      }

      const data = await response.json();
      console.log("Channels response:", data);

      if (data.channels && Array.isArray(data.channels)) {
        setChannels(data.channels);
      } else {
        console.error("Invalid channels data:", data);
        alert("Chyba: Neplatný formát dát zo servera");
      }
    } catch (error) {
      console.error("Error loading channels:", error);
      alert(`Chyba pri načítaní kanálov z Discordu: ${error instanceof Error ? error.message : "Neznáma chyba"}`);
    } finally {
      setLoadingChannels(false);
    }
  };

  const handlePublish = async () => {
    if (!channelId.trim()) {
      alert("Vyber kanál");
      return;
    }

    if (publishType === "scheduled") {
      if (!scheduledDate || !scheduledTime) {
        alert("Zadaj dátum a čas pre naplánované odoslanie");
        return;
      }
      
      // Create scheduled flow
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime < new Date()) {
        alert("Naplánovaný dátum musí byť v budúcnosti");
        return;
      }

      setPublishing(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          alert("Nie si prihlásený");
          return;
        }

        // Create scheduled flow for template
        const { error: flowError } = await supabase
          .from("discord_bot_flows")
          .insert({
            bot_id: botId,
            module: "scheduled",
            name: `Scheduled: ${template?.name || "Template"}`,
            enabled: true,
            priority: 0,
            trigger_type: "scheduled",
            trigger_config: {
              schedule_type: "time",
              time: `${String(scheduledDateTime.getHours()).padStart(2, '0')}:${String(scheduledDateTime.getMinutes()).padStart(2, '0')}`,
              date: scheduledDateTime.toISOString().split('T')[0], // YYYY-MM-DD format
              days: null, // Send once
            },
            conditions: {},
            actions: [
              {
                type: "send_template",
                config: {
                  template_id: templateId,
                  channel_id: channelId.trim(),
                  bot_id: botId,
                },
              },
            ],
          });

        if (flowError) throw flowError;

        alert(`Template bol naplánovaný na ${scheduledDateTime.toLocaleString("sk-SK")}!`);
        router.push(`/dashboard/discord-bot/${botId}/templates`);
      } catch (error: any) {
        console.error("Error scheduling template:", error);
        alert(`Chyba pri naplánovaní: ${error.message}`);
      } finally {
        setPublishing(false);
      }
      return;
    }

    // Immediate publish
    setPublishing(true);
    try {
      const response = await fetch("/api/discord-bot/templates/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId,
          botId,
          channelId: channelId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Chyba pri publikovaní");
      }

      alert("Template bol úspešne publikovaný!");
      router.push(`/dashboard/discord-bot/${botId}/templates`);
    } catch (error: any) {
      console.error("Error publishing template:", error);
      alert(`Chyba pri publikovaní: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Načítavam template...</p>
        </CardContent>
      </Card>
    );
  }

  if (!template) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Template sa nenašiel</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link href={`/dashboard/discord-bot/${botId}/templates`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Späť na templates
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publikovať Template: {template.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Server</Label>
            <div className="p-2 bg-muted rounded-md text-sm">
              {template.guild_id || "Neznámy server"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Server je nastavený z template. Ak chceš zmeniť server, uprav template.
            </p>
          </div>

          <div>
            <Label>Kanál (kde sa má správa odoslať)</Label>
            {loadingChannels ? (
              <div className="p-2 text-sm text-muted-foreground">Načítavam kanály...</div>
            ) : (
              <Select value={channelId} onValueChange={setChannelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyber kanál..." />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => {
                    const displayName = channel.parent
                      ? `${channel.parent.name} / #${channel.name}`
                      : `#${channel.name}`;
                    const fullName = channel.type === "announcement"
                      ? `${displayName} (announcement)`
                      : displayName;
                    
                    return (
                      <SelectItem key={channel.id} value={channel.id}>
                        {fullName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
            {channels.length === 0 && !loadingChannels && (
              <p className="text-xs text-destructive mt-1">
                Žiadne kanály sa nenašli. Skontroluj, či má bot práva na zobrazenie kanálov.
              </p>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label className="text-base font-semibold">Kedy odoslať</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="publish-now"
                    name="publishType"
                    value="now"
                    checked={publishType === "now"}
                    onChange={(e) => setPublishType(e.target.value as "now" | "scheduled")}
                    className="h-4 w-4"
                  />
                  <label htmlFor="publish-now" className="flex items-center gap-2 cursor-pointer">
                    <Send className="h-4 w-4" />
                    <span>Okamžite</span>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="publish-scheduled"
                    name="publishType"
                    value="scheduled"
                    checked={publishType === "scheduled"}
                    onChange={(e) => setPublishType(e.target.value as "now" | "scheduled")}
                    className="h-4 w-4"
                  />
                  <label htmlFor="publish-scheduled" className="flex items-center gap-2 cursor-pointer">
                    <Clock className="h-4 w-4" />
                    <span>Naplánovať</span>
                  </label>
                </div>
              </div>
            </div>

            {publishType === "scheduled" && (
              <div className="space-y-4 pl-6 border-l-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dátum</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label>Čas</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
                {scheduledDate && scheduledTime && (
                  <p className="text-sm text-muted-foreground">
                    Template sa odošle: {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString("sk-SK")}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2">
              <Button 
                onClick={handlePublish} 
                disabled={publishing || !channelId || loadingChannels || (publishType === "scheduled" && (!scheduledDate || !scheduledTime))}
              >
                {publishType === "scheduled" ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    {publishing ? "Naplánovávam..." : "Naplánovať"}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {publishing ? "Publikujem..." : "Publikovať"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

