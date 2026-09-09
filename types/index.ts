export type Sector =
  | "bien-etre"
  | "beaute"
  | "retail"
  | "sante"
  | "b2b-services"
  | "industrie"
  | "association";

export type Cms =
  | "Shopify"
  | "WordPress"
  | "Framer"
  | "Webflow"
  | "Contentful"
  | "Hubspot"
  | "Custom";

export type Client = {
  id: string;
  name: string;
  domain: string;
  sector: Sector;
  cms: Cms;
  /** Determine si le CA peut etre remonte. Faux = colonne vide, jamais d'estimation. */
  ecommerce: boolean;
  /** Segment d'URL identifiant nos articles. Par defaut "blog", suffisant sur Shopify. */
  blogPrefix?: string;
  /** Debut de la collaboration, au format AAAA-MM-JJ. Sert au cumul. */
  startDate?: string;
  gscProperty: string;
  ga4PropertyId: string;
  owner: string;
  active: boolean;
};

export type Metric = {
  clicks: number;
  impressions: number;
  position: number;
};

export type MetricWithTrend = Metric & {
  previous: Metric;
};

export type DateRange = {
  start: string;
  end: string;
};

export type PageRow = Metric & {
  url: string;
};

/** Une page du site, avec son evolution, son cumul et le revenu qu'elle a genere. */
export type PageBreakdownRow = {
  url: string;
  path: string;
  /** Vrai si la page figure dans le suivi d'indexation : c'est un de nos articles. */
  isArticle: boolean;
  title: string;
  clicks: number;
  impressions: number;
  position: number;
  previous: Metric;
  cumulativeClicks: number;
  cumulativeImpressions: number;
  cumulativePosition: number;
  revenue: number | null;
  revenueTotal: number | null;
};

export type Revenue = {
  amount: number;
  previous: number;
};

export type ClientSummary = {
  client: Client;
  site: MetricWithTrend;
  articles: MetricWithTrend;
  articleCount: number;
  /** Articles produits selon le suivi, meme non encore vus par Search Console. */
  producedCount: number;
  articlesCumulative: Metric | null;
  revenue: Revenue | null;
  revenueTotal: number | null;
};