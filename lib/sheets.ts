import { google } from "googleapis";
import { googleAuth } from "@/lib/google";
import { cached } from "@/lib/cache";
import { CONTENT_SHEET } from "@/config/content";

export type Article = {
  path: string;
  url: string;
  title: string;
  status: string;
};

/** Retire le protocole, le www et la barre finale, pour comparer deux domaines. */
export function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^sc-domain:/, "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

/**
 * Normalise un chemin pour que Search Console et le Sheet se rapprochent :
 * minuscules, barre initiale, pas de barre finale, pas de parametres,
 * et accents decodes car le Sheet melange les deux formes.
 */
export function normalizePath(url: string): string {
  let path = url.trim();

  try {
    path = new URL(path).pathname;
  } catch {
    path = path.replace(/^https?:\/\/[^/]+/, "");
  }

  try {
    path = decodeURIComponent(path);
  } catch {
    // URL mal encodee : on garde la version brute plutot que d'echouer.
  }

  return path
    .toLowerCase()
    .replace(/\/{2,}/g, "/")
    .replace(/[?#].*$/, "")
    .replace(/\/$/, "")
    .replace(/^(?!\/)/, "/");
}

/**
 * Tous les articles produits, regroupes par domaine.
 * Les doublons sont ecartes : le Sheet en contient plusieurs dizaines.
 */
export async function articlesByDomain(): Promise<Map<string, Map<string, Article>>> {
  return cached("sheet:articles", 3600, async () => {
    const res = await google
      .sheets({ version: "v4", auth: googleAuth() })
      .spreadsheets.values.get({
        spreadsheetId: CONTENT_SHEET.spreadsheetId,
        range: CONTENT_SHEET.range,
      });

    const { url: iUrl, status: iStatus, title: iTitle } = CONTENT_SHEET.columns;
    const byDomain = new Map<string, Map<string, Article>>();

    for (const row of res.data.values ?? []) {
      const raw = String(row[iUrl] ?? "").trim();
      if (!raw.startsWith("http")) continue;

      const domain = normalizeDomain(raw);
      const path = normalizePath(raw);
      if (!domain || !path) continue;

      if (!byDomain.has(domain)) byDomain.set(domain, new Map());
      byDomain.get(domain)!.set(path, {
        path,
        url: raw,
        title: String(row[iTitle] ?? "").trim(),
        status: String(row[iStatus] ?? "").trim(),
      });
    }

    return byDomain;
  });
}