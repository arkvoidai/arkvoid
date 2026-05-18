export function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 10_000, message = 'Request timed out. Please try again.'): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  }) as Promise<T>;
}

export function toSafeErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}
