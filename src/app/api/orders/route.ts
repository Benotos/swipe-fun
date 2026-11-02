import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CATALOG, PRICE_LOCK_SECONDS, GENESIS_TOTAL } from "@/lib/catalog";
import { paymentProvider } from "@/lib/providers/payment";
import { getCount, saveOrder, increment } from "@/lib/store";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const item = CATALOG.find(entry => entry.id === body.itemId);
    if (!item) return NextResponse.json({ error: "Choose a valid catalog item." }, { status: 400 });

    const quoteResponse = await fetch(new URL("/api/catalog", request.url), { cache: "no-store" });
    if (!quoteResponse.ok) return NextResponse.json({ error: "Unable to lock a SOL quote right now." }, { status: 503 });
    const quote = await quoteResponse.json();
    const quotedItem = quote.items.find((entry: { id: string }) => entry.id === item.id);
    if (!quotedItem) return NextResponse.json({ error: "Item pricing is unavailable." }, { status: 503 });

    const [sold, reserved] = await Promise.all([getCount("stock:sold"), getCount("stock:reserved")]);
    if (sold + reserved >= GENESIS_TOTAL) return NextResponse.json({ error: "The Genesis drop is sold out." }, { status: 409 });

    const id = randomUUID();
    const expiresAt = new Date(Date.now() + PRICE_LOCK_SECONDS * 1000);
    const deposit = await paymentProvider.createDepositAddress({ orderId: id, amountSol: quotedItem.solAmount });
    const order: Order = {
      id, itemId: item.id, brand: item.brand, valueUsd: item.valueUsd,
      solAmount: quotedItem.solAmount, depositAddress: deposit.address,
      status: "waiting", paymentMode: "mock", createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    await saveOrder(order);
    await increment("stock:reserved");

    return NextResponse.json({
      id: order.id, status: order.status, item: { brand: order.brand, valueUsd: order.valueUsd },
      address: order.depositAddress, solAmount: order.solAmount, expiresAt: order.expiresAt,
      priceLockSeconds: PRICE_LOCK_SECONDS, paymentMode: "mock",
      notice: "Demo only. This address cannot receive SOL and no real payment will be detected."
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create order.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
