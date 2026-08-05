export function EvidenceTrustNote() {
  return (
    <div
      className="rounded-[var(--radius-sm)] border border-[rgba(201,162,39,0.3)] bg-[rgba(201,162,39,0.05)] px-3 py-2.5 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]"
      role="note"
    >
      Research Assist suggests public sources for review only. It is{" "}
      <strong className="text-[var(--text)]">off-chain</strong> and not verified
      by GenResolve. Only the evidence you submit is considered by validators.{" "}
      <a
        href="/docs/evidence-assist"
        className="text-[var(--violet-bright)] underline-offset-2 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        How research assist works
      </a>
    </div>
  );
}
