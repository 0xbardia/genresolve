import Link from "next/link";

export const metadata = {
  title: "Evidence Assist — GenResolve",
  description:
    "How optional off-chain source suggestions work on GenResolve Create.",
};

export default function EvidenceAssistDocsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 page-section">
      <div>
        <p className="eyebrow">Docs</p>
        <h1 className="display-title mt-2 text-2xl sm:text-3xl">
          Evidence Assist
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          Optional off-chain helper for the Create page. It suggests public
          sources for you to review — it does not verify claims or produce
          verdicts.
        </p>
      </div>

      <article className="glass-card p-6 sm:p-8 space-y-5 text-sm leading-relaxed text-[var(--text-secondary)]">
        <section>
          <h2 className="section-label text-[var(--text)]">How it works</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-2">
            <li>You write a clear claim (at least ~40 characters in the UI).</li>
            <li>
              Optionally click <strong className="text-[var(--text)]">Research sources</strong>.
            </li>
            <li>
              Our server fetches <strong className="text-[var(--text)]">public</strong>{" "}
              pages (and optional search if configured) with SSRF protections.
            </li>
            <li>
              You select sources and explicitly{" "}
              <strong className="text-[var(--text)]">Add selected to Evidence</strong>.
            </li>
            <li>
              Only the evidence you submit is stored on-chain. GenLayer validators
              judge that payload — not the assist service.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="section-label text-[var(--text)]">Privacy</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1.5">
            <li>We do not store your wallet private keys or cookies.</li>
            <li>We do not use cookie-based social logins for scraping.</li>
            <li>
              Server logs request metadata (rate limits, latency), not full page
              bodies.
            </li>
            <li>Assist is rate-limited to reduce abuse.</li>
          </ul>
        </section>

        <section>
          <h2 className="section-label text-[var(--text)]">What we do not do</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1.5">
            <li>No automatic judgment or “True/False” from the assist.</li>
            <li>No silent overwrite of your Evidence field.</li>
            <li>No shell scrapers or private social APIs in this product path.</li>
          </ul>
        </section>

        <p className="text-xs text-[var(--text-faint)]">
          Feature flag: assist is disabled in production until explicitly enabled
          after security review.
        </p>
      </article>

      <Link href="/create" className="btn btn-secondary min-h-11">
        Back to Create
      </Link>
    </div>
  );
}
