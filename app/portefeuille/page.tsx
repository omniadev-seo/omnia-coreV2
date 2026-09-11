import Link from "next/link";
import { clientsInScope } from "@/lib/scope";
import { clientSummary } from "@/lib/analytics";
import { allAlerts } from "@/lib/alerts";
import { formatEuros, formatNumber } from "@/lib/format";
import PortfolioTable from "@/components/PortfolioTable";
import Nav from "@/components/Nav";
import type { PortfolioRow } from "@/types";

export const dynamic = "force-dynamic";

export default async function PortefeuillePage() {
  const clients = await clientsInScope();
  const [summaries, alerts] = await Promise.all([
    Promise.all(clients.map(clientSummary)),
    allAlerts(clients),
  ]);

  const problems = alerts.filter((a) => a.level !== "positive");
  const wins = alerts.filter((a) => a.level === "positive");

  const rows: PortfolioRow[] = summaries.map((s) => ({
    id: s.client.id,
    name: s.client.name,
    domain: s.client.domain,
    siteClicks: s.site.clicks,
    siteClicksPrev: s.site.previous.clicks,
    siteImpressions: s.site.impressions,
    siteImpressionsPrev: s.site.previous.impressions,
    articleClicks: s.articles.clicks,
    articleClicksPrev: s.articles.previous.clicks,
    articleImpressions: s.articles.impressions,
    articleImpressionsPrev: s.articles.previous.impressions,
    articlePosition: s.articles.position,
    articlePositionPrev: s.articles.previous.position,
    articleCount: s.articleCount,
    producedCount: s.producedCount,
    revenue: s.revenue?.amount ?? null,
    revenuePrev: s.revenue?.previous ?? 0,
    revenueTotal: s.revenueTotal,
  }));

  if (rows.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-7 py-8">
        <Nav />
        <h1 className="font-display text-xl font-extrabold tracking-tight">Portefeuille</h1>
        <p className="mt-6 text-muted">
          Aucun client lisible. Renseignez la propriété Search Console dans{" "}
          <code>config/clients.ts</code>.
        </p>
      </main>
    );
  }

  const totalRevenue = rows.reduce((s, r) => s + (r.revenueTotal ?? 0), 0);
  const totalClicks = rows.reduce((s, r) => s + r.articleClicks, 0);

  return (
    <main className="mx-auto max-w-7xl px-7 py-8">
      <Nav alertCount={problems.length} />

      {(problems.length > 0 || wins.length > 0) && (
        <div className="mb-6 grid gap-2 sm:grid-cols-2">
          <Banner
            count={problems.length}
            singular="alerte cette semaine"
            plural="alertes cette semaine"
            empty="Aucune alerte cette semaine"
            names={problems.map((a) => a.clientName)}
            tone="down"
          />
          <Banner
            count={wins.length}
            singular="réussite cette semaine"
            plural="réussites cette semaine"
            empty="Aucune réussite marquante"
            names={wins.map((a) => a.clientName)}
            tone="up"
          />
        </div>
      )}

      <h1 className="font-display text-xl font-extrabold tracking-tight">Portefeuille</h1>
      <p className="mt-1 text-xs text-muted">
        {rows.length} clients · {formatNumber(totalClicks)} clics sur nos articles ces 30 jours ·{" "}
        {formatEuros(totalRevenue)} générés depuis le début
      </p>

      <PortfolioTable rows={rows} />

      <p className="mt-6 max-w-3xl text-xs text-muted">
        Cliquez sur un en-tête pour trier, sur le Δ pour trier par évolution. La colonne Clics
        site sert de comparaison : si le site baisse et pas nos articles, la cause est ailleurs
        que dans le contenu ; si nos articles baissent alors que le site tient, c&apos;est notre
        sujet. Un écart de plus de quinze points entre les deux est signalé sous le nom du client.
      </p>
    </main>
  );
}

function Banner({
  count,
  singular,
  plural,
  empty,
  names,
  tone,
}: {
  count: number;
  singular: string;
  plural: string;
  empty: string;
  names: string[];
  tone: "up" | "down";
}) {
  // Les doublons sont fréquents : un même client peut déclencher deux règles.
  const unique = [...new Set(names)];
  const border = tone === "down" ? "border-l-down" : "border-l-up";

  return (
    <Link
      href="/alertes"
      className={`block border border-line border-l-2 ${border} bg-surface p-3 hover:border-ink`}
    >
      <span className="text-sm font-semibold">
        {count === 0 ? empty : `${count} ${count > 1 ? plural : singular}`}
      </span>
      {unique.length > 0 && (
        <span className="ml-2 text-xs text-muted">
          {unique.slice(0, 3).join(", ")}
          {unique.length > 3 && ` et ${unique.length - 3} autre${unique.length > 4 ? "s" : ""}`}
        </span>
      )}
    </Link>
  );
}
