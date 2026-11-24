import { useCallback, useEffect, useState } from "react";
import { DATA_URL } from "../lib/chart/data-url";
import { getNamadaSupply } from "../lib/chart/helpers";
import type { NamadaRawData } from "../lib/chart/types";

export function useNamadaSupply() {
  const [data, setData] = useState<NamadaRawData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getNamadaSupply(DATA_URL.namadaSupplyUrl, controller.signal)
      .then(setData)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setData([]);
        setError(reason instanceof Error ? reason.message : "Unable to load supply data");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  return { data, loading, error, retry };
}
