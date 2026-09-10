"use client";

import { useState, useTransition } from "react";
import { updateOffer } from "@/app/actions";
import { formatEuros } from "@/lib/format";
import type { Offer } from "@/types";

const FIELDS: { key: keyof Offer; label: string; hint?: string; group: string }[] = [
  { key: "monthlyPrice", label: "Prix mensuel (€)", group: "Contrat" },
  { key: "billingDay", label: "Jour de facturation", hint: "1 a 31", group: "Contrat" },
  { key: "reportingDay", label: "Jour de reporting", hint: "1 a 31", group: "Contrat" },
  { key: "articlesPerMonth", label: "Articles par mois", group: "Production" },
  { key: "backlinksPremium", label: "Backlinks premium", group: "Netlinking" },
  { key: "backlinksStandard", label: "Backlinks standard", group: "Netlinking" },
  { key: "backlinksNinja", label: "Ninja linking", group: "Netlinking" },
  { key: "backlinksReddit", label: "Reddit", group: "Netlinking" },
];

const GROUPS = ["Contrat", "Production", "Netlinking"];

export default function OfferForm({
  offer,
  canEdit,
}: {
  offer: Offer;
  canEdit: boolean;
}) {
  const [draft, setDraft] = useState<Offer>(offer);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const totalBacklinks =
    draft.backlinksPremium +
    draft.backlinksStandard +
    draft.backlinksNinja +
    draft.backlinksReddit;

    function submit() {
    setMessage("");
    startTransition(async () => {
      const result = await updateOffer(draft);
      setMessage(result.message);
      if (result.ok) window.location.reload();
    });
  }

  if (!canEdit) {
    return (
      <div className="mt-4">
        <Summary offer={offer} total={totalBacklinks} />
        <p className="mt-4 text-xs text-muted">
          Seule la direction peut modifier une offre.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 max-w-3xl">
      <Summary offer={draft} total={totalBacklinks} />

      {GROUPS.map((group) => (
        <div key={group} className="mt-6">
          <div className="border-b border-line pb-1 font-display text-xs font-semibold">
            {group}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FIELDS.filter((f) => f.group === group).map((field) => (
              <label key={field.key} className="block">
                <span className="block text-xs text-muted">{field.label}</span>
                <input
                  type="number"
                  min={0}
                  value={String(draft[field.key] ?? 0)}
                  onChange={(e) =>
                    setDraft({ ...draft, [field.key]: Number(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-sm border border-line bg-surface px-2 py-1.5 focus:border-transparent focus:outline focus:outline-2 focus:outline-accent"
                />
                {field.hint && <span className="text-xs text-muted">{field.hint}</span>}
              </label>
            ))}
          </div>
        </div>
      ))}

      <label className="mt-6 block">
        <span className="block text-xs text-muted">Notes</span>
        <textarea
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          rows={3}
          placeholder="Conditions particulieres, engagement, remise…"
          className="mt-1 w-full rounded-sm border border-line bg-surface px-2 py-1.5 focus:border-transparent focus:outline focus:outline-2 focus:outline-accent"
        />
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-sm bg-ink px-4 py-2 text-surface disabled:opacity-40"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {message && <span className="text-xs">{message}</span>}
      </div>

      {offer.updatedAt && (
        <p className="mt-3 text-xs text-muted">
          Derniere modification le {offer.updatedAt} par {offer.updatedBy}.
        </p>
      )}
    </div>
  );
}

function Summary({ offer, total }: { offer: Offer; total: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Cell label="Prix mensuel" value={offer.monthlyPrice ? formatEuros(offer.monthlyPrice) : "—"} />
      <Cell
        label="Facturation"
        value={offer.billingDay ? `le ${offer.billingDay}` : "—"}
      />
      <Cell
        label="Reporting"
        value={offer.reportingDay ? `le ${offer.reportingDay}` : "—"}
      />
      <Cell label="Backlinks / mois" value={total ? String(total) : "—"} />
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line bg-surface p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-display text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}
