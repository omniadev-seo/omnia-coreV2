import Link from "next/link";
import { clientsInScope } from "@/lib/scope";
import { clientSummary } from "@/lib/analytics";
import { formatEuros, formatNumber, formatVariation, variation } from "@/lib/format";

export const dynamic = "force-dynamic";

function Trend({ current, previous }: { current: number; previous: number }) {
  const value = variation(current, previous);
  const color = value > 0 ? "text-up" : value < 0 ? "text-down" : "text-muted";
  return <span className={`ml-2 text-xs ${color}`}>{formatVariation(value)}</span>;
}

/** Pour la position, baisser est une amélioration : les couleurs sont inversées. */
function PositionTrend({ current, previous }: { current: number; previous: number }) {
  if (!previous || !current) return null;
  const delta = current - previous;
  const color = delta < 0 ? "text-up" : delta > 0 ? "text-down" : "text-muted";
  return (
    <span className={`ml-2 text-xs ${color}`}>
      {delta > 0 ? "+" : ""}
      {delta.toFixed(1)}
    </span>
  );
}

export default async function PortefeuillePage() {
  const clients = await clientsInScope();
  const rows = await Promise.all(clients.map(clientSummary));

  // Les plus fortes baisses de clics sur nos articles en tête : la question du matin.
  rows.sort(
    (a, b) =>
      variation(a.articles.clicks, a.articles.previous.clicks) -
      variation(b.articles.clicks, b.articles.previous.clicks)
  );

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
  const totalClicks = rows.reduce((s, r) => s + r.articles.clicks, 0);

  return (
    <main className="mx-auto max-w-7xl px-7 py-8">
      <h1 className="font-display text-xl font-extrabold tracking-tight">Portefeuille</h1>
      <p className="mt-1 text-xs text-muted">
        {rows.length} clients · {formatNumber(totalClicks)} clics sur nos articles ces 30 jours ·{" "}
        {formatEuros(totalRevenue)} generes depuis le debut
      </p>

      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="pb-2 pr-3 font-medium">Client</th>
            <th className="pb-2 pr-3 text-right font-medium">Clics articles 30 j</th>
            <th className="pb-2 pr-3 text-right font-medium">Impressions</th>
            <th className="pb-2 pr-3 text-right font-medium">Position moy.</th>
            <th className="pb-2 pr-3 text-right font-medium">CA articles 30 j</th>
            <th className="pb-2 pr-3 text-right font-medium">CA depuis le debut</th>
            <th className="pb-2 text-right font-medium">Part du site</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ client, site, articles, articleCount, producedCount, revenue, revenueTotal }) => {
            const share = site.clicks > 0 ? (articles.clicks / site.clicks) * 100 : 0;
            return (
              <tr key={client.id} className="border-b border-line/50 hover:bg-surface">
                <td className="py-3 pr-3">
                  <Link href={`/client/${client.id}`} className="font-semibold hover:underline">
                    {client.name}
                  </Link>
                  <div className="text-xs text-muted">
                    {articleCount} / {producedCount} articles suivis ·{" "}
                    {formatNumber(site.clicks)} clics site
                  </div>
                </td>
                <td className="py-3 pr-3 text-right">
                  <span className="font-semibold">{formatNumber(articles.clicks)}</span>
                  <Trend current={articles.clicks} previous={articles.previous.clicks} />
                </td>
                <td className="py-3 pr-3 text-right">
                  {formatNumber(articles.impressions)}
                  <Trend
                    current={articles.impressions}
                    previous={articles.previous.impressions}
                  />
                </td>
                <td className="py-3 pr-3 text-right">
                  {articles.position ? articles.position.toFixed(1) : "—"}
                  <PositionTrend
                    current={articles.position}
                    previous={articles.previous.position}
                  />
                </td>
                <td className="py-3 pr-3 text-right">
                  {revenue ? (
                    <>
                      <span className="font-semibold">{formatEuros(revenue.amount)}</span>
                      <Trend current={revenue.amount} previous={revenue.previous} />
                    </>
                  ) : (
                    <span className="text-xs text-muted">non suivi</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-right font-semibold">
                  {revenueTotal !== null ? (
                    formatEuros(revenueTotal)
                  ) : (
                    <span className="text-xs font-normal text-muted">—</span>
                  )}
                </td>
                <td className="py-3 text-right text-muted">{share.toFixed(1)} %</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-6 max-w-2xl text-xs text-muted">
        Les colonnes portent sur nos articles seulement, issus du suivi d&apos;indexation et
        rattaches par domaine. Le premier chiffre est le nombre d&apos;articles remontes par
        Search Console, le second celui des articles produits. Un ecart important signale des
        URL a verifier.
      </p>
    </main>
  );
}
