/**
 * Seuils de déclenchement des alertes.
 *
 * Chaque règle porte un seuil de variation ET un volume minimum. Le volume est
 * le réglage le plus important : sans lui, un client passant de 8 à 5 clics
 * déclenche une alerte à −37 % qui ne veut rien dire. Une alerte qui se
 * déclenche pour rien est pire que pas d'alerte, parce qu'on cesse de les lire.
 *
 * Les pourcentages sont des variations sur 7 jours glissants, comparés aux
 * 7 jours précédents.
 */
export const ALERT_RULES = {
  /** Chute des clics sur nos articles : notre sujet direct. */
  articleClicksDrop: { threshold: -25, minClicks: 100 },

  /** Chute du site entier : souvent une cause technique ou saisonnière. */
  siteClicksDrop: { threshold: -30, minClicks: 500 },

  /** Progression de nos articles : à signaler au client. */
  articleClicksRise: { threshold: 30, minClicks: 100 },

  /** Chute du chiffre d'affaires généré par nos articles. */
  revenueDrop: { threshold: -25, minAmount: 200 },

  /** Progression du chiffre d'affaires généré par nos articles. */
  revenueRise: { threshold: 25, minAmount: 200 },

  /**
   * Nos articles baissent alors que le site tient : le problème vient de nos
   * contenus et non d'une cause externe. C'est l'alerte la plus actionnable.
   */
  diverging: { articleDrop: -20, siteFloor: -5, minClicks: 100 },
} as const;

/**
 * Ancienneté minimale d'un client avant de déclencher une alerte négative.
 *
 * Un article fraîchement publié reçoit une poussée initiale de Google puis
 * retombe : sans ce délai, un client démarré le mois dernier déclencherait un
 * décrochage toutes les semaines. Les alertes positives, elles, restent
 * actives — une progression au premier mois est une vraie bonne nouvelle.
 *
 * Repose sur `startDate` dans config/clients.ts. Un client sans date est
 * considéré comme ancien.
 */
export const MIN_HISTORY_DAYS = 60;
