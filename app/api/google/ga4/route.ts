import { google } from "googleapis";
import { googleAuth } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = google.analyticsadmin({ version: "v1beta", auth: googleAuth() });
  const res = await admin.accountSummaries.list({ pageSize: 200 });

  const lines = (res.data.accountSummaries ?? []).flatMap((a) =>
    (a.propertySummaries ?? []).map(
      (p) => `${p.property?.replace("properties/", "")}  ${p.displayName}  (${a.displayName})`
    )
  );

  return new Response(lines.join("\n") || "Aucune propriete visible.", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}