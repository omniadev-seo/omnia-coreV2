import { google } from "googleapis";
import { googleAuth } from "@/lib/google";
import { cached, clearCache } from "@/lib/cache";
import { OFFERS_SHEET, OFFER_COLUMNS } from "@/config/offers";
import type { Offer } from "@/types";

const EMPTY: Omit<Offer, "clientId"> = {
  monthlyPrice: 0,
  billingDay: 0,
  reportingDay: 0,
  articlesPerMonth: 0,
  backlinksPremium: 0,
  backlinksStandard: 0,
  backlinksNinja: 0,
  backlinksReddit: 0,
  notes: "",
  updatedAt: "",
  updatedBy: "",
};

function sheets() {
  return google.sheets({ version: "v4", auth: googleAuth() });
}

const RANGE = `${OFFERS_SHEET.tab}!A:L`;

function toOffer(row: string[]): Offer {
  const n = (i: number) => Number(row[i] ?? 0) || 0;
  return {
    clientId: String(row[0] ?? "").trim(),
    monthlyPrice: n(1),
    billingDay: n(2),
    reportingDay: n(3),
    articlesPerMonth: n(4),
    backlinksPremium: n(5),
    backlinksStandard: n(6),
    backlinksNinja: n(7),
    backlinksReddit: n(8),
    notes: String(row[9] ?? ""),
    updatedAt: String(row[10] ?? ""),
    updatedBy: String(row[11] ?? ""),
  };
}

function toRow(offer: Offer): string[] {
  return [
    offer.clientId,
    String(offer.monthlyPrice),
    String(offer.billingDay),
    String(offer.reportingDay),
    String(offer.articlesPerMonth),
    String(offer.backlinksPremium),
    String(offer.backlinksStandard),
    String(offer.backlinksNinja),
    String(offer.backlinksReddit),
    offer.notes,
    offer.updatedAt,
    offer.updatedBy,
  ];
}

/** Toutes les offres, indexees par identifiant de client. */
export async function allOffers(): Promise<Map<string, Offer>> {
  return cached("offers", 30, async () => {
    const map = new Map<string, Offer>();
    try {
      const res = await sheets().spreadsheets.values.get({
        spreadsheetId: OFFERS_SHEET.spreadsheetId,
        range: RANGE,
      });
      const rows = res.data.values ?? [];
      for (const row of rows.slice(1)) {
        const offer = toOffer(row as string[]);
        if (offer.clientId) map.set(offer.clientId, offer);
      }
    } catch {
      // Onglet absent ou droits insuffisants : table vide plutot qu'une page en erreur.
    }
    return map;
  });
}

export async function getOffer(clientId: string): Promise<Offer> {
  const offers = await allOffers();
  return offers.get(clientId) ?? { clientId, ...EMPTY };
}

/** Met a jour la ligne existante, ou l'ajoute a la fin. */
export async function saveOffer(offer: Offer): Promise<void> {
  const api = sheets();

  const res = await api.spreadsheets.values.get({
    spreadsheetId: OFFERS_SHEET.spreadsheetId,
    range: RANGE,
  });

  const rows = (res.data.values ?? []) as string[][];

  if (rows.length === 0) {
    await api.spreadsheets.values.update({
      spreadsheetId: OFFERS_SHEET.spreadsheetId,
      range: `${OFFERS_SHEET.tab}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [[...OFFER_COLUMNS]] },
    });
    rows.push([...OFFER_COLUMNS]);
  }

  const index = rows.findIndex((r, i) => i > 0 && String(r[0] ?? "").trim() === offer.clientId);

  if (index > 0) {
    await api.spreadsheets.values.update({
      spreadsheetId: OFFERS_SHEET.spreadsheetId,
      range: `${OFFERS_SHEET.tab}!A${index + 1}:L${index + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: [toRow(offer)] },
    });
  } else {
    await api.spreadsheets.values.append({
      spreadsheetId: OFFERS_SHEET.spreadsheetId,
      range: RANGE,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [toRow(offer)] },
    });
  }

  clearCache();
}
