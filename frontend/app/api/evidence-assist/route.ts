import { NextRequest, NextResponse } from "next/server";
import { getAssistConfig } from "@/lib/evidence-assist/config";
import {
  AssistServiceError,
  logAssistEvent,
  runEvidenceAssist,
} from "@/lib/evidence-assist/service";
import {
  checkDailyLimit,
  checkIpRateLimit,
  releaseConcurrency,
  tryAcquireConcurrency,
} from "@/lib/evidence-assist/rateLimit";
import type { AssistMode } from "@/lib/evidence-assist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function POST(req: NextRequest) {
  const cfg = getAssistConfig();
  const started = Date.now();
  const ip = clientIp(req);

  if (!cfg.enabled) {
    return NextResponse.json(
      {
        error: "Evidence Assist is disabled",
        code: "disabled",
      },
      { status: 503 }
    );
  }

  let body: {
    claimText?: string;
    mode?: string;
    url?: string;
    limit?: number;
    walletAddress?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "validation" },
      { status: 400 }
    );
  }

  const wallet =
    typeof body.walletAddress === "string" &&
    /^0x[a-fA-F0-9]{40}$/.test(body.walletAddress)
      ? body.walletAddress
      : null;

  // Rate limits
  const ipRl = checkIpRateLimit(ip, cfg.ipLimit, cfg.ipWindowMs);
  if (!ipRl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "rate_limit" },
      {
        status: 429,
        headers: { "Retry-After": String(ipRl.retryAfterSec) },
      }
    );
  }

  const dayKey = wallet ? `w:${wallet.toLowerCase()}` : `ip:${ip}`;
  const dayLimit = wallet ? cfg.walletDailyLimit : cfg.anonDailyLimit;
  const dayRl = checkDailyLimit(dayKey, dayLimit);
  if (!dayRl.ok) {
    return NextResponse.json(
      { error: "Daily assist quota exceeded", code: "quota" },
      {
        status: 429,
        headers: { "Retry-After": String(dayRl.retryAfterSec) },
      }
    );
  }

  const concKey = wallet ? wallet.toLowerCase() : ip;
  if (!tryAcquireConcurrency(concKey, cfg.maxConcurrencyPerKey)) {
    return NextResponse.json(
      { error: "Too many concurrent assist requests", code: "concurrency" },
      { status: 429, headers: { "Retry-After": "5" } }
    );
  }

  const mode = body.mode as AssistMode;
  try {
    const result = await runEvidenceAssist({
      claimText: body.claimText ?? "",
      mode,
      url: body.url,
      limit: body.limit,
      walletAddress: wallet,
    });

    logAssistEvent({
      requestId: result.requestId,
      ip,
      wallet,
      latencyMs: Date.now() - started,
      sourceCount: result.sources.length,
      mode: mode || "unknown",
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const latencyMs = Date.now() - started;
    if (e instanceof AssistServiceError) {
      logAssistEvent({
        requestId: "err",
        ip,
        wallet,
        latencyMs,
        sourceCount: 0,
        errorClass: e.code,
        mode: mode || "unknown",
      });
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.status }
      );
    }
    logAssistEvent({
      requestId: "err",
      ip,
      wallet,
      latencyMs,
      sourceCount: 0,
      errorClass: "internal",
      mode: mode || "unknown",
    });
    return NextResponse.json(
      { error: "Assist unavailable (try later)", code: "internal" },
      { status: 503 }
    );
  } finally {
    releaseConcurrency(concKey);
  }
}
