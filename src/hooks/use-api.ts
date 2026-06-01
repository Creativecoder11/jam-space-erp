"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface UseApiOptions<T> {
  url: string;
  initialData?: T;
  enabled?: boolean;
}

interface UseApiResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>({ url, initialData, enabled = true }: UseApiOptions<T>): UseApiResult<T> {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(url);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Request failed");
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url, enabled, trigger]);

  return {
    data,
    isLoading,
    error,
    refetch: () => setTrigger((t) => t + 1),
  };
}

export async function apiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });

    const result = await res.json();

    if (!res.ok) {
      return { error: result.error || "Request failed" };
    }

    return { data: result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }
}
