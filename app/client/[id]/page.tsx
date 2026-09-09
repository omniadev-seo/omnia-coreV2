import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/config/clients";
import { clientsInScope } from "@/lib/scope";
import { clientSummary, pageBreakdown } from "@/lib/analytics";
import { formatEuros, formatNumber, formatVariation, variation } from "@/lib/format";
import PageTable from "@/components/PageTable";

export const dynamic = "force-dynamic";

function Kpi({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-line bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs">{sub}</div>}
    </div>
  );
}

function Trend({ current, previous }: { current: number; previous: number }) {
  const value = variation(current, previous);
  const color = value > 0 ? "text-up" : value < 0 ? "text-down" : "text-muted";
  return <span className={color}>{formatVariation(value)}</span>;
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = getClient(id);
  if (!client) notFound();

  // Le perimetre est verifie cote serveur : une URL devinee ne donne pas l'acces.
  const allowed = await clientsInScope();
  if (!allowed.some((c) => c.id === id)) notFound();

  const [summary, breakdown] = await Promise.all([clientSummary(client), pageBreakdown(client)]);

  const { site, articles, revenue, revenueTotal, producedCount } = summary;
  const articleRows = breakdown.rows.filter((r) => r.isArticle);
  const share = site.clicks > 0 ? (articles.clicks / site.clicks) * 100 : 0;
  const cumulClicks = articleRows.reduce((s, r) => s + r.cumulativeClicks, 0);
  const cumulImpressions = articleRows.reduce((s, r) => s + r.cumulativeImpressions, 0);

  return (
    <main className="mx-auto max-w-7xl px-7 py-8">
      <Link href="/portefeuille" className="text-xs text-muted hover:text-ink">
        ← Portefeuille
      </Link>

      <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight">{client.name}</h1>
      <p className="text-xs text-muted">
        {client.domain} · {client.cms} · {client.sector}
        {client.startDate && ` · client depuis le ${client.startDate}`}
      </p>

      <h2 className="mt-8 border-b border-ink pb-2 font-display text-sm font-semibold">
        Le site · 30 derniers jours
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi
          label="Clics organiques"
          value={formatNumber(site.clicks)}
          sub={<Trend current={site.clicks} previous={site.previous.clicks} />}
        />
        <Kpi
          label="Impressions"
          value={formatNumber(site.impressions)}
          sub={<Trend current={site.impressions} previous={site.previous.impressions} />}
        />
        <Kpi
          label="Position moyenne"
          value={site.position ? site.position.toFixed(1) : "—"}
          sub={<span className="text-muted">ponderee par les impressions</span>}
        />
      </div>

      <h2 className="mt-10 border-b border-ink pb-2 font-display text-sm font-semibold">
        Nos articles
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          label="Clics 30 jours"
          value={formatNumber(articles.clicks)}
          sub={
            <span>
              <Trend current={articles.clicks} previous={articles.previous.clicks} />
              <span className="ml-2 text-muted">
                vs {formatNumber(articles.previous.clicks)} les 30 j precedents
              </span>
            </span>
          }
        />
        <Kpi
          label="Impressions 30 jours"
          value={formatNumber(articles.impressions)}
          sub={
            <span>
              <Trend current={articles.impressions} previous={articles.previous.impressions} />
              <span className="ml-2 text-muted">
                vs {formatNumber(articles.previous.impressions)}
              </span>
            </span>
          }
        />
        <Kpi
          label="Position moyenne"
          value={articles.position ? articles.position.toFixed(1) : "—"}
          sub={
            <span className="text-muted">
              {articles.previous.position
                ? `vs ${articles.previous.position.toFixed(1)} les 30 j precedents`
                : "ponderee par les impressions"}
            </span>
          }
        />
        <Kpi
          label="Clics cumules"
          value={formatNumber(cumulClicks)}
          sub={
            <span className="text-muted">
              {formatNumber(cumulImpressions)} impressions
              {breakdown.truncated && " · limite a 16 mois"}
            </span>
          }
        />
        <Kpi
          label="CA articles 30 jours"
          value={revenue ? formatEuros(revenue.amount) : "—"}
          sub={
            revenue ? (
              <Trend current={revenue.amount} previous={revenue.previous} />
            ) : (
              <span className="text-muted">e-commerce non suivi</span>
            )
          }
        />
        <Kpi
          label="CA depuis le debut"
          value={revenueTotal !== null ? formatEuros(revenueTotal) : "—"}
          sub={
            <span className="text-muted">
              {producedCount} articles produits · {share.toFixed(1)} % du trafic
            </span>
          }
        />
      </div>

      <h2 className="mt-10 border-b border-ink pb-2 font-display text-sm font-semibold">
        Pages
      </h2>

      <PageTable rows={breakdown.rows} />

      {breakdown.missing.length > 0 && (
        <section className="mt-10">
          <h2 className="border-b border-ink pb-2 font-display text-sm font-semibold">
            Articles sans donnees ({breakdown.missing.length})
          </h2>
          <p className="mt-3 max-w-2xl text-xs text-muted">
            Produits selon le suivi d&apos;indexation, mais absents de Search Console sur la
            periode. Soit ils sont trop recents, soit l&apos;URL du suivi ne correspond pas a
            celle reellement publiee.
          </p>
          <ul className="mt-3 space-y-1">
            {breakdown.missing.slice(0, 30).map((a) => (
              <li key={a.path} className="text-xs">
                <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {a.path}
                </a>
                {a.status && a.status !== "Page indexée" && (
                  <span className="ml-2 text-down">{a.status}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 max-w-2xl text-xs text-muted">
        Cliquez sur un en-tete pour trier, une seconde fois pour inverser. Nos articles sont
        ceux du suivi d&apos;indexation, rattaches par domaine.
        {breakdown.capped && " Seules les 800 meilleures pages sont affichees."}
        {" "}Le cumul Search Console s&apos;arrete a 16 mois. Le CA est attribue au dernier clic
        de la session.
      </p>
    </main>
  );
}
