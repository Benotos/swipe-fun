import { NextResponse } from "next/server";
import { SogoApiError, sogoPost } from "@/lib/providers/sogo";

export const dynamic = "force-dynamic";

async function reserveQuoteDiagnostic(): Promise<boolean> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) return false;

  const script = [
    "local count = redis.call('INCR', KEYS[1])",
    "if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
    "return count"
  ].join("\n");

  const response = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(["EVAL", script, "1", "swipe:sogo:quote-diagnostic:global", "60"]),
    cache: "no-store"
  });
  if (!response.ok) return false;

  const payload = await response.json();
  return !payload.error && Number(payload.result) <= 1;
}

/**
 * One sandbox quote probe for Amazon US $10.
 * This calls only /buy/calculate; it cannot place or pay for a gift-card order.
 * The request payload is intentionally isolated here until Sogo confirms its schema.
 */
export async function GET() {
  try {
    if (!await reserveQuoteDiagnostic()) {
      return NextResponse.json({
        error: "Quote diagnostic already used in the last minute or rate limiter unavailable."
      }, { status: 429 });
    }

    const result = await sogoPost<unknown>("gift-cards/buy/calculate", {
      product_id: 5,
      country_code: "US",
      amount: 10,
      quantity: 1
    }, undefined, "read");

    return NextResponse.json({
      provider: "sogo",
      environment: "sandbox",
      operation: "gift-cards/buy/calculate",
      request: {
        product_id: 5,
        country_code: "US",
        amount: 10,
        quantity: 1
      },
      status: result.status,
      data: result.data,
      readOnlyQuote: true
    }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    if (error instanceof SogoApiError) {
      return NextResponse.json({
        provider: "sogo",
        environment: "sandbox",
        operation: "gift-cards/buy/calculate",
        error: error.message,
        providerStatus: error.status,
        details: error.payload,
        readOnlyQuote: true
      }, { status: error.status });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to test Sogo quote API.",
      readOnlyQuote: true
    }, { status: 503 });
  }
}
