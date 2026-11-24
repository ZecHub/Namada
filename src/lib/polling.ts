/** Runs one poll at a time and aborts the in-flight request on cleanup. */
export function pollSequentially(
  task: (signal: AbortSignal) => Promise<void>,
  intervalMs: number,
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  const run = async () => {
    controller = new AbortController();
    try {
      await task(controller.signal);
    } catch {
      // A failed poll should not prevent the next scheduled attempt.
    } finally {
      if (!stopped) timer = setTimeout(run, intervalMs);
    }
  };

  void run();
  return () => {
    stopped = true;
    if (timer !== undefined) clearTimeout(timer);
    controller?.abort();
  };
}
