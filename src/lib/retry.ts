// Freshly minted Supabase tokens can carry an `iat` a second or two ahead of the
// server clock, which makes the first authenticated call fail with
// "JWT issued at future". These failures clear on their own, so retry briefly.
const TRANSIENT = [
  "jwt issued at future",
  "failed to fetch",
  "network",
  "load failed",
  "503",
  "502",
];

export function isTransientError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  return TRANSIENT.some((m) => message.includes(m));
}

export async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientError(error) || i === attempts - 1) throw error;
      await new Promise((r) => setTimeout(r, 400 * 2 ** i));
    }
  }
  throw lastError;
}
