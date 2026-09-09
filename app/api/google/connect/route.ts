import { GOOGLE_SCOPES, oauthClient } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const redirectUri = new URL("/api/google/callback", request.url).toString();

  const url = oauthClient(redirectUri).generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
  });

  return Response.redirect(url);
}