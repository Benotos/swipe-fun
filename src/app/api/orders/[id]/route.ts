import { NextResponse } from "next/server";
import { getOrder, saveOrder, releaseReservation } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const order = await getOrder(id);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    if (order.status === "waiting" && Date.now() >= new Date(order.expiresAt).getTime()) {
      order.status = "expired";
      await saveOrder(order);
      await releaseReservation(order.id);
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
      item: { brand: order.brand, valueUsd: order.valueUsd },
      solAmount: order.solAmount,
      expiresAt: order.expiresAt,
      giftCardCode: order.status === "delivered" ? order.giftCardCode : undefined,
      failureReason: order.failureReason,
      paymentMode: order.paymentMode
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Unable to retrieve order." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
