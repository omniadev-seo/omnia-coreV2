import { pageMetrics, totals } from "@/lib/gsc";
import { articleRevenue, articleRevenueTotal, revenueByLanding } from "@/lib/ga4";
import { articlesByDomain, normalizeDomain, normalizePath, type Article } from "@/lib/sheets";
import { ga4LastDays, ga4SinceStart, lastDays, previousDays, sinceStart } from "@/lib/dates";
import type { Client, ClientSummary, Metric, PageBreakdownRow, PageRow } from "@/types";

const EMPTY: Metric = { clicks: 0, impressions: 0, position: 0 };

type Aggregated = Metric & { url: string };

/**
 * Regroupe les variantes d'une meme page.
 *
 * Search Console compte separement l'URL avec et sans barre finale, celle avec
 * un parametre ?utm_source, et celle en majuscules. Sans regroupement, un seul
 * article apparait cinq fois et son CA semble multiplie d'autant.
 *
 * La position est ponderee par les impressions : une variante vue trois fois ne
 * doit pas peser autant que celle vue cent mille fois.
 */
function aggregate(rows: PageRow[]): Map<string, Aggregated> {
  const byPath = new Map<string, Aggregated & { weighted: number }>();

  for (const row of rows) {
    const path = normalizePath(row.url);
    const current = byPath.get(path);

    if (current) {
      current.clicks += row.clicks;
      current.impressions += row.impressions;
      current.weighted += row.position * row.impressions;
      // On garde l'URL la plus courte : c'est la forme canonique dans la
      // quasi-totalite des cas.
      if (row.url.length < current.url.length) current.url = row.url;
    } else {
      byPath.set(path, {
        url: row.url,
        clicks: row.clicks,
        impressions: row.impressions,
        position: 0,
        weighted: row.position * row.impressions,
      });
    }
  }

  const result = new Map<string, Aggregated>();
  for (const [path, value] of byPath) {
    result.set(path, {
      url: value.url,
      clicks: value.clicks,
      impressions: value.impressions,
      position: value.impressions > 0 ? value.weighted / value.impressions : 0,
    });
  }
  return result;
}

/** Les articles produits pour ce client, retrouves par domaine. */
async function articlesOf(client: Client): Promise<Map<string, Article>> {
  const all = await articlesByDomain();
  return all.get(normalizeDomain(client.domain)) ?? new Map();
}

function oursOnly(pages: Map<string, Aggregated>, articles: Map<string, Article>): PageRow[] {
  return [...pages.entries()]
    .filter(([path]) => articles.has(path))
    .map(([, value]) => value);
}

/** Metriques d'un client pour le portefeuille. */
export async function clientSummary(client: Client): Promise<ClientSummary> {
  const [current, previous, revenue, revenueTotal, articles] = await Promise.all([
    pageMetrics(client, lastDays(30)),
    pageMetrics(client, previousDays(30)),
    articleRevenue(client),
    articleRevenueTotal(client),
    articlesOf(client),
  ]);

  const now = aggregate(current);
  const before = aggregate(previous);
  const oursNow = oursOnly(now, articles);

  return {
    client,
    site: { ...totals([...now.values()]), previous: totals([...before.values()]) },
    articles: { ...totals(oursNow), previous: totals(oursOnly(before, articles)) },
    articleCount: oursNow.length,
    /** Produits selon le suivi, meme si Search Console ne les voit pas encore. */
    producedCount: articles.size,
    articlesCumulative: null,
    revenue,
    revenueTotal,
  };
}

/**
 * Detail page par page. On part du cumul et non des 30 derniers jours : une
 * page qui n'a rien fait ce mois-ci doit rester visible, c'est l'information utile.
 */
export async function pageBreakdown(client: Client): Promise<{
  rows: PageBreakdownRow[];
  truncated: boolean;
  capped: boolean;
  /** Articles produits que Search Console ne remonte pas : a verifier. */
  missing: Article[];
}> {
  const cumulRange = sinceStart(client.startDate);

  const [current, previous, cumulative, revenue30, revenueAll, articles] = await Promise.all([
    pageMetrics(client, lastDays(30)),
    pageMetrics(client, previousDays(30)),
    pageMetrics(client, cumulRange),
    revenueByLanding(client, ga4LastDays(30)),
    revenueByLanding(client, ga4SinceStart(client.startDate)),
    articlesOf(client),
  ]);

  const now = aggregate(current);
  const before = aggregate(previous);
  const cumul = aggregate(cumulative);
  const seen = new Set<string>();

  const rows: PageBreakdownRow[] = [...cumul.entries()].map(([path, total]) => {
    const article = articles.get(path);
    if (article) seen.add(path);

    const recent = now.get(path);

    return {
      url: total.url,
      path,
      isArticle: Boolean(article),
      title: article?.title || "",
      clicks: recent?.clicks ?? 0,
      impressions: recent?.impressions ?? 0,
      position: recent?.position ?? 0,
      previous: before.get(path) ?? EMPTY,
      cumulativeClicks: total.clicks,
      cumulativeImpressions: total.impressions,
      cumulativePosition: total.position,
      revenue: revenue30.size ? (revenue30.get(path) ?? 0) : null,
      revenueTotal: revenueAll.size ? (revenueAll.get(path) ?? 0) : null,
    };
  });

  rows.sort((a, b) => b.cumulativeClicks - a.cumulativeClicks);

  return {
    rows: rows.slice(0, 800),
    truncated: cumulRange.truncated,
    capped: rows.length > 800,
    missing: [...articles.values()].filter((a) => !seen.has(a.path)),
  };
}