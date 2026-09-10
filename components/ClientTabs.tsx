"use client";

import { useState } from "react";

/**
 * Bascule entre les sections de la fiche client.
 *
 * Les deux contenus sont rendus par le serveur et passes en props : le
 * changement d'onglet ne declenche aucun nouvel appel aux API Google.
 */
export default function ClientTabs({
  performance,
  offer,
}: {
  performance: React.ReactNode;
  offer: React.ReactNode;
}) {
  const [tab, setTab] = useState<"performance" | "offer">("performance");

  return (
    <>
      <div className="mt-6 flex gap-1 text-xs">
        <Tab active={tab === "performance"} onClick={() => setTab("performance")}>
          Performance
        </Tab>
        <Tab active={tab === "offer"} onClick={() => setTab("offer")}>
          Offre
        </Tab>
      </div>

      <div className="mt-2">{tab === "performance" ? performance : offer}</div>
    </>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-sm border px-3 py-1.5 ${
        active
          ? "border-ink bg-ink text-surface"
          : "border-line text-muted hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
