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
const REFETCH_TRIGGERS = new Map<string, number>();

// Function to clear cache for a specific bot+guild (can be called from components)
export function clearChannelsCache(botId: string | null, guildId: string | null) {
  if (botId && guildId) {
    const cacheKey = `${botId}:${guildId}`;
    channelsCache.delete(cacheKey);
    LOADING_PROMISES.delete(cacheKey);
    // Increment refetch trigger to force re-fetch
    const current = REFETCH_TRIGGERS.get(cacheKey) || 0;
    REFETCH_TRIGGERS.set(cacheKey, current + 1);
  } else if (botId) {
    // Clear all channels for this bot
    for (const key of channelsCache.keys()) {
      if (key.startsWith(`${botId}:`)) {
        channelsCache.delete(key);
        LOADING_PROMISES.delete(key);
        const current = REFETCH_TRIGGERS.get(key) || 0;
        REFETCH_TRIGGERS.set(key, current + 1);
      }
    }
  } else {
    channelsCache.clear();
    LOADING_PROMISES.clear();
    REFETCH_TRIGGERS.clear();
  }
}

export function useDiscordChannels(botId: string | null, guildId: string | null) {
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cacheKey = botId && guildId ? `${botId}:${guildId}` : null;

  // Watch for refetch triggers
  useEffect(() => {
    if (!cacheKey) return;
    
    const checkRefetch = () => {
      const trigger = REFETCH_TRIGGERS.get(cacheKey) || 0;
      setRefetchKey(trigger);
    };
    
    // Check immediately
    checkRefetch();
    
    // Check periodically (every 100ms) for refetch triggers
    const interval = setInterval(checkRefetch, 100);
    return () => clearInterval(interval);
  }, [cacheKey]);

  useEffect(() => {
    if (!botId || !guildId) {
      setChannels([]);
      setError(null);
      return;
    }

    const cacheKey = `${botId}:${guildId}`;
    
    // Get refetch trigger to force re-fetch when cache is cleared
    const refetchTrigger = REFETCH_TRIGGERS.get(cacheKey) || 0;
    const shouldIgnoreCache = refetchTrigger > 0;
    
    // Check cache first (but ignore cache if refetch was triggered or cache is empty)
    const cached = channelsCache.get(cacheKey);
    const hasValidCache = cached && 
      Date.now() - cached.timestamp < CACHE_DURATION && 
      !shouldIgnoreCache &&
      cached.data.length > 0; // Only use cache if it has data
    
    if (hasValidCache) {
      console.log("Using cached channels:", cached.data.length); // Debug log
      setChannels(cached.data);
      setError(null);
      setLoading(false);
      return;
    }

    // Set loading state
    setLoading(true);
    setError(null);

    // Check if there's already a loading promise for this key
    const existingPromise = LOADING_PROMISES.get(cacheKey);
    if (existingPromise) {
      existingPromise
        .then((data) => {
          setChannels(data);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          // Ignore abort errors
          if (err.name === 'AbortError') {
            return;
          }
          setError(err instanceof Error ? err.message : "Unknown error");
          setChannels([]);
          setLoading(false);
        });
      return;
    }

    // Create new loading promise
    const loadChannels = async (): Promise<DiscordChannel[]> => {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

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
            LOADING_PROMISES.delete(cacheKey);
            throw new Error(errorMessage);
          }
          
          // For other errors, try to get error message from response
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          const errorMessage = errorData.error || `HTTP ${response.status}`;
          LOADING_PROMISES.delete(cacheKey);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Channels API response (raw):", JSON.stringify(data, null, 2)); // Debug log
        
        // Handle both formats: { channels: [...] } and direct array
        const channelsArray = data.channels || (Array.isArray(data) ? data : []);
        console.log("Channels array parsed:", channelsArray, "Length:", channelsArray?.length); // Debug log
        
        if (Array.isArray(channelsArray)) {
          console.log(`Caching ${channelsArray.length} channels for ${cacheKey}`); // Debug log
          // Cache the result
          channelsCache.set(cacheKey, {
            data: channelsArray,
            timestamp: Date.now(),
          });
          return channelsArray; // Return the array so promise resolves with it
        } else {
          console.error("Invalid channels data format:", data);
          throw new Error("Invalid channels data format");
        }
      } catch (err: any) {
        // Ignore abort errors (they will be caught by cleanup)
        if (err.name === 'AbortError') {
          throw err;
        }
        throw err;
      }
    };

    const promise = loadChannels()
      .then((channelsArray) => {
        console.log("Promise resolved with channels:", channelsArray?.length || 0, channelsArray); // Debug log
        if (!channelsArray || channelsArray.length === 0) {
          console.warn("Warning: Received empty channels array from API");
        }
        setChannels(channelsArray);
        setError(null);
        setLoading(false);
        LOADING_PROMISES.delete(cacheKey); // Clean up after successful resolution
        return channelsArray;
      })
      .catch((err) => {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          LOADING_PROMISES.delete(cacheKey); // Clean up even on abort
          return;
        }
        setError(err instanceof Error ? err.message : "Unknown error");
        setChannels([]);
        setLoading(false);
        LOADING_PROMISES.delete(cacheKey); // Clean up after error
        throw err;
      });
    
    LOADING_PROMISES.set(cacheKey, promise);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [botId, guildId, refetchKey]);

  // Debug log on every render
  useEffect(() => {
    console.log("useDiscordChannels state:", { 
      botId, 
      guildId,
      cacheKey,
      channelsCount: channels?.length || 0, 
      loading, 
      error,
      refetchKey 
    });
  }, [botId, guildId, cacheKey, channels, loading, error, refetchKey]);

  return { channels, loading, error };
}

