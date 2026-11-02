import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SogoCheck = {
  ok: boolean;
  status: number;
  data: unknown;
};

async function checkEndpoint(baseUrl: string, path: string, apiKey: string): Promise<SogoCheck> {
  const response = await fetch(new URL(path, `${baseUrl.replace(/\/+$/, "")}/`), {
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
 * It never creates an order or moves funds.
 * Protect with the existing CRON_SECRET so the sandbox API key cannot be
 * abused by anonymous visitors.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const [countries, products] = await Promise.all([
      checkEndpoint(baseUrl, "gift-cards/buy/countries", readKey),
      checkEndpoint(baseUrl, "gift-cards/buy/products", readKey)
    ]);

    return NextResponse.json({
      environment: "sandbox",
      readOnly: true,
      checks: { countries, products }
    }, {
      status: countries.ok || products.ok ? 200 : 502,
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return NextResponse.json({
      error: "Could not reach Sogo sandbox. Check the base URL and try again."
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
