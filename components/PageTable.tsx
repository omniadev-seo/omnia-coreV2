"use client";

import { useMemo, useState } from "react";
import { formatEuros, formatNumber, formatVariation, variation } from "@/lib/format";
import type { PageBreakdownRow } from "@/types";

type SortKey =
  | "path"
  | "clicks"
  | "clicksTrend"
  | "impressions"
  | "impressionsTrend"
  | "cumulativeClicks"
  | "cumulativeImpressions"
  | "position"
  | "revenue"
  | "revenueTotal";

export default function PageTable({ rows }: { rows: PageBreakdownRow[] }) {
  const [tab, setTab] = useState<"articles" | "all">("articles");
  const [sort, setSort] = useState<SortKey>("cumulativeClicks");
  const [asc, setAsc] = useState(false);

  const visible = useMemo(() => {
    const filtered = tab === "articles" ? rows.filter((r) => r.isArticle) : rows;

    return [...filtered].sort((a, b) => {
      // La position se lit à l'envers : plus le chiffre est bas, meilleur c'est.
      const factor = sort === "position" ? -1 : 1;
      const va = value(a, sort);
      const vb = value(b, sort);
      const diff = typeof va === "string" ? va.localeCompare(vb as string) : va - (vb as number);
      return (asc ? diff : -diff) * factor;
    });
  }, [rows, tab, sort, asc]);

  const articleCount = rows.filter((r) => r.isArticle).length;

  function click(key: SortKey) {
    if (key === sort) setAsc(!asc);
    else {
      setSort(key);
      setAsc(false);
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
    <>
      <div className="mt-4 flex gap-1 text-xs">
        <button
          onClick={() => setTab("articles")}
          className={`rounded-sm border px-3 py-1.5 ${
            tab === "articles"
              ? "border-ink bg-ink text-surface"
              : "border-line text-muted hover:border-ink hover:text-ink"
          }`}
        >
          Nos articles ({articleCount})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`rounded-sm border px-3 py-1.5 ${
            tab === "all"
              ? "border-ink bg-ink text-surface"
              : "border-line text-muted hover:border-ink hover:text-ink"
          }`}
        >
          Toutes les pages ({rows.length})
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <Head label="Page" keys={["path"]} align="left" />
              <Head label="Clics 30 j" keys={["clicks", "clicksTrend"]} />
              <Head label="Impressions 30 j" keys={["impressions", "impressionsTrend"]} />
              <Head label="Clics cumulés" keys={["cumulativeClicks"]} />
              <Head label="Impressions cumulées" keys={["cumulativeImpressions"]} />
              <Head label="Position" keys={["position"]} />
              <Head label="CA 30 j" keys={["revenue"]} />
              <Head label="CA cumulé" keys={["revenueTotal"]} />
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.url} className="border-b border-line/50 align-top hover:bg-surface">
                <td className="max-w-sm py-3 pr-3">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate hover:underline"
                    title={row.title || row.path}
                  >
                    {row.title || row.path}
                  </a>
                  {row.title && <div className="truncate text-xs text-muted">{row.path}</div>}
                </td>
                <td className="whitespace-nowrap py-3 pr-3 text-right">
                  <span className="font-semibold">{formatNumber(row.clicks)}</span>
                  <Trend current={row.clicks} previous={row.previous.clicks} />
                </td>
                <td className="whitespace-nowrap py-3 pr-3 text-right">
                  {formatNumber(row.impressions)}
                  <Trend current={row.impressions} previous={row.previous.impressions} />
                </td>
                <td className="py-3 pr-3 text-right font-semibold">
                  {formatNumber(row.cumulativeClicks)}
                </td>
                <td className="py-3 pr-3 text-right text-muted">
                  {formatNumber(row.cumulativeImpressions)}
                </td>
                <td className="py-3 pr-3 text-right">
                  {row.position ? row.position.toFixed(1) : "—"}
                </td>
                <td className="py-3 pr-3 text-right">
                  {row.revenue !== null ? formatEuros(row.revenue) : "—"}
                </td>
                <td className="py-3 text-right font-semibold">
                  {row.revenueTotal !== null ? formatEuros(row.revenueTotal) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visible.length === 0 && (
        <p className="py-8 text-sm text-muted">Aucune page dans cette vue.</p>
      )}
    </>
  );
}

function value(row: PageBreakdownRow, key: SortKey): string | number {
  if (key === "path") return row.title || row.path;
  if (key === "revenue") return row.revenue ?? -1;
  if (key === "revenueTotal") return row.revenueTotal ?? -1;
  if (key === "clicksTrend") return variation(row.clicks, row.previous.clicks);
  if (key === "impressionsTrend") return variation(row.impressions, row.previous.impressions);
  return row[key];
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
