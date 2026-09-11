import Link from "next/link";

/** Navigation commune, avec le nombre d'alertes à traiter en évidence. */
export default function Nav({ alertCount }: { alertCount?: number }) {
  return (
    <nav className="mb-6 flex items-baseline gap-5 border-b border-ink pb-3">
      <span className="font-display text-base font-extrabold tracking-tight">Omnia Core</span>
      <Link href="/portefeuille" className="text-xs text-muted hover:text-ink">
        Portefeuille
      </Link>
      <Link href="/alertes" className="text-xs text-muted hover:text-ink">
        Alertes
        {alertCount !== undefined && alertCount > 0 && (
          <span className="ml-1.5 rounded-sm bg-down px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {alertCount}
          </span>
        )}
      </Link>
    </nav>
  );
}
