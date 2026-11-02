import { NextRequest, NextResponse } from "next/server";
import { paymentProvider } from "@/lib/providers/payment";
import { giftCardProvider } from "@/lib/providers/gift-cards";

/**
 * Payment watcher entry point. Configure a Vercel Cron schedule and CRON_SECRET.
 * The mock adapter intentionally reports no deposits. Replace it with an
 * approved Solana RPC or webhook implementation before accepting payments.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  void paymentProvider;
  void giftCardProvider;
  return NextResponse.json({ ok: true, mode: "mock", message: "Watcher is wired. Mock provider does not detect or confirm payments." });
}
