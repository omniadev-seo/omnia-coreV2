type Entry = { value: Promise<unknown>; expiresAt: number };

const store = new Map<string, Entry>();

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as Promise<T>;

  const value = compute();
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });

  try {
    return await value;
  } catch (error) {
    // Une requête échouée ne doit pas rester en cache : sinon l'erreur se
    // rejoue à chaque appel jusqu'à expiration du délai.
    store.delete(key);
    throw error;
  }
}

export function clearCache() {
  store.clear();
}
