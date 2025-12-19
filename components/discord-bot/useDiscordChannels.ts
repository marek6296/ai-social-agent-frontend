import { useState, useEffect, useRef } from "react";

interface DiscordChannel {
  id: string;
  name: string;
  type: "text" | "announcement";
  parent: {
    id: string;
    name: string;
  } | null;
}

// Global cache for channels (persists across component mounts)
const channelsCache = new Map<string, { data: DiscordChannel[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const LOADING_PROMISES = new Map<string, Promise<DiscordChannel[]>>();

export function useDiscordChannels(botId: string | null, guildId: string | null) {
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!botId || !guildId) {
      setChannels([]);
      setError(null);
      return;
    }

    const cacheKey = `${botId}:${guildId}`;
    
    // Check cache first
    const cached = channelsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setChannels(cached.data);
      setError(null);
      setLoading(false);
      return;
    }

    // Check if there's already a loading promise for this key
    const existingPromise = LOADING_PROMISES.get(cacheKey);
    if (existingPromise) {
      setLoading(true);
      existingPromise
        .then((data) => {
          setChannels(data);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Unknown error");
          setChannels([]);
          setLoading(false);
        });
      return;
    }

    // Create new loading promise
    const loadChannels = async () => {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/discord-bot/${botId}/channels?guild_id=${guildId}`,
          { signal: abortControllerRef.current.signal }
        );

        if (!response.ok) {
          // Handle rate limit specifically - check status first
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After") || "1";
            const errorMessage = `Discord API rate limit. Skús to znova za ${retryAfter} sekúnd.`;
            setError(errorMessage);
            setChannels([]);
            LOADING_PROMISES.delete(cacheKey);
            return;
          }
          
          // For other errors, try to get error message from response
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          const errorMessage = errorData.error || `HTTP ${response.status}`;
          setError(errorMessage);
          setChannels([]);
          LOADING_PROMISES.delete(cacheKey);
          return;
        }

        const data = await response.json();
        if (data.channels && Array.isArray(data.channels)) {
          // Cache the result
          channelsCache.set(cacheKey, {
            data: data.channels,
            timestamp: Date.now(),
          });
          setChannels(data.channels);
          setError(null);
        } else {
          setError("Invalid channels data");
          setChannels([]);
        }
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err.message : "Unknown error");
        setChannels([]);
      } finally {
        setLoading(false);
        LOADING_PROMISES.delete(cacheKey);
      }
    };

    const promise = loadChannels();
    LOADING_PROMISES.set(cacheKey, promise);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [botId, guildId]);

  return { channels, loading, error };
}

