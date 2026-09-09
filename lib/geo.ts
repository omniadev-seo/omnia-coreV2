import type { Client } from "@/types";

export type GeoVisibility = {
  /** Part des prompts suivis ou la marque apparait, en pourcentage. */
  share: number;
  /** Ecart en points depuis le scan precedent. */
  trend: number;
  scannedAt: string;
};

/**
 * Suivi de visibilite dans les LLM.
 *
 * Volontairement vide en V1 : le fournisseur va changer (Mentionable puis Qwairy).
 * Le reste de l'application appelle uniquement cette fonction ; le jour du
 * changement, seul ce fichier est reecrit.
 *
 * Anticiper ici est justifie parce que le changement est certain, pas suppose.
 */
export async function geoVisibility(_client: Client): Promise<GeoVisibility | null> {
  return null;
}
