/**
 * Cache en memoire, partage par toutes les requetes du serveur.
 *
 * Sans lui, afficher le portefeuille declenche plus de cent appels aux API
 * Google a chaque rafraichissement de page. Le cache est volontairement
 * simple : il disparait au redemarrage, ce qui suffit pour un outil interne.
 */
type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();

export async function cached<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;

  const value = await compute();
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  return value;
}

export function clearCache() {
  store.clear();
}