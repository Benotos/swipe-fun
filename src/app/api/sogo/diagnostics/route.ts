import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SogoCheck = {
  ok: boolean;
  status: number;
  data: unknown;
};

async function reserveDiagnosticSlot(): Promise<boolean> {
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
    body: JSON.stringify(["EVAL", script, "1", "swipe:sogo:diagnostic:global", "60"]),
    cache: "no-store"
  });
  if (!response.ok) return false;

  const payload = await response.json();
  if (payload.error) return false;
  return Number(payload.result) <= 4;
}

async function checkEndpoint(baseUrl: string, path: string, apiKey: string, params?: Record<string, string>): Promise<SogoCheck> {
  const url = new URL(path, `${baseUrl.replace(/\/+$/, "")}/`);
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, value);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000)
  });

  const raw = await response.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { message: raw.slice(0, 1000) };
  }

  return { ok: response.ok, status: response.status, data };
}

/**
 * Read-only Sogo sandbox diagnostic.
 * It fetches the country list and compares buy catalogues for NG and US.
 * It never creates an order or moves funds.
 */
export async function GET() {
  const baseUrl = process.env.SOGO_BASE_URL;
  const readKey = process.env.SOGO_GIFT_READ_KEY;

  if (!baseUrl || !readKey) {
    return NextResponse.json({
      error: "Missing SOGO_BASE_URL or SOGO_GIFT_READ_KEY environment variable."
    }, { status: 503 });
  }

  let parsedBase: URL;
  try {
    parsedBase = new URL(baseUrl);
  } catch {
    return NextResponse.json({ error: "SOGO_BASE_URL is not a valid URL." }, { status: 503 });
  }

  if (parsedBase.protocol !== "https:" || parsedBase.hostname !== "sandbox.sogo.africa" || !parsedBase.pathname.replace(/\/+$/, "").endsWith("/v1")) {
    return NextResponse.json({
      error: "This diagnostic only allows the Sogo sandbox URL https://sandbox.sogo.africa/v1."
    }, { status: 400 });
  }

  if (!readKey.startsWith("sogo_sk_test_")) {
    return NextResponse.json({
      error: "SOGO_GIFT_READ_KEY must contain a Sogo sandbox secret key (sogo_sk_test_...)."
    }, { status: 400 });
  }

  try {
    if (!await reserveDiagnosticSlot()) {
      return NextResponse.json({
        error: "Sogo diagnostic rate limit reached or Redis rate limiter unavailable. Try again in a minute."
      }, { status: 429 });
    }

    const [countries, nigeriaProducts, usProducts] = await Promise.all([
      checkEndpoint(baseUrl, "gift-cards/buy/countries", readKey),
      checkEndpoint(baseUrl, "gift-cards/buy/products", readKey, { country_code: "NG" }),
      checkEndpoint(baseUrl, "gift-cards/buy/products", readKey, { country_code: "US" })
    ]);

    return NextResponse.json({
      environment: "sandbox",
      readOnly: true,
      note: "Product catalogue requests use the required country_code parameter.",
      checks: {
        countries,
        productsByCountry: {
          NG: nigeriaProducts,
          US: usProducts
        }
      }
    }, {
      status: countries.ok || nigeriaProducts.ok || usProducts.ok ? 200 : 502,
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return NextResponse.json({
      error: "Could not reach Sogo sandbox. Check the base URL and try again."
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
