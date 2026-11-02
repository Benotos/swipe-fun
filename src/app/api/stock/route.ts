import { NextResponse } from "next/server";
import { GENESIS_TOTAL } from "@/lib/catalog";
import { getInventory } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const inventory = await getInventory();
    const total = Math.max(0, Number(process.env.STOCK_TOTAL ?? GENESIS_TOTAL));
    const sold = Math.min(total, inventory.sold);
    const reserved = Math.min(Math.max(0, total - sold), inventory.reserved);
    const remaining = Math.max(0, total - sold - reserved);

    return NextResponse.json(
      { total, sold, reserved, remaining, source: inventory.source },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Live inventory is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
