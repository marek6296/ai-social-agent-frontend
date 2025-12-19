"use client";

import { useDiscordChannels } from "./useDiscordChannels";
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
      ) : (
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {channels && Array.isArray(channels) && channels.length > 0 ? (
              channels.map((channel) => {
                const displayName = channel.parent
                  ? `${channel.parent.name} / #${channel.name}`
                  : `#${channel.name}`;
                return (
                  <SelectItem key={channel.id} value={channel.id}>
                    {displayName}
                  </SelectItem>
                );
              })
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                Žiadne kanály sa nenašli
              </div>
            )}
          </SelectContent>
        </Select>
      )}
      {channels && Array.isArray(channels) && channels.length === 0 && !loading && !error && guildId && (
        <p className="text-xs text-muted-foreground mt-1">
          Žiadne kanály sa nenašli
        </p>
      )}
    </div>
  );
}

