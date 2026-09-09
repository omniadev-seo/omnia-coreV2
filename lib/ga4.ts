import { google } from "googleapis";
import { googleAuth } from "@/lib/google";
import { cached } from "@/lib/cache";
import { articlesByDomain, normalizeDomain, normalizePath } from "@/lib/sheets";
import { ga4LastDays, ga4PreviousDays, ga4SinceStart } from "@/lib/dates";
import type { Client, DateRange, Revenue } from "@/types";

/**
 * Revenu par page d'entree, pour les sessions issues de la recherche organique.
 *
 * Attribution a la page d'entree de la session : la vente revient a la page par
 * laquelle le visiteur est arrive. Un lecteur qui revient plus tard par une
 * autre page n'est pas compte pour l'article d'origine.
 */
/**
 * Mesure du revenu.
 *
 * "itemRevenue" serait le revenu brut des articles, mais l'API refuse de le
 * croiser avec la page de destination : la mesure est rattachee aux articles du
 * panier, la dimension a la session. Les explorations GA4 l'autorisent, pas
 * l'API.
 *
 * On utilise donc "purchaseRevenue" : le chiffre d'affaires des achats, sans
 * deduction des remboursements. C'est le plus proche du revenu brut parmi les
 * mesures compatibles. "totalRevenue" sert de repli ; il deduit les
 * remboursements et ajoute les revenus publicitaires.
 */
const REVENUE_METRIC = "purchaseRevenue";
const REVENUE_FALLBACK = "totalRevenue";

async function runRevenueReport(client: Client, range: DateRange, metric: string) {
  return google
    .analyticsdata({ version: "v1beta", auth: googleAuth() })
    .properties.runReport({
      property: `properties/${client.ga4PropertyId}`,
      requestBody: {
        dateRanges: [{ startDate: range.start, endDate: range.end }],
        dimensions: [{ name: "landingPage" }],
        metrics: [{ name: metric }],
        // Pas de filtre sur le canal : on mesure ce que la page rapporte, tous
        // canaux confondus. Ce n'est donc pas une mesure de l'apport du SEO
        // seul ; une campagne du client sur un article lui sera attribuee.
        limit: "100000",
      },
    });
}

/** Revenu par page d'entree, tous canaux confondus. */
export async function revenueByLanding(
  client: Client,
  range: DateRange
): Promise<Map<string, number>> {
  if (!client.ecommerce || !client.ga4PropertyId) return new Map();

  const key = `ga4:${client.id}:${range.start}:${range.end}`;

  try {
    return await cached(key, 3600, async () => {
      let res;
      try {
        res = await runRevenueReport(client, range, REVENUE_METRIC);
      } catch {
        console.warn(
          `GA4 ${client.name} : ${REVENUE_METRIC} refuse avec la page de destination, repli sur ${REVENUE_FALLBACK}.`
        );
        res = await runRevenueReport(client, range, REVENUE_FALLBACK);
      }

      // GA4 renvoie lui aussi des variantes de la meme page (barre finale,
      // parametres) : on additionne leur revenu sur le chemin normalise.
      const pages = new Map<string, number>();
      for (const row of res.data.rows ?? []) {
        const raw = row.dimensionValues?.[0]?.value;
        if (!raw) continue;
        const path = normalizePath(raw);
        const value = Number(row.metricValues?.[0]?.value ?? 0);
        pages.set(path, (pages.get(path) ?? 0) + value);
      }
      return pages;
    });
  } catch {
    // Propriete inaccessible ou identifiant errone : on affiche "non suivi"
    // plutot que de faire echouer toute la page.
    return new Map();
  }
}

/** Somme le revenu des seules pages presentes dans le suivi d'indexation. */
async function sumArticles(client: Client, pages: Map<string, number>): Promise<number> {
  const all = await articlesByDomain();
  const articles = all.get(normalizeDomain(client.domain));
  if (!articles) return 0;

  let total = 0;
  for (const [page, value] of pages) {
    if (articles.has(normalizePath(page))) total += value;
  }
  return total;
}

/** CA des articles sur 30 jours, avec la periode precedente. */
export async function articleRevenue(client: Client, days = 30): Promise<Revenue | null> {
  if (!client.ecommerce || !client.ga4PropertyId) return null;
  const [current, previous] = await Promise.all([
    revenueByLanding(client, ga4LastDays(days)),
    revenueByLanding(client, ga4PreviousDays(days)),
  ]);

  if (current.size === 0 && previous.size === 0) return null;

  const [amount, before] = await Promise.all([
    sumArticles(client, current),
    sumArticles(client, previous),
  ]);

  return { amount, previous: before };
}

/** CA des articles depuis le debut de la collaboration. */
export async function articleRevenueTotal(client: Client): Promise<number | null> {
  if (!client.ecommerce || !client.ga4PropertyId) return null;

  const pages = await revenueByLanding(client, ga4SinceStart(client.startDate));
  if (pages.size === 0) return null;

  return sumArticles(client, pages);
}