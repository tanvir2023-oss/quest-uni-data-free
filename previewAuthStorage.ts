/** Standard browser storage for Supabase Auth. Kept as a small adapter so the rest of the app stays unchanged. */
export function brokeredPreviewStorage(): Storage {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  const memory = new Map<string, string>();
  return {
    get length() { return memory.size; },
    clear() { memory.clear(); },
    getItem(key: string) { return memory.get(key) ?? null; },
    key(index: number) { return [...memory.keys()][index] ?? null; },
    removeItem(key: string) { memory.delete(key); },
    setItem(key: string, value: string) { memory.set(key, value); },
  } as Storage;
}
