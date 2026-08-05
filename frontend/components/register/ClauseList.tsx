/**
 * Clause list — "why it exists" (design §4.3).
 * A single vertical list of §N rows with full-width hairline dividers.
 * Deliberately NOT icon-cards in a grid: it reads like clauses in a document.
 */
export function ClauseList({
  clauses,
}: {
  clauses: { num: string; title: string; body: string }[];
}) {
  return (
    <div className="clauses">
      {clauses.map((c) => (
        <div className="clause" key={c.num}>
          <div className="num">{c.num}</div>
          <div>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
