/**
 * Chain-of-custody spine (design §4.4) — the sequential pipeline.
 * A 1px vertical line with numbered circle markers; numbers are rendered by
 * CSS `content: attr(data-n)` exactly like the mockup. This is the ONE place
 * sequential numbering belongs — validators use Roman numerals instead (§4.5).
 */
export function CustodySpine({
  steps,
}: {
  steps: { title: string; body: string }[];
}) {
  return (
    <div className="spine">
      {steps.map((s, i) => (
        <div className="spine-step" data-n={String(i + 1)} key={s.title}>
          <h3>{s.title}</h3>
          <p>{s.body}</p>
        </div>
      ))}
    </div>
  );
}
