import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CATALOG, PRICE_LOCK_SECONDS, GENESIS_TOTAL } from "@/lib/catalog";
import { paymentProvider } from "@/lib/providers/payment";
import { reserveInventory, releaseReservation, saveOrder } from "@/lib/store";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let reservationId: string | null = null;

  try {
    const body = await request.json();
    if (!body || typeof body.itemId !== "string") {
      return NextResponse.json({ error: "Choose a valid gift card." }, { status: 400 });
    }

    const item = CATALOG.find(entry => entry.id === body.itemId);
    if (!item) return NextResponse.json({ error: "Choose a valid catalog item." }, { status: 400 });

    const quoteResponse = await fetch(new URL("/api/catalog", request.url), { cache: "no-store" });
    if (!quoteResponse.ok) {
      return NextResponse.json({ error: "Unable to lock a SOL quote right now." }, { status: 503 });
    }
    const quote = await quoteResponse.json();
    const quotedItem = quote.items?.find((entry: { id: string }) => entry.id === item.id);
    if (!quotedItem || !Number.isFinite(Number(quotedItem.solAmount)) || Number(quotedItem.solAmount) <= 0) {
      return NextResponse.json({ error: "Item pricing is unavailable." }, { status: 503 });
    }

    const id = randomUUID();
    reservationId = id;
    const reserved = await reserveInventory(id, GENESIS_TOTAL, 172800);
    if (!reserved) {
      return NextResponse.json({ error: "The Genesis drop is sold out. Please check back for availability." }, { status: 409 });
    }

    const expiresAt = new Date(Date.now() + PRICE_LOCK_SECONDS * 1000);
    const deposit = await paymentProvider.createDepositAddress({
      orderId: id,
      amountSol: Number(quotedItem.solAmount)
    });

    const order: Order = {
      id,
      itemId: item.id,
      brand: item.brand,
      valueUsd: item.valueUsd,
      solAmount: Number(quotedItem.solAmount),
      depositAddress: deposit.address,
      status: "waiting",
      paymentMode: "mock",
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    await saveOrder(order);
    reservationId = null;

    return NextResponse.json({
      id: order.id,
      status: order.status,
      item: { brand: order.brand, valueUsd: order.valueUsd },
      address: order.depositAddress,
      solAmount: order.solAmount,
      expiresAt: order.expiresAt,
      priceLockSeconds: PRICE_LOCK_SECONDS,
      paymentMode: "mock",
      notice: "Demo only. This address cannot receive SOL and no real payment will be detected."
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    if (reservationId) {
      try { await releaseReservation(reservationId); } catch { /* Expiring reservation is the fallback. */ }
    }
    return NextResponse.json(
      { error: "We couldn't create your order. Please try again in a moment." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
