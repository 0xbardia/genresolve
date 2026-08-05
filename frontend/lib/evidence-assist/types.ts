export type AssistMode = "discover" | "enrich_url";

export interface AssistRequest {
  claimText: string;
  mode: AssistMode;
  url?: string;
  limit?: number;
  /** Optional wallet address for higher quota tracking (hashed in logs). */
  walletAddress?: string | null;
}

export interface AssistSource {
  id: string;
  url: string;
  title?: string;
  host: string;
  snippet: string;
  why?: string;
}

export interface AssistResponse {
  requestId: string;
  sources: AssistSource[];
  warnings: string[];
  cached: boolean;
}

export interface SafeFetchResult {
  finalUrl: string;
  host: string;
  contentType: string;
  body: string;
  status: number;
}
