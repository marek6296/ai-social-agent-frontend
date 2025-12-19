"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { MessageTemplateBuilder, MessageTemplate } from "@/components/discord-bot/MessageTemplateBuilder";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
}

export default function NewTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;
  const [guildId, setGuildId] = useState("");
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Load available guilds from Discord
  const loadGuilds = async () => {
    if (!botId) return;
    
    setLoadingGuilds(true);
    setError(null);
    try {
      const response = await fetch(`/api/discord-bot/${botId}/guilds`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Error loading guilds:", response.status, errorData);
        
        let errorMessage = errorData.error || `HTTP ${response.status}`;
        
        if (response.status === 429) {
          // Try to get retry-after from response header or body
          const retryAfterHeader = response.headers.get("Retry-After");
          const retryAfterBody = errorData.retryAfter;
          const retryAfterValue = retryAfterHeader || retryAfterBody;
          
          if (retryAfterValue) {
            const seconds = parseInt(retryAfterValue, 10);
            setRetryAfter(seconds);
            errorMessage = `Discord API rate limit. Skús to znova za ${seconds} sekúnd.`;
          } else {
            // Try to extract from error message as fallback
            const retryMatch = errorMessage.match(/za (\d+) sekúnd/);
            if (retryMatch) {
              const seconds = parseInt(retryMatch[1], 10);
              setRetryAfter(seconds);
              errorMessage = `Discord API rate limit. Skús to znova za ${retryMatch[1]} sekúnd.`;
            } else {
              errorMessage = "Discord API rate limit. Prosím, skús to znova o chvíľu.";
              setRetryAfter(null);
            }
          }
        } else {
          setRetryAfter(null);
        }
        
        setError(errorMessage);
        setLoadingGuilds(false);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("Guilds response:", data);

      if (data.guilds && Array.isArray(data.guilds)) {
        setGuilds(data.guilds);
        setError(null);
        setRetryAfter(null);
        setCountdown(null);
        // If only one guild, auto-select it
        if (data.guilds.length === 1) {
          setGuildId(data.guilds[0].id);
        }
      } else {
        console.error("Invalid guilds data:", data);
        setError("Chyba: Neplatný formát dát zo servera");
        setRetryAfter(null);
      }
    } catch (error) {
      console.error("Error loading guilds:", error);
      setError(`Chyba pri načítaní serverov z Discordu: ${error instanceof Error ? error.message : "Neznáma chyba"}`);
      setRetryAfter(null);
    } finally {
      setLoadingGuilds(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuilds();
  }, [botId]);

  // Countdown timer for retry
  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      setCountdown(retryAfter);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setRetryAfter(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [retryAfter]);

  const handleSave = async (template: MessageTemplate) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Nie si prihlásený");
        return;
      }

      // Convert to database format
      const embedJson = template.pages[template.current_page_index]?.embed || {};
      const componentsJson = template.pages[template.current_page_index]?.components || {};
      
      const { data, error } = await supabase
        .from("discord_message_templates")
        .insert({
          owner_user_id: user.id,
          guild_id: template.guild_id || guildId,
          name: template.name,
          embed_json: embedJson,
          components_json: componentsJson,
          pages_json: template.pages,
          current_page_index: template.current_page_index,
          version: 1,
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/dashboard/discord-bot/${botId}/templates/${data.id}`);
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Chyba pri ukladaní template");
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/discord-bot/${botId}/templates`);
  };

  if (loading || loadingGuilds) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Načítavam servery z Discordu...</p>
        </CardContent>
      </Card>
    );
  }

  // If error occurred, show error with retry option
  if (error) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Chyba pri načítaní serverov</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          {error.includes("rate limit") && (
            <p className="text-xs text-muted-foreground">
              Discord API má obmedzenia na počet požiadaviek. Počkaj chvíľu a skús to znova.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Zrušiť
            </Button>
            <Button 
              onClick={() => {
                setError(null);
                setRetryAfter(null);
                setCountdown(null);
                loadGuilds();
              }}
              disabled={countdown !== null && countdown > 0}
            >
              {countdown !== null && countdown > 0 ? `Skúsiť znova (${countdown}s)` : "Skúsiť znova"}
            </Button>
          </div>
          {countdown !== null && countdown > 0 && (
            <p className="text-xs text-muted-foreground">
              Počkaj {countdown} sekúnd pred opätovným pokusom.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // If no guild selected, show selection form
  if (!guildId) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Vyber Discord Server</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vyber server, pre ktorý chceš vytvoriť template. Zobrazujú sa len servery, kde je bot pridaný.
          </p>
          <div>
            <label className="block text-sm font-medium mb-2">Server</label>
            <Select value={guildId} onValueChange={setGuildId}>
              <SelectTrigger>
                <SelectValue placeholder="Vyber server..." />
              </SelectTrigger>
              <SelectContent>
                {guilds.map((guild) => (
                  <SelectItem key={guild.id} value={guild.id}>
                    {guild.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {guilds.length === 0 && !loading && (
            <p className="text-sm text-destructive">
              Bot nie je pridaný na žiadny server. Najprv pridaj bota na Discord server.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Po výbere servera sa automaticky zobrazí template builder.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Zrušiť
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <MessageTemplateBuilder
      guildId={guildId}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

