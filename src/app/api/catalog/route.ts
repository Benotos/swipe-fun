import { NextResponse } from "next/server";
import { CATALOG, PRICE_LOCK_SECONDS } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", { next: { revalidate: 45 } });
    if (!response.ok) throw new Error("Quote unavailable");
    const data = await response.json();
    const solUsd = Number(data?.solana?.usd);
    if (!Number.isFinite(solUsd) || solUsd <= 0) throw new Error("Invalid SOL quote");
    return NextResponse.json({
      solUsd,
      priceLockSeconds: PRICE_LOCK_SECONDS,
      items: CATALOG.map(item => ({ ...item, solAmount: Number((item.valueUsd / solUsd).toFixed(6)) })),
      quotedAt: new Date().toISOString()
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Live SOL pricing is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
