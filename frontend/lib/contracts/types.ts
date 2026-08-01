/** Claim record returned by the GenResolve Intelligent Contract */
export interface Claim {
  id: number;
  creator: string;
  claim_text: string;
  evidence: string;
  stake: number | string;
  status: "Pending" | "Judged" | string;
  verdict: "True" | "False" | "Unverifiable" | "" | string;
  reasoning: string;
  confidence: number;
  created_at: string;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: unknown;
}

/** Normalize raw contract return into a Claim */
export function normalizeClaim(raw: unknown): Claim {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    creator: String(r.creator ?? ""),
    claim_text: String(r.claim_text ?? ""),
    evidence: String(r.evidence ?? ""),
    stake: (r.stake as number | string) ?? 0,
    status: String(r.status ?? "Pending"),
    verdict: String(r.verdict ?? ""),
    reasoning: String(r.reasoning ?? ""),
    confidence: Number(r.confidence ?? 0),
    created_at: String(r.created_at ?? ""),
  };
}
