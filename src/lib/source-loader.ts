export type SourceStatus = "loading" | "success" | "empty" | "error" | "stale";

export type SourceState<T> = {
  status: SourceStatus;
  data: T | null;
  error: string | null;
  updatedAt: number | null;
};

export type SourceLoader<T> = (signal: AbortSignal) => Promise<T>;

export function createSourceState<T>(data: T | null = null): SourceState<T> {
  return { status: "loading", data, error: null, updatedAt: null };
}

export function isEmptyResult(value: unknown): boolean {
  if (Array.isArray(value)) {
    if (value.length === 0) return true;
    if (value.every((row) => row && typeof row === "object" && Array.isArray((row as { Proposal?: unknown }).Proposal))) {
      return value.every((row) => ((row as { Proposal: unknown[] }).Proposal).length === 0);
    }
    return false;
  }
  if (value && typeof value === "object" && Array.isArray((value as { rows?: unknown }).rows))
    return ((value as { rows: unknown[] }).rows).length === 0;
  return value == null;
}

export async function fetchJson<T>(
  url: string,
  signal: AbortSignal,
  validate: (value: unknown) => value is T,
): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);

  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new Error("Response was not valid JSON");
  }
  if (!validate(value)) throw new Error("Response data had an unexpected shape");
  return value;
}

export function sourceFailure<T>(
  previous: SourceState<T>,
  error: unknown,
): SourceState<T> {
  return {
    ...previous,
    status: previous.data === null ? "error" : "stale",
    error: error instanceof Error ? error.message : "Request failed",
  };
}

export function sourceSuccess<T>(data: T): SourceState<T> {
  return {
    status: isEmptyResult(data) ? "empty" : "success",
    data,
    error: null,
    updatedAt: Date.now(),
  };
}
import { useCallback, useEffect, useRef, useState } from "react";


export function useIndependentSources<T extends object>(
  loaders: { [K in keyof T]: SourceLoader<T[K]> },
) {
  type Key = keyof T;
  const [states, setStates] = useState<{ [K in Key]: SourceState<T[K]> }>(() =>
    Object.fromEntries(
      Object.keys(loaders).map((key) => [key, createSourceState()]),
    ) as { [K in Key]: SourceState<T[K]> },
  );
  const controllers = useRef(new Map<Key, AbortController>());
  const requests = useRef(new Map<Key, number>());
  const loaderRef = useRef(loaders);
  loaderRef.current = loaders;

  const load = useCallback(async (key: Key) => {
    if (controllers.current.has(key)) return;
    const controller = new AbortController();
    controllers.current.set(key, controller);
    const requestId = (requests.current.get(key) ?? 0) + 1;
    requests.current.set(key, requestId);
    setStates((current) => ({
      ...current,
      [key]: { ...current[key], status: "loading", error: null },
    }));
    try {
      const data = await loaderRef.current[key](controller.signal);
      if (requests.current.get(key) !== requestId) return;
      setStates((current) => ({ ...current, [key]: sourceSuccess(data) }));
    } catch (error) {
      if (requests.current.get(key) !== requestId || controller.signal.aborted)
        return;
      setStates((current) => ({
        ...current,
        [key]: sourceFailure(current[key], error),
      }));
    } finally {
      if (requests.current.get(key) === requestId) controllers.current.delete(key);
    }
  }, []);

  const retryFailed = useCallback(() => {
    for (const key of Object.keys(loaderRef.current) as Key[]) {
      if (states[key].status === "error" || states[key].status === "stale")
        void load(key);
    }
  }, [load, states]);

  useEffect(() => {
    for (const key of Object.keys(loaderRef.current) as Key[]) void load(key);
    const activeControllers = controllers.current;
    return () => {
      for (const controller of activeControllers.values()) controller.abort();
      activeControllers.clear();
    };
  }, [load]);

  return { states, retry: load, retryFailed };
}
