import { google } from "googleapis";
import { googleAuth } from "@/lib/google";
import { cached } from "@/lib/cache";
import type { Client, DateRange, Metric, PageRow } from "@/types";

const EMPTY: Metric = { clicks: 0, impressions: 0, position: 0 };

/**
 * Performance page par page sur une période.
 *
 * On ne demande jamais les totaux du site séparément : ils se déduisent de
 * cette liste, ce qui divise par deux le nombre d'appels à l'API.
 */
export async function pageMetrics(client: Client, range: DateRange): Promise<PageRow[]> {
  const key = `gsc:${client.id}:${range.start}:${range.end}`;

  return cached(key, 3600, async () => {
    const api = google.searchconsole({ version: "v1", auth: googleAuth() });
    const rows: PageRow[] = [];
    let startRow = 0;

    // L'API renvoie 25 000 lignes au maximum par appel : on pagine jusqu'à épuisement.
    while (true) {
      const res = await api.searchanalytics.query({
        siteUrl: client.gscProperty,
        requestBody: {
          startDate: range.start,
          endDate: range.end,
          dimensions: ["page"],
          rowLimit: 25000,
          startRow,
          type: "web",
        },
      });

      const batch = res.data.rows ?? [];
      for (const row of batch) {
        const url = row.keys?.[0];
        if (!url) continue;
        rows.push({
          url,
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0,
          position: row.position ?? 0,
        });
      }

      if (batch.length < 25000) break;
      startRow += batch.length;
    }

    return rows;
  });
}

/**
 * Agrège des pages en une métrique unique.
 * La position moyenne est pondérée par les impressions : une page vue 100 000 fois
 * pèse davantage qu'une page vue trois fois.
 */
export function totals(rows: PageRow[]): Metric {
  if (rows.length === 0) return EMPTY;

  let clicks = 0;
  let impressions = 0;
  let weighted = 0;

  for (const row of rows) {
    clicks += row.clicks;
    impressions += row.impressions;
    weighted += row.position * row.impressions;
  }

  return {
    clicks,
    impressions,
    position: impressions > 0 ? weighted / impressions : 0,
  };
}

export function byUrl(rows: PageRow[]): Map<string, PageRow> {
  return new Map(rows.map((r) => [r.url, r]));
}

export const EMPTY_METRIC = EMPTY;