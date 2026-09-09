import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omnia Core",
  description: "Pilotage de la performance clients OmniaRank",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans text-sm antialiased">{children}</body>
    </html>
  );
}
