export function safeHttpsUrl(value?: string | null, fallback = ""): string {
  if (!value) return fallback;
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return url.toString();
  } catch {
    return fallback;
  }
  return fallback;
}
