import { oauthClient } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return new Response("Code d'autorisation absent.", { status: 400 });

  const redirectUri = new URL("/api/google/callback", request.url).toString();
  const { tokens } = await oauthClient(redirectUri).getToken(code);

  if (!tokens.refresh_token) {
    return new Response(
      "Aucun refresh token renvoye. Revoquez l'acces sur https://myaccount.google.com/permissions puis recommencez.",
      { headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  return new Response(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}