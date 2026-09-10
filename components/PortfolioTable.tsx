"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatEuros, formatNumber, formatVariation, variation } from "@/lib/format";
import type { PortfolioRow } from "@/types";

type SortKey =
  | "name"
  | "siteClicks"
  | "siteTrend"
  | "articleClicks"
  | "articleTrend"
  | "articleImpressions"
  | "articleImpressionsTrend"
  | "articlePosition"
  | "revenue"
  | "revenueTotal"
  | "share";

export default function PortfolioTable({ rows }: { rows: PortfolioRow[] }) {
  const [sort, setSort] = useState<SortKey>("articleTrend");
  const [asc, setAsc] = useState(true);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      // Pour la position, un chiffre bas est meilleur : on inverse le sens.
      const factor = sort === "articlePosition" ? -1 : 1;
      const va = value(a, sort);
      const vb = value(b, sort);
      const diff = typeof va === "string" ? va.localeCompare(vb as string) : va - (vb as number);
      return (asc ? diff : -diff) * factor;
    });
  }, [rows, sort, asc]);

  function click(key: SortKey) {
    if (key === sort) setAsc(!asc);
    else {
      setSort(key);
      // Les baisses d'abord sur les evolutions, les gros volumes d'abord ailleurs.
      setAsc(key.endsWith("Trend") || key === "name");
    }
  }

  function Head({
    label,
    keys,
    align = "right",
  }: {
    label: string;
    keys: SortKey[];
    align?: "left" | "right";
  }) {
    return (
      <th className={`pb-2 pr-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
        {keys.map((key, i) => (
          <button
            key={key}
            onClick={() => click(key)}
            className={`${i > 0 ? "ml-2" : ""} ${
              sort === key ? "font-semibold text-ink" : "hover:text-ink"
            }`}
          >
            {i === 0 ? label : "Δ"}
            {sort === key && <span className="ml-1">{asc ? "▲" : "▼"}</span>}
          </button>
        ))}
      </th>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            <Head label="Client" keys={["name"]} align="left" />
            <Head label="Clics site 30 j" keys={["siteClicks", "siteTrend"]} />
            <Head label="Clics articles 30 j" keys={["articleClicks", "articleTrend"]} />
            <Head
              label="Impressions articles"
              keys={["articleImpressions", "articleImpressionsTrend"]}
            />
            <Head label="Position" keys={["articlePosition"]} />
            <Head label="CA 30 j" keys={["revenue"]} />
            <Head label="CA depuis le debut" keys={["revenueTotal"]} />
            <Head label="Part du site" keys={["share"]} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const siteTrend = variation(row.siteClicks, row.siteClicksPrev);
            const articleTrend = variation(row.articleClicks, row.articleClicksPrev);
            // Un ecart marque entre le site et nos articles oriente le diagnostic.
            const diverging = Math.abs(siteTrend - articleTrend) > 15;

            return (
              <tr key={row.id} className="border-b border-line/50 align-top hover:bg-surface">
                <td className="py-3 pr-3">
                  <Link href={`/client/${row.id}`} className="font-semibold hover:underline">
                    {row.name}
                  </Link>
                  <div className="text-xs text-muted">
                    {row.articleCount} / {row.producedCount} articles suivis
                    {diverging && (
                      <span className="ml-2 text-warn">
                        {articleTrend < siteTrend ? "nos articles decrochent" : "nous tenons mieux"}
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap py-3 pr-3 text-right">
                  {formatNumber(row.siteClicks)}
                  <Trend current={row.siteClicks} previous={row.siteClicksPrev} />
                </td>
                <td className="whitespace-nowrap py-3 pr-3 text-right">
                  <span className="font-semibold">{formatNumber(row.articleClicks)}</span>
                  <Trend current={row.articleClicks} previous={row.articleClicksPrev} />
                </td>
                <td className="whitespace-nowrap py-3 pr-3 text-right">
                  {formatNumber(row.articleImpressions)}
                  <Trend
                    current={row.articleImpressions}
                    previous={row.articleImpressionsPrev}
                  />
                </td>
                <td className="py-3 pr-3 text-right">
                  {row.articlePosition ? row.articlePosition.toFixed(1) : "—"}
                </td>
                <td className="whitespace-nowrap py-3 pr-3 text-right">
                  {row.revenue !== null ? (
                    <>
                      <span className="font-semibold">{formatEuros(row.revenue)}</span>
                      <Trend current={row.revenue} previous={row.revenuePrev} />
                    </>
                  ) : (
                    <span className="text-xs text-muted">non suivi</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-right font-semibold">
                  {row.revenueTotal !== null ? (
                    formatEuros(row.revenueTotal)
                  ) : (
                    <span className="text-xs font-normal text-muted">—</span>
                  )}
                </td>
                <td className="py-3 text-right text-muted">{share(row).toFixed(1)} %</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function share(row: PortfolioRow): number {
  return row.siteClicks > 0 ? (row.articleClicks / row.siteClicks) * 100 : 0;
}

function value(row: PortfolioRow, key: SortKey): string | number {
  switch (key) {
    case "name":
      return row.name;
    case "siteTrend":
      return variation(row.siteClicks, row.siteClicksPrev);
    case "articleTrend":
      return variation(row.articleClicks, row.articleClicksPrev);
    case "articleImpressionsTrend":
      return variation(row.articleImpressions, row.articleImpressionsPrev);
    case "revenue":
      return row.revenue ?? -1;
    case "revenueTotal":
      return row.revenueTotal ?? -1;
    case "share":
      return share(row);
    default:
      return row[key];
  }
}

function Trend({ current, previous }: { current: number; previous: number }) {
  const value = variation(current, previous);
  if (!value) return null;
  return (
    <span className={`ml-2 text-xs ${value > 0 ? "text-up" : "text-down"}`}>
      {formatVariation(value)}
    </span>
  );
}
