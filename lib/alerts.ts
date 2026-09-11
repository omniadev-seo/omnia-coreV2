import { pageMetrics, totals } from "@/lib/gsc";
import { revenueByLanding } from "@/lib/ga4";
import { articlesByDomain, normalizeDomain, normalizePath } from "@/lib/sheets";
import { ga4LastDays, ga4PreviousDays, lastDays, previousDays } from "@/lib/dates";
import { variation } from "@/lib/format";
import { ALERT_RULES, MIN_HISTORY_DAYS } from "@/config/alerts";
import type { Client, PageRow } from "@/types";

export type AlertLevel = "critical" | "warning" | "positive";

export type Alert = {
  clientId: string;
  clientName: string;
  level: AlertLevel;
  title: string;
  detail: string;
  /** Variation en pourcentage, pour trier par gravité. */
  change: number;
};

/** Fenêtre d'analyse : 7 jours suffisent à réagir, 30 laissent la chute s'installer. */
const DAYS = 7;

type Snapshot = {
  siteClicks: number;
  siteClicksPrev: number;
  articleClicks: number;
  articleClicksPrev: number;
  revenue: number | null;
  revenuePrev: number;
};

/**
 * Un client trop récent ne déclenche pas d'alerte négative : la poussée
 * initiale de Google fausse toute comparaison sur les premières semaines.
 */
function isMature(client: Client): boolean {
  if (!client.startDate) return true;

  const days = (Date.now() - new Date(client.startDate).getTime()) / 86_400_000;
  return days >= MIN_HISTORY_DAYS;
}

async function snapshot(client: Client): Promise<Snapshot> {
  const articles = (await articlesByDomain()).get(normalizeDomain(client.domain)) ?? new Map();
  const ours = (rows: PageRow[]) => rows.filter((r) => articles.has(normalizePath(r.url)));
  const sum = (pages: Map<string, number>) => {
    let total = 0;
    for (const [path, value] of pages) if (articles.has(path)) total += value;
    return total;
  };

  const [current, previous, revenueNow, revenueBefore] = await Promise.all([
    pageMetrics(client, lastDays(DAYS)),
    pageMetrics(client, previousDays(DAYS)),
    revenueByLanding(client, ga4LastDays(DAYS)),
    revenueByLanding(client, ga4PreviousDays(DAYS)),
  ]);

  return {
    siteClicks: totals(current).clicks,
    siteClicksPrev: totals(previous).clicks,
    articleClicks: totals(ours(current)).clicks,
    articleClicksPrev: totals(ours(previous)).clicks,
    revenue: revenueNow.size ? sum(revenueNow) : null,
    revenuePrev: revenueBefore.size ? sum(revenueBefore) : 0,
  };
}

const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(0)} %`;
const money = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

export async function clientAlerts(client: Client): Promise<Alert[]> {
  const s = await snapshot(client);
  const alerts: Alert[] = [];
  const base = { clientId: client.id, clientName: client.name };
  const mature = isMature(client);

  const articleChange = variation(s.articleClicks, s.articleClicksPrev);
  const siteChange = variation(s.siteClicks, s.siteClicksPrev);
  const revenueChange = s.revenue !== null ? variation(s.revenue, s.revenuePrev) : 0;

  const r = ALERT_RULES;

  if (mature) {
    // Nos articles baissent pendant que le site tient : cause interne, prioritaire.
    if (
      s.articleClicksPrev >= r.diverging.minClicks &&
      articleChange <= r.diverging.articleDrop &&
      siteChange >= r.diverging.siteFloor
    ) {
      alerts.push({
        ...base,
        level: "critical",
        title: "Nos articles décrochent alors que le site tient",
        detail: `Articles ${pct(articleChange)}, site ${pct(siteChange)} sur 7 jours. La cause vient de nos contenus, pas d'un facteur externe.`,
        change: articleChange,
      });
    } else if (
      s.articleClicksPrev >= r.articleClicksDrop.minClicks &&
      articleChange <= r.articleClicksDrop.threshold
    ) {
      alerts.push({
        ...base,
        level: "warning",
        title: "Chute des clics sur nos articles",
        detail: `${pct(articleChange)} sur 7 jours, ${s.articleClicks} clics contre ${s.articleClicksPrev}.`,
        change: articleChange,
      });
    }

    if (
      s.siteClicksPrev >= r.siteClicksDrop.minClicks &&
      siteChange <= r.siteClicksDrop.threshold
    ) {
      alerts.push({
        ...base,
        level: "warning",
        title: "Chute du trafic du site",
        detail: `${pct(siteChange)} sur 7 jours. À vérifier côté technique ou saisonnalité avant de conclure.`,
        change: siteChange,
      });
    }

    if (s.revenue !== null && s.revenuePrev >= r.revenueDrop.minAmount && revenueChange <= r.revenueDrop.threshold) {
      alerts.push({
        ...base,
        level: "warning",
        title: "Baisse du chiffre d'affaires généré par nos articles",
        detail: `${money(s.revenue)} contre ${money(s.revenuePrev)} la semaine précédente, ${pct(revenueChange)}.`,
        change: revenueChange,
      });
    }
  }

  if (
    s.articleClicks >= r.articleClicksRise.minClicks &&
    articleChange >= r.articleClicksRise.threshold
  ) {
    alerts.push({
      ...base,
      level: "positive",
      title: "Nos articles progressent",
      detail: `${pct(articleChange)} sur 7 jours, ${s.articleClicks} clics. À signaler au client.`,
      change: articleChange,
    });
  }

  if (
    s.revenue !== null &&
    s.revenue >= r.revenueRise.minAmount &&
    revenueChange >= r.revenueRise.threshold
  ) {
    alerts.push({
      ...base,
      level: "positive",
      title: "Hausse du chiffre d'affaires généré par nos articles",
      detail: `${money(s.revenue)} cette semaine, ${pct(revenueChange)}.`,
      change: revenueChange,
    });
  }

  return alerts;
}

const ORDER: Record<AlertLevel, number> = { critical: 0, warning: 1, positive: 2 };

export async function allAlerts(clients: Client[]): Promise<Alert[]> {
  const lists = await Promise.all(clients.map(clientAlerts));

  return lists
    .flat()
    .sort((a, b) => ORDER[a.level] - ORDER[b.level] || Math.abs(b.change) - Math.abs(a.change));
}
