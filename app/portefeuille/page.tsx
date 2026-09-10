import { clientsInScope } from "@/lib/scope";
import { clientSummary } from "@/lib/analytics";
import { formatEuros, formatNumber } from "@/lib/format";
import PortfolioTable from "@/components/PortfolioTable";
import type { PortfolioRow } from "@/types";

export const dynamic = "force-dynamic";

export default async function PortefeuillePage() {
  const clients = await clientsInScope();
  const summaries = await Promise.all(clients.map(clientSummary));

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
        <h1 className="font-display text-xl font-extrabold tracking-tight">Portefeuille</h1>
        <p className="mt-6 text-muted">
          Aucun client lisible. Renseignez la propriete Search Console dans{" "}
          <code>config/clients.ts</code>.
        </p>
      </main>
    );
  }

  const totalRevenue = rows.reduce((s, r) => s + (r.revenueTotal ?? 0), 0);
  const totalClicks = rows.reduce((s, r) => s + r.articleClicks, 0);

  return (
    <main className="mx-auto max-w-7xl px-7 py-8">
      <h1 className="font-display text-xl font-extrabold tracking-tight">Portefeuille</h1>
      <p className="mt-1 text-xs text-muted">
        {rows.length} clients · {formatNumber(totalClicks)} clics sur nos articles ces 30 jours ·{" "}
        {formatEuros(totalRevenue)} generes depuis le debut
      </p>

      <PortfolioTable rows={rows} />

      <p className="mt-6 max-w-3xl text-xs text-muted">
        Cliquez sur un en-tete pour trier, sur le Δ pour trier par evolution. La colonne Clics
        site sert de comparaison : si le site baisse et pas nos articles, la cause est ailleurs
        que dans le contenu ; si nos articles baissent alors que le site tient, c&apos;est notre
        sujet. Un ecart de plus de quinze points entre les deux est signale sous le nom du client.
      </p>
    </main>
  );
}
