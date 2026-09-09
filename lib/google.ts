import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

/**
 * Acces aux API Google au nom du compte OmniaRank.
 *
 * Pas de compte de service : il faudrait qu'un proprietaire confirme l'ajoute
 * sur chaque propriete Search Console, or elles appartiennent aux clients.
 * Le compte OmniaRank y a deja acces, donc l'application lit avec ses droits.
 *
 * Toute modification de cette liste impose de refaire l'autorisation sur
 * /api/google/connect : un refresh token ne gagne jamais de permission apres coup.
 */
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

export function oauthClient(redirectUri?: string): OAuth2Client {
  const id = process.env.AUTH_GOOGLE_ID;
  const secret = process.env.AUTH_GOOGLE_SECRET;

  if (!id || !secret) {
    throw new Error("AUTH_GOOGLE_ID ou AUTH_GOOGLE_SECRET manquante dans .env.local");
  }

  return new google.auth.OAuth2(id, secret, redirectUri);
}

export function googleAuth(): OAuth2Client {
  const token = process.env.GOOGLE_REFRESH_TOKEN;

  if (!token) {
    throw new Error("GOOGLE_REFRESH_TOKEN manquante. Ouvrez /api/google/connect pour l'obtenir.");
  }

  const client = oauthClient();
  client.setCredentials({ refresh_token: token });
  return client;
}