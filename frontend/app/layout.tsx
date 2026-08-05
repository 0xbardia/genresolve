import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  variable: "--font-fraunces",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  variable: "--font-plex-mono",
});
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "GenResolve — AI-judged claims on GenLayer",
  description:
    "GenResolve: public on-chain ledger of claims judged by AI consensus on GenLayer. Submit claims, stake GEN, and record True, False, or Unverifiable permanently.",
};

const FOOTER_LINKS = [
  { href: "https://genlayer.com", label: "GenLayer" },
  { href: "https://docs.genlayer.com", label: "Docs" },
  { href: "https://studio.genlayer.com", label: "Studio" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body { background:#0e1512; color:#ebede9; }
              .masthead { min-height:24px; line-height:24px; }
              .hero { display:grid; grid-template-columns:1.1fr .9fr; gap:56px; align-items:start; }
              .hero h1 { font-family:var(--font-fraunces), Georgia, serif; font-weight:600; line-height:1.06; }
              .hero .lede { color:#8e988f; }
              @media (max-width:860px) { .hero { grid-template-columns:1fr; gap:40px; } }
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="page-shell flex-1 py-8 sm:py-10 md:py-12">
              {children}
            </main>
            <footer className="app-footer">
              <div className="page-shell flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="footer-brand">
                  <span className="brand-mark">GR</span>
                  Gen<span className="accent">Resolve</span>
                </div>
                <div className="flinks">
                  {FOOTER_LINKS.map((l) => (
                    <a
                      key={l.href}
                      className="inline-flex min-h-11 items-center"
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
                <p className="fnote">AI-JUDGED CLAIMS ON GENLAYER</p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
