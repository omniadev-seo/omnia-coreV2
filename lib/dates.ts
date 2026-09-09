import type { DateRange } from "@/types";

/** Search Console a 2 a 3 jours de retard : on ne demande jamais les 2 derniers jours. */
const GSC_LAG_DAYS = 3;

/** Search Console ne conserve que 16 mois d'historique. */
const GSC_MAX_MONTHS = 16;

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export function lastDays(days: number): DateRange {
  return { start: iso(daysAgo(days + GSC_LAG_DAYS)), end: iso(daysAgo(GSC_LAG_DAYS)) };
}

/** La periode juste avant, de meme longueur, pour calculer une evolution. */
export function previousDays(days: number): DateRange {
  return {
    start: iso(daysAgo(days * 2 + GSC_LAG_DAYS)),
    end: iso(daysAgo(days + GSC_LAG_DAYS + 1)),
  };
}

/**
 * Depuis le debut de la collaboration, borne aux 16 mois que Search Console
 * conserve. Renvoie aussi si la periode a ete tronquee, pour le signaler.
 */
export function sinceStart(startDate?: string): DateRange & { truncated: boolean } {
  const floor = new Date();
  floor.setUTCMonth(floor.getUTCMonth() - GSC_MAX_MONTHS);

  const asked = startDate ? new Date(startDate) : floor;
  const truncated = asked < floor;

  return {
    start: iso(truncated ? floor : asked),
    end: iso(daysAgo(GSC_LAG_DAYS)),
    truncated,
  };
}

/**
 * GA4 n'a pas le retard de Search Console : ses donnees sont disponibles a
 * quelques heures pres. Lui appliquer le meme decalage ferait perdre trois
 * jours de ventes, ce qui se voit immediatement sur le CA.
 */
export function ga4LastDays(days: number): DateRange {
  return { start: iso(daysAgo(days)), end: iso(daysAgo(0)) };
}

export function ga4PreviousDays(days: number): DateRange {
  return { start: iso(daysAgo(days * 2)), end: iso(daysAgo(days + 1)) };
}

/** GA4 ne limite pas l'historique : on remonte reellement au debut. */
export function ga4SinceStart(startDate?: string): DateRange {
  const fallback = new Date();
  fallback.setUTCFullYear(fallback.getUTCFullYear() - 3);

  return { start: startDate ?? iso(fallback), end: iso(daysAgo(0)) };
}