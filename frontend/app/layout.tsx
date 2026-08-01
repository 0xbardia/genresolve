import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "GenResolve — AI-judged claims on GenLayer",
  description:
    "GenResolve: public on-chain ledger of claims judged by AI consensus on GenLayer. Submit claims, stake GEN, and record True, False, or Unverifiable permanently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="page-shell flex-1 py-8 sm:py-10 md:py-12">
              {children}
            </main>
            <footer className="border-t border-[var(--border)] py-5">
              <div className="page-shell flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-[var(--text-faint)]">
                  GenResolve · Permanent claims · AI consensus
                </p>
                <div className="flex items-center gap-5 text-xs text-[var(--text-muted)]">
                  <a
                    className="transition-colors hover:text-[var(--violet-bright)]"
                    href="https://genlayer.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    GenLayer
                  </a>
                  <a
                    className="transition-colors hover:text-[var(--violet-bright)]"
                    href="https://docs.genlayer.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Docs
                  </a>
                  <a
                    className="transition-colors hover:text-[var(--violet-bright)]"
                    href="https://studio.genlayer.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Studio
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
