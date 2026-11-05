"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiClientError } from "@/lib/client";

export type Resource<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
  setData: (updater: T | null | ((prev: T | null) => T | null)) => void;
  status: number | null;
};

/**
 * Client-side fetcher with credentials, abort handling, error surfacing and manual refresh.
 * Every list/detail page uses this so loading and error states are consistent everywhere.
 */
export function useFetch<T>(url: string | null, deps: unknown[] = []): Resource<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [status, setStatus] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api<T>(url, { signal: controller.signal })
      .then((res) => {
        if (!mounted.current) return;
        setDataState(res);
        setStatus(200);
      })
      .catch((e: unknown) => {
        if (!mounted.current) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setStatus(e instanceof ApiClientError ? e.status : 0);
        setError(e instanceof Error ? e.message : "Could not load this data.");
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, nonce, ...deps]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((updater: T | null | ((prev: T | null) => T | null)) => {
    setDataState((prev) => (typeof updater === "function" ? (updater as (p: T | null) => T | null)(prev) : updater));
  }, []);

  return { data, error, loading, reload, setData, status };
}

/** Mutation helper: tracks busy state and surfaces errors to the caller. */
export function useMutation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      const message = e instanceof Error ? e.message : "The request failed.";
      setError(message);
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, run, setError };
}
