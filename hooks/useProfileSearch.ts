import { useState, useEffect } from "react";
import { supabase } from "../src/components/services/supabase";

export interface ProfileResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  similarity_score: number;
}

// Module-level cache survives re-renders but resets on full reload.
// Key is the lowercased trimmed query string.
const cache = new Map<string, ProfileResult[]>();

export function useProfileSearch(query: string) {
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();

    if (!q) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Serve from cache without hitting the network
    const cacheKey = q.toLowerCase();
    if (cache.has(cacheKey)) {
      setResults(cache.get(cacheKey)!);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // cancelled is set to true by the cleanup function.
    // It prevents state updates from a stale async callback
    // after the query has changed or the component has unmounted.
    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const { data, error: rpcError } = await supabase
          .rpc("search_profiles", { query: q, limit_count: 20 })
          .abortSignal(controller.signal);

        if (cancelled) return;

        if (rpcError) {
          // Supabase wraps AbortError in a PostgrestError; ignore it
          if (rpcError.code === "20" || rpcError.message?.toLowerCase().includes("abort")) return;
          throw new Error(rpcError.message);
        }

        const typed = (data ?? []) as ProfileResult[];
        cache.set(cacheKey, typed);
        setResults(typed);
      } catch (e: any) {
        if (cancelled || e.name === "AbortError") return;
        setError(e.message ?? "Search failed");
        setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);   // cancel debounce if query changes within 300ms
      controller.abort();    // cancel any in-flight Supabase request
    };
  }, [query]);

  return { results, loading, error };
}
