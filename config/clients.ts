import type { Client } from "@/types";

/**
 * Table de correspondance des clients.
 *
 * `gscProperty` est copiée telle quelle depuis Search Console :
 * soit "https://exemple.com/" (préfixe d'URL), soit "sc-domain:exemple.com" (domaine).
 *
 * `ga4PropertyId` est l'identifiant de propriété, pas l'ID de flux ni le code de
 * mesure en G-. La liste des propriétés accessibles s'obtient sur /api/google/ga4.
 * Vide quand le client n'a pas de suivi e-commerce ou qu'on n'a pas l'accès :
 * la colonne CA reste vide, on n'affiche jamais d'estimation.
 */
export const CLIENTS: Client[] = [
  // E-commerce
  { id: "mft", name: "Maison FT", domain: "maisonft.com", sector: "retail", cms: "Shopify", ecommerce: true, gscProperty: "https://www.maisonft.com/", ga4PropertyId: "375028281", owner: "", active: true },
  { id: "joi", name: "JOÏSTA", domain: "joista.com", sector: "complément", cms: "Shopify", ecommerce: true, gscProperty: "https://joista.com/", ga4PropertyId: "476376599", owner: "", active: true },
  { id: "mor", name: "Morphée", domain: "morphee.co", sector: "retail", cms: "Shopify", ecommerce: true, gscProperty: "sc-domain:morphee.co", ga4PropertyId: "365431125", owner: "", active: true },
  { id: "tok", name: "Tokidos", domain: "tokidos.com", sector: "retail", cms: "Shopify", ecommerce: true, gscProperty: "sc-domain:tokidos.com", ga4PropertyId: "425985836", owner: "", active: true },
  { id: "dem", name: "Demain Beauty", domain: "demainbeauty.com", sector: "beaute", cms: "Shopify", ecommerce: true, gscProperty: "sc-domain:demainbeauty.com", ga4PropertyId: "361658016", owner: "", active: true },
  { id: "aos", name: "AOSOM", domain: "aosom.fr", sector: "retail", cms: "Custom", ecommerce: true, gscProperty: "https://www.aosom.fr/", ga4PropertyId: "297589821", owner: "", active: true },
  { id: "mab", name: "Marc-Antoine Barrois", domain: "marcantoinebarrois.com", sector: "parfum", cms: "Shopify", ecommerce: true, gscProperty: "https://marcantoinebarrois.com/", ga4PropertyId: "404921902", owner: "", active: true },
  { id: "chi", name: "Chillow", domain: "mychillow.fr", sector: "retail", cms: "Shopify", ecommerce: true, gscProperty: "https://mychillow.fr/", ga4PropertyId: "", owner: "", active: true },
  { id: "kin", name: "Kinetik Adrenalink", domain: "kinetikadrenalink.com", sector: "retail", cms: "Shopify", ecommerce: true, gscProperty: "sc-domain:kinetikadrenalink.com", ga4PropertyId: "327854036", owner: "", active: true },
  { id: "joy", name: "JOYA Home", domain: "joya-home.com", sector: "retail", cms: "Shopify", ecommerce: true, gscProperty: "sc-domain:joya-home.com", ga4PropertyId: "506450323", owner: "", active: true },

  // À confirmer : e-commerce ou non ? Passer ecommerce à true pour voir le CA.
  { id: "mdc", name: "Mademoiselle Culotte", domain: "mademoiselleculotte.com", sector: "retail", cms: "Shopify", ecommerce: true, gscProperty: "sc-domain:mademoiselleculotte.com", ga4PropertyId: "254475854", owner: "", active: true },
  { id: "mer", name: "Merveil Paris", domain: "merveil-paris.com", sector: "retail", cms: "Shopify", ecommerce: false, gscProperty: "sc-domain:merveil-paris.com", ga4PropertyId: "466978829", owner: "", active: true },
  { id: "daf", name: "Daftime", domain: "daftime.ae", sector: "retail", cms: "Shopify", ecommerce: false, gscProperty: "https://daftime.ae/", ga4PropertyId: "519889993", owner: "", active: true },

  // Sans e-commerce — GA4 renseigné pour l'audience, pas pour le CA
  { id: "che", name: "CHERICO", domain: "cherico.fr", sector: "food", cms: "Shopify", ecommerce: true, gscProperty: "https://www.cherico.fr/", ga4PropertyId: "425277309", owner: "", active: true },
  { id: "oka", name: "Okalys", domain: "okalys.com", sector: "b2b-services", cms: "WordPress", ecommerce: false, gscProperty: "sc-domain:okalys.com", ga4PropertyId: "327853695", owner: "", active: true },
  { id: "bon", name: "Bon Talent", domain: "bontalent.fr", sector: "b2b-services", cms: "WordPress", ecommerce: false, gscProperty: "https://bontalent.fr", ga4PropertyId: "311647525", owner: "", active: true },
  { id: "pri", name: "Print and Pack", domain: "printandpackeu.com", sector: "industrie", cms: "WordPress", ecommerce: false, gscProperty: "https://printandpackeu.com/", ga4PropertyId: "441912094", owner: "", active: true },
  { id: "cap", name: "Cap Résidences Seniors", domain: "capresidencesseniors.com", sector: "sante", cms: "WordPress", ecommerce: false, gscProperty: "https://www.capresidencesseniors.com/", ga4PropertyId: "", owner: "", active: true },
  { id: "mps", name: "Maisons et Pôles de Santé", domain: "maisons-et-poles-de-sante.com", sector: "sante", cms: "WordPress", ecommerce: false, gscProperty: "https://www.maisons-et-poles-de-sante.com/", ga4PropertyId: "495082314", owner: "", active: true },
  { id: "mas", name: "Mashup Web Social", domain: "mashup-web.com", sector: "b2b-services", cms: "Webflow", ecommerce: false, gscProperty: "sc-domain:mashup-web.com", ga4PropertyId: "428276156", owner: "", active: true },
  { id: "alz", name: "Fondation Alzheimer", domain: "alzheimer-recherche.org", sector: "association", cms: "WordPress", ecommerce: false, gscProperty: "sc-domain:alzheimer-recherche.org", ga4PropertyId: "398976673", owner: "", active: true },
  { id: "voo", name: "Vook", domain: "vook.ai", sector: "SaaS", cms: "Webflow", ecommerce: false, gscProperty: "https://www.vook.ai/", ga4PropertyId: "384070889", owner: "", active: true },
  { id: "ult", name: "Ultra Strategy", domain: "ultrastrategy.com", sector: "b2b-services", cms: "WordPress", ecommerce: false, gscProperty: "sc-domain:ultrastrategy.com", ga4PropertyId: "497700698", owner: "", active: false },
  { id: "cci", name: "Capiconsult Nord", domain: "capiconsultnord.com", sector: "b2b-services", cms: "WordPress", ecommerce: false, gscProperty: "https://capiconsultnord.com/", ga4PropertyId: "538613968", owner: "", active: true },
  { id: "key", name: "Keyrus", domain: "web.keyrus.com", sector: "b2b-services", cms: "Custom", ecommerce: false, gscProperty: "https://web.keyrus.com/", ga4PropertyId: "", owner: "", active: false },
  { id: "bra", name: "Brainologist", domain: "brainologist.fr", sector: "sante", cms: "WordPress", ecommerce: false, gscProperty: "https://brainologist.fr", ga4PropertyId: "467663639", owner: "", active: false },
  { id: "msp", name: "My Supplier Profile", domain: "mysupplierprofile.com", sector: "b2b-services", cms: "WordPress", ecommerce: false, gscProperty: "https://mysupplierprofile.com/", ga4PropertyId: "520274873", owner: "", active: true },
  { id: "pan", name: "Pandat", domain: "pandat.fr", sector: "b2b-services", cms: "WordPress", ecommerce: false, gscProperty: "sc-domain:pandat.fr", ga4PropertyId: "507594283", owner: "", active: true },
  { id: "hcm", name: "HCM Advisor", domain: "hcm-advisor.com", sector: "b2b-services", cms: "WordPress", ecommerce: false, gscProperty: "https://www.hcm-advisor.com/", ga4PropertyId: "341841194", owner: "", active: true },
  { id: "omn", name: "OmniaRank", domain: "omniarank.com", sector: "b2b-services", cms: "Webflow", ecommerce: false, gscProperty: "sc-domain:omniarank.com", ga4PropertyId: "508573258", owner: "", active: true },
];

export function getClient(id: string): Client | null {
  return CLIENTS.find((c) => c.id === id) ?? null;
}

/** Les clients dont la propriété Search Console n'est pas renseignée sont ignorés. */
export function readableClients(): Client[] {
  return CLIENTS.filter((c) => c.active && c.gscProperty !== "");
}