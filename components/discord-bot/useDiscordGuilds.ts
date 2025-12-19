import { useState, useEffect } from "react";

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
}

export function useDiscordGuilds(botId: string | null) {
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!botId) {
      setGuilds([]);
      return;
    }

    const loadGuilds = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/discord-bot/${botId}/guilds`);

        if (!response.ok) {
          // Handle rate limit specifically - check status first
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After") || "1";
            setError(`Discord API rate limit. Skús to znova za ${retryAfter} sekúnd.`);
            setGuilds([]);
            return;
          }
          
          // For other errors, try to get error message from response
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          setError(errorData.error || `HTTP ${response.status}`);
          setGuilds([]);
          return;
        }

        const data = await response.json();
        if (data.guilds && Array.isArray(data.guilds)) {
          setGuilds(data.guilds);
        } else {
          setError("Invalid guilds data");
          setGuilds([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setGuilds([]);
      } finally {
        setLoading(false);
      }
    };

    loadGuilds();
  }, [botId]);

  return { guilds, loading, error };
}

