import { google } from "googleapis";
import { googleAuth } from "@/lib/google";
import { getClient } from "@/config/clients";
import { ga4LastDays } from "@/lib/dates";
import { normalizePath } from "@/lib/sheets";

export const dynamic = "force-dynamic";

/**
 * Compare les mesures de revenu GA4 sur une meme periode.
 *
 * Chaque mesure est demandee separement : certaines sont incompatibles avec la
 * page de destination et feraient echouer la requete entiere si on les
 * groupait. Une mesure refusee apparait avec son message d'erreur au lieu de
 * masquer les autres.
 *
 * Exemple : /api/google/revenue?id=che&days=30
 */
const METRICS = ["purchaseRevenue", "totalRevenue", "itemRevenue", "sessions", "transactions"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const client = getClient(params.get("id") ?? "");
  const days = Number(params.get("days") ?? 30);

  if (!client) return Response.json({ erreur: "client inconnu, passez ?id=..." });
  if (!client.ga4PropertyId) return Response.json({ erreur: "ga4PropertyId manquant" });

  const range = ga4LastDays(days);

  const results = await Promise.all(
    METRICS.flatMap((metric) => [
      measure(client.ga4PropertyId, range, metric, true),
      measure(client.ga4PropertyId, range, metric, false),
    ])
  );

  const organique: Record<string, unknown> = {};
  const tousCanaux: Record<string, unknown> = {};

  for (const r of results) {
    (r.organicOnly ? organique : tousCanaux)[r.metric] = r.error ?? r.total;
  }

  const detail = await topPages(client.ga4PropertyId, range);

  return Response.json({
    client: client.name,
    propriete: client.ga4PropertyId,
    periode: range,
    organique,
    tousCanaux,
    pagesOrganique: detail,
  });
}

async function measure(
  propertyId: string,
  range: { start: string; end: string },
  metric: string,
  organicOnly: boolean
) {
  try {
    const res = await run(propertyId, range, [metric], organicOnly, "1");
    const total = Number(res.data.totals?.[0]?.metricValues?.[0]?.value ?? 0);
    return { metric, organicOnly, total: Math.round(total * 100) / 100, error: null };
  } catch (e) {
    return { metric, organicOnly, total: 0, error: shorten(e) };
  }
}

/** Les vingt pages qui rapportent le plus, avec les deux mesures compatibles. */
async function topPages(propertyId: string, range: { start: string; end: string }) {
  try {
    const res = await run(propertyId, range, ["purchaseRevenue", "totalRevenue"], true, "500");

    const pages = new Map<string, { purchaseRevenue: number; totalRevenue: number }>();
    for (const row of res.data.rows ?? []) {
      const raw = row.dimensionValues?.[0]?.value;
      if (!raw) continue;
      const path = normalizePath(raw);
      const current = pages.get(path) ?? { purchaseRevenue: 0, totalRevenue: 0 };
      current.purchaseRevenue += Number(row.metricValues?.[0]?.value ?? 0);
      current.totalRevenue += Number(row.metricValues?.[1]?.value ?? 0);
      pages.set(path, current);
    }

    return [...pages.entries()]
      .filter(([, m]) => m.purchaseRevenue > 0 || m.totalRevenue > 0)
      .sort((a, b) => b[1].purchaseRevenue - a[1].purchaseRevenue)
      .slice(0, 20)
      .map(([path, m]) => ({
        path,
        purchaseRevenue: Math.round(m.purchaseRevenue * 100) / 100,
        totalRevenue: Math.round(m.totalRevenue * 100) / 100,
      }));
  } catch (e) {
    return { erreur: shorten(e) };
  }
}

function run(
  propertyId: string,
  range: { start: string; end: string },
  metrics: string[],
  organicOnly: boolean,
  limit: string
) {
  return google
    .analyticsdata({ version: "v1beta", auth: googleAuth() })
    .properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: range.start, endDate: range.end }],
        dimensions: [{ name: "landingPage" }],
        metrics: metrics.map((name) => ({ name })),
        dimensionFilter: organicOnly
          ? {
              filter: {
                fieldName: "sessionDefaultChannelGroup",
                stringFilter: { value: "Organic Search" },
              },
            }
          : undefined,
        limit,
      },
    });
}

function shorten(e: unknown): string {
  return String(e).replace(/\s+/g, " ").slice(0, 200);
}