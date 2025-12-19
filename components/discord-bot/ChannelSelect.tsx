"use client";

import { useDiscordChannels, clearChannelsCache } from "./useDiscordChannels";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ChannelSelectProps {
  botId: string;
  guildId: string | null;
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function ChannelSelect({
  botId,
  guildId,
  value,
  onValueChange,
  label,
  placeholder = "Vyber kanál...",
  required = false,
}: ChannelSelectProps) {
  const { channels, loading, error } = useDiscordChannels(botId, guildId);
  
  // Debug logging
  console.log("ChannelSelect render:", { 
    botId, 
    guildId,
    channelsLength: channels?.length || 0, 
    channels,
    loading, 
    error,
    isArray: Array.isArray(channels),
    condition: channels && Array.isArray(channels) && channels.length > 0
  });

  return (
    <div>
      {label && <Label>{label}{required && " *"}</Label>}
      {loading ? (
        <div className="p-2 text-sm text-muted-foreground">Načítavam kanály...</div>
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
            <p>Chyba pri načítaní kanálov: {error}</p>
          )}
        </div>
      ) : !guildId ? (
        <div className="p-2 text-sm text-muted-foreground">
          Najprv vyber server
        </div>
      ) : channels && Array.isArray(channels) && channels.length > 0 ? (
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel) => {
              const displayName = channel.parent
                ? `${channel.parent.name} / #${channel.name}`
                : `#${channel.name}`;
              return (
                <SelectItem key={channel.id} value={channel.id}>
                  {displayName}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      ) : (
        <div className="p-2 text-sm text-muted-foreground border rounded-md bg-muted/50">
          <p className="mb-2">Žiadne kanály sa nenašli.</p>
          <p className="text-xs mb-2">Skontroluj:</p>
          <ul className="text-xs list-disc list-inside space-y-1 mb-2">
            <li>Či má bot oprávnenia na zobrazenie kanálov</li>
            <li>Či sú na serveri textové kanály</li>
          </ul>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Clearing cache and refetching channels for bot:", botId, "guild:", guildId);
              clearChannelsCache(botId, guildId);
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

