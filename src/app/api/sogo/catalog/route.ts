import { NextRequest, NextResponse } from "next/server";
import { SogoApiError, sogoGet } from "@/lib/providers/sogo";

export const dynamic = "force-dynamic";

async function reserveReadSlot(): Promise<boolean> {
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
    body: JSON.stringify(["EVAL", script, "1", "swipe:sogo:catalog:global", "60"]),
    cache: "no-store"
  });
  if (!response.ok) return false;

  const payload = await response.json();
  if (payload.error) return false;
  // Keep headroom below Sogo's documented 10 requests/minute sandbox limit.
  return Number(payload.result) <= 8;
}

export async function GET(request: NextRequest) {
  const countryCode = (request.nextUrl.searchParams.get("country_code") || "NG").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return NextResponse.json({ error: "country_code must be a two-letter ISO country code." }, { status: 400 });
  }

  try {
    if (!await reserveReadSlot()) {
      return NextResponse.json({
        error: "Sogo catalogue rate limit reached or rate limiter unavailable. Try again in a minute."
      }, { status: 429 });
    }

    const result = await sogoGet<unknown>(
      "gift-cards/buy/products",
      { country_code: countryCode }
    );

    return NextResponse.json({
      provider: "sogo",
      environment: "sandbox",
      countryCode,
      status: result.status,
      data: result.data
    }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    if (error instanceof SogoApiError) {
      return NextResponse.json({
        error: error.message,
        providerStatus: error.status,
        details: error.payload
      }, { status: error.status });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to load Sogo catalogue."
    }, { status: 503 });
  }
}
