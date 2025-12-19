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
const REFETCH_TRIGGERS = new Map<string, number>();

// Function to clear cache for a specific bot (can be called from components)
export function clearGuildsCache(botId: string | null) {
  if (botId) {
    guildsCache.delete(botId);
    LOADING_PROMISES.delete(botId);
    // Increment refetch trigger to force re-fetch
    const current = REFETCH_TRIGGERS.get(botId) || 0;
    REFETCH_TRIGGERS.set(botId, current + 1);
  } else {
    guildsCache.clear();
    LOADING_PROMISES.clear();
    REFETCH_TRIGGERS.clear();
  }
}

export function useDiscordGuilds(botId: string | null) {
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Watch for refetch triggers
  useEffect(() => {
    if (!botId) return;
    
    const checkRefetch = () => {
      const trigger = REFETCH_TRIGGERS.get(botId) || 0;
      setRefetchKey(trigger);
    };
    
    // Check immediately
    checkRefetch();
    
    // Check periodically (every 100ms) for refetch triggers
    const interval = setInterval(checkRefetch, 100);
    return () => clearInterval(interval);
  }, [botId]);

  useEffect(() => {
    if (!botId) {
      setGuilds([]);
      setError(null);
      return;
    }

    // Get refetch trigger to force re-fetch when cache is cleared
    const refetchTrigger = REFETCH_TRIGGERS.get(botId) || 0;
    const shouldIgnoreCache = refetchTrigger > 0;

    // Check cache first (but ignore cache if refetch was triggered or cache is empty)
    const cached = guildsCache.get(botId);
    const hasValidCache = cached && 
      Date.now() - cached.timestamp < CACHE_DURATION && 
      !shouldIgnoreCache &&
      cached.data.length > 0; // Only use cache if it has data
    
    if (hasValidCache) {
      console.log("Using cached guilds:", cached.data.length); // Debug log
      setGuilds(cached.data);
      setError(null);
      setLoading(false);
      return;
    }

    // Set loading state
    setLoading(true);
    setError(null);
    
    // Check if there's already a loading promise for this botId
    const existingPromise = LOADING_PROMISES.get(botId);
    if (existingPromise) {
      existingPromise
        .then((data) => {
          setGuilds(data);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          // Ignore abort errors
          if (err.name === 'AbortError') {
            return;
          }
          setError(err instanceof Error ? err.message : "Unknown error");
          setGuilds([]);
          setLoading(false);
        });
      return;
    }

    // Create new loading promise
    const loadGuilds = async (): Promise<DiscordGuild[]> => {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(`/api/discord-bot/${botId}/guilds`, {
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          // Handle rate limit specifically - check status first
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After") || "1";
            const errorMessage = `Discord API rate limit. Skús to znova za ${retryAfter} sekúnd.`;
            throw new Error(errorMessage);
          }
          
          // For other errors, try to get error message from response
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          const errorMessage = errorData.error || `HTTP ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Guilds API response (raw):", JSON.stringify(data, null, 2)); // Debug log
        
        // Handle both formats: { guilds: [...] } and direct array
        const guildsArray = data.guilds || (Array.isArray(data) ? data : []);
        console.log("Guilds array parsed:", guildsArray, "Length:", guildsArray?.length); // Debug log
        
        if (Array.isArray(guildsArray)) {
          console.log(`Caching ${guildsArray.length} guilds for bot ${botId}`); // Debug log
          // Only cache if we have data (empty arrays should not be cached to allow retries)
          if (guildsArray.length > 0) {
            guildsCache.set(botId, {
              data: guildsArray,
              timestamp: Date.now(),
            });
          }
          return guildsArray; // Return the array so promise resolves with it
        } else {
          console.error("Invalid guilds data format:", data);
          throw new Error("Invalid guilds data format");
        }
      } catch (err: any) {
        // Ignore abort errors (they will be caught by cleanup)
        if (err.name === 'AbortError') {
          throw err;
        }
        throw err;
      }
    };

    const promise = loadGuilds()
      .then((guildsArray) => {
        console.log("Promise resolved with guilds:", guildsArray?.length || 0, guildsArray); // Debug log
        if (!guildsArray || guildsArray.length === 0) {
          console.warn("Warning: Received empty guilds array from API");
        }
        setGuilds(guildsArray);
        setError(null);
        setLoading(false);
        LOADING_PROMISES.delete(botId); // Clean up after successful resolution
        return guildsArray;
      })
      .catch((err) => {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          LOADING_PROMISES.delete(botId); // Clean up even on abort
          return [];
        }
        setError(err instanceof Error ? err.message : "Unknown error");
        setGuilds([]);
        setLoading(false);
        LOADING_PROMISES.delete(botId); // Clean up after error
        return [];
      });
    
    LOADING_PROMISES.set(botId, promise as Promise<DiscordGuild[]>);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [botId, refetchKey]);

  return { guilds, loading, error };
}

