"use client";

import { useDiscordGuilds, clearGuildsCache } from "./useDiscordGuilds";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface GuildSelectProps {
  botId: string;
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function GuildSelect({
  botId,
  value,
  onValueChange,
  label,
  placeholder = "Vyber server...",
  required = false,
}: GuildSelectProps) {
  const { guilds, loading, error } = useDiscordGuilds(botId);
  
  // Debug logging
  console.log("GuildSelect render:", { 
    botId, 
    guildsLength: guilds?.length || 0, 
    guilds,
    loading, 
    error,
    isArray: Array.isArray(guilds),
    condition: guilds && Array.isArray(guilds) && guilds.length > 0
  });

  return (
    <div>
      {label && <Label>{label}{required && " *"}</Label>}
      {loading ? (
        <div className="p-2 text-sm text-muted-foreground">Načítavam servery...</div>
      ) : error ? (
        <div className="p-2 text-sm text-destructive border border-destructive/20 rounded-md bg-destructive/10">
          {error.includes("rate limit") ? (
            <div className="space-y-2">
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Obnoviť
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p>Chyba pri načítaní serverov: {error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Obnoviť
              </Button>
            </div>
          )}
        </div>
      ) : guilds && Array.isArray(guilds) && guilds.length > 0 ? (
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {guilds.map((guild) => (
              <SelectItem key={guild.id} value={guild.id}>
                {guild.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="p-2 text-sm text-muted-foreground border rounded-md bg-muted/50">
          <p className="mb-2">Bot nie je pridaný na žiadny server alebo sa servery nenašli.</p>
          <p className="text-xs mb-2">Skontroluj:</p>
          <ul className="text-xs list-disc list-inside space-y-1 mb-2">
            <li>Či je bot správne prihlásený s platným tokenom</li>
            <li>Či je bot pridaný na Discord server</li>
            <li>Či má bot oprávnenia na serveri</li>
          </ul>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Clearing cache and refetching for bot:", botId);
              clearGuildsCache(botId);
              // Force re-render by triggering state update - the useEffect will handle re-fetch
            }}
            className="w-full mt-2"
          >
            Obnoviť a načítať znova
          </Button>
        </div>
      )}
    </div>
  );
}

