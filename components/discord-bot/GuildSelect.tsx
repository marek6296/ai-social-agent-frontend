"use client";

import { useDiscordGuilds } from "./useDiscordGuilds";
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

  return (
    <div>
      {label && <Label>{label}{required && " *"}</Label>}
      {loading ? (
        <div className="p-2 text-sm text-muted-foreground">Načítavam servery...</div>
      ) : error ? (
        <div className="p-2 text-sm text-destructive">
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
            <p>Chyba pri načítaní serverov: {error}</p>
          )}
        </div>
      ) : (
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {guilds && Array.isArray(guilds) && guilds.length > 0 ? (
              guilds.map((guild) => (
                <SelectItem key={guild.id} value={guild.id}>
                  {guild.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                Žiadne servery sa nenašli
              </div>
            )}
          </SelectContent>
        </Select>
      )}
      {guilds && Array.isArray(guilds) && guilds.length === 0 && !loading && !error && (
        <p className="text-xs text-muted-foreground mt-1">
          Bot nie je pridaný na žiadny server
        </p>
      )}
    </div>
  );
}

