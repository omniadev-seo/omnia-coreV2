import Link from "next/link";
import { clientsInScope } from "@/lib/scope";
import { allAlerts, type Alert, type AlertLevel } from "@/lib/alerts";
import Nav from "@/components/Nav";

export const dynamic = "force-dynamic";

const STYLES: Record<AlertLevel, { border: string; label: string }> = {
  critical: { border: "border-l-down", label: "À traiter" },
  warning: { border: "border-l-warn", label: "À surveiller" },
  positive: { border: "border-l-up", label: "Bonne nouvelle" },
};

export default async function AlertesPage() {
  const clients = await clientsInScope();
  const alerts = await allAlerts(clients);

  const counts = {
    critical: alerts.filter((a) => a.level === "critical").length,
    warning: alerts.filter((a) => a.level === "warning").length,
    positive: alerts.filter((a) => a.level === "positive").length,
  };

  const urgent = counts.critical + counts.warning;

  return (
    <main className="mx-auto max-w-4xl px-7 py-8">
      <Nav alertCount={urgent} />

      <h1 className="font-display text-xl font-extrabold tracking-tight">Alertes</h1>
      <p className="mt-1 text-xs text-muted">
        Comparaison des 7 derniers jours aux 7 précédents, sur {clients.length} clients.
        {alerts.length === 0
          ? " Rien à signaler ce matin."
          : ` ${counts.critical} à traiter, ${counts.warning} à surveiller, ${counts.positive} bonne${counts.positive > 1 ? "s" : ""} nouvelle${counts.positive > 1 ? "s" : ""}.`}
      </p>

      {alerts.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          Aucun client ne franchit les seuils. Les règles sont dans{" "}
          <code>config/alerts.ts</code> si vous voulez les resserrer.
        </p>
      ) : (
        <div className="mt-6 space-y-2">
          {alerts.map((alert, i) => (
            <Card key={`${alert.clientId}-${i}`} alert={alert} />
          ))}
        </div>
      )}

      <p className="mt-8 max-w-2xl text-xs text-muted">
        Chaque règle impose un volume minimum en plus du seuil de variation : un client à
        quelques clics ne déclenche rien, sinon l&apos;écran crierait tous les matins et plus
        personne ne le lirait. Les clients démarrés depuis moins de deux mois ne déclenchent
        aucune alerte négative, le temps que la poussée initiale de Google retombe.
      </p>
    </main>
  );
}

function Card({ alert }: { alert: Alert }) {
  const style = STYLES[alert.level];

  return (
    <Link
      href={`/client/${alert.clientId}`}
      className={`block border border-line border-l-2 ${style.border} bg-surface p-4 hover:border-ink`}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-semibold">{alert.clientName}</span>
        <span className="text-xs text-muted">{style.label}</span>
      </div>
      <div className="mt-1 text-sm">{alert.title}</div>
      <div className="mt-1 text-xs text-muted">{alert.detail}</div>
    </Link>
  );
}
