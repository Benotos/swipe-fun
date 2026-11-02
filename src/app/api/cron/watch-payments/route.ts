import { NextRequest, NextResponse } from "next/server";
import { getWaitingOrders, saveOrder, releaseReservation } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const waitingOrders = await getWaitingOrders();
    let expired = 0;

    for (const order of waitingOrders) {
      if (Date.now() < new Date(order.expiresAt).getTime()) continue;
      order.status = "expired";
      await saveOrder(order);
      await releaseReservation(order.id);
      expired += 1;
    }

    return NextResponse.json({
      ok: true,
      mode: "mock",
      checked: waitingOrders.length,
      expired,
      message: "Expired demo orders are cleaned up. Real Solana monitoring and gift card delivery still require provider integration."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Order watcher could not complete." }, { status: 503 });
  }
}
