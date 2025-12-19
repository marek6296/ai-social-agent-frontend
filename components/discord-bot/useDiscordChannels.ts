import { useState, useEffect } from "react";

interface DiscordChannel {
  id: string;
  name: string;
  type: "text" | "announcement";
  parent: {
    id: string;
    name: string;
  } | null;
}

export function useDiscordChannels(botId: string | null, guildId: string | null) {
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!botId || !guildId) {
      setChannels([]);
      return;
    }

    const loadChannels = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/discord-bot/${botId}/channels?guild_id=${guildId}`
        );

        if (!response.ok) {
          // Handle rate limit specifically - check status first
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After") || "1";
            setError(`Discord API rate limit. Skús to znova za ${retryAfter} sekúnd.`);
            setChannels([]);
            return;
          }
          
          // For other errors, try to get error message from response
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          setError(errorData.error || `HTTP ${response.status}`);
          setChannels([]);
          return;
        }

        const data = await response.json();
        if (data.channels && Array.isArray(data.channels)) {
          setChannels(data.channels);
        } else {
          setError("Invalid channels data");
          setChannels([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [botId, guildId]);

  return { channels, loading, error };
}

