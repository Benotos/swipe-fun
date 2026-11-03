import { NextResponse } from "next/server";
import { SogoApiError, sogoPost } from "@/lib/providers/sogo";

export const dynamic = "force-dynamic";

const IDEMPOTENCY_KEY = "8a1e7352-9f4c-4d80-9d59-7fa0a2c17b10";

async function reserveSandboxPurchase(): Promise<boolean> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) return false;

  // One global sandbox purchase probe. SET NX means refreshes cannot submit
  // another test transaction, even if the client retries this route.
  const response = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + redisToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(["SET", "swipe:sogo:purchase-diagnostic:v1", "reserved", "NX", "EX", "60"]),
    cache: "no-store"
  });
  if (!response.ok) return false;
  const payload = await response.json();
  return payload.result === "OK";
}

/**
 * One fixed, idempotent sandbox purchase test for Amazon US $10.
 * Sogo sandbox simulates this operation; it does not contact real suppliers
 * or move real funds. The stable idempotency key prevents duplicate orders.
 */
export async function GET() {
  try {
    if (!await reserveSandboxPurchase()) {
      return NextResponse.json({
        provider: "sogo",
        environment: "sandbox",
        operation: "gift-cards/buy",
        error: "The one-time sandbox purchase probe has already run or the rate limiter is unavailable.",
        sandboxOnly: true,
        realMoneyMovement: false
      }, { status: 429, headers: { "Cache-Control": "no-store" } });
    }

    const request = {
      product_id: 5,
      country_code: "US",
      amount: 10,
      quantity: 1,
      expected_amount_ngn: 14564.2
    };

    const result = await sogoPost<unknown>(
      "gift-cards/buy",
      request,
      IDEMPOTENCY_KEY,
      "write"
    );

    return NextResponse.json({
      provider: "sogo",
      environment: "sandbox",
      operation: "gift-cards/buy",
      request,
      status: result.status,
      data: result.data,
      sandboxOnly: true,
      realMoneyMovement: false,
      note: "Sandbox purchases are asynchronous. The initial response is not proof of delivery; wait for the final transaction event."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SogoApiError) {
      return NextResponse.json({
        provider: "sogo",
        environment: "sandbox",
        operation: "gift-cards/buy",
        error: error.message,
        providerStatus: error.status,
        details: error.payload,
        sandboxOnly: true,
        realMoneyMovement: false
      }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to test Sogo sandbox purchase.",
      sandboxOnly: true,
      realMoneyMovement: false
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
