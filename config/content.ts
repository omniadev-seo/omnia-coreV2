/**
 * Source des articles produits par l'agence.
 *
 * Le suivi d'indexation est tenu a jour chaque mois : c'est lui qui dit ce qui
 * est a nous, pas un filtre sur l'URL. Le code n'a plus a etre modifie quand
 * de nouveaux articles sortent.
 *
 * La colonne Client du Sheet n'est PAS utilisee : une quarantaine de lignes y
 * portent le mauvais nom. Le rattachement se fait par le domaine de l'URL,
 * ce qui rend les erreurs de saisie sans consequence.
 */
export const CONTENT_SHEET = {
  spreadsheetId: "1Q0cH5Ucc9bRKvYvDk3UEPv41F64SBhZJvcg36Grh3Fg",
  /** Colonnes A a H : Client, Lien, Statut, Date, Titre, Indexe, Motif, Derniere verif */
  range: "suivi indexation!A:H",
  /** Position des colonnes utiles, en partant de 0. */
  columns: { url: 1, status: 2, title: 4 },
};