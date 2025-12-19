import { useState, useEffect, useRef } from "react";

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
}

// Global cache for guilds (persists across component mounts)
const guildsCache = new Map<string, { data: DiscordGuild[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const LOADING_PROMISES = new Map<string, Promise<DiscordGuild[]>>();

export function useDiscordGuilds(botId: string | null) {
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!botId) {
      setGuilds([]);
      setError(null);
      return;
    }

    // Check cache first
    const cached = guildsCache.get(botId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setGuilds(cached.data);
      setError(null);
      setLoading(false);
      return;
    }

    // Check if there's already a loading promise for this botId
    const existingPromise = LOADING_PROMISES.get(botId);
    if (existingPromise) {
      setLoading(true);
      existingPromise
        .then((data) => {
          setGuilds(data);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Unknown error");
          setGuilds([]);
          setLoading(false);
        });
      return;
    }

    // Create new loading promise
    const loadGuilds = async () => {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/discord-bot/${botId}/guilds`, {
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          // Handle rate limit specifically - check status first
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After") || "1";
            const errorMessage = `Discord API rate limit. Skús to znova za ${retryAfter} sekúnd.`;
            setError(errorMessage);
            setGuilds([]);
            LOADING_PROMISES.delete(botId);
            return;
          }
          
          // For other errors, try to get error message from response
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          const errorMessage = errorData.error || `HTTP ${response.status}`;
          setError(errorMessage);
          setGuilds([]);
          LOADING_PROMISES.delete(botId);
          return;
        }

        const data = await response.json();
        if (data.guilds && Array.isArray(data.guilds)) {
          // Cache the result
          guildsCache.set(botId, {
            data: data.guilds,
            timestamp: Date.now(),
          });
          setGuilds(data.guilds);
          setError(null);
        } else {
          setError("Invalid guilds data");
          setGuilds([]);
        }
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err.message : "Unknown error");
        setGuilds([]);
      } finally {
        setLoading(false);
        LOADING_PROMISES.delete(botId);
      }
    };

    const promise = loadGuilds();
    LOADING_PROMISES.set(botId, promise);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [botId]);

  return { guilds, loading, error };
}

