import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  claimSogoWebhookEvent,
  getOrderIdBySogoReference,
  getOrder,
  releaseSogoWebhookEvent,
  saveOrder,
  saveSogoWebhookObservation
} from "@/lib/store";

export const dynamic = "force-dynamic";

type SogoWebhookPayload = {
  id?: string;
  event?: string;
  data?: {
    object?: string;
    id?: string;
    reference?: string;
    type?: string;
    status?: string;
    failure_reason?: string | null;
    description?: string;
  };
};

const ALLOWED_EVENTS = new Set([
  "transaction.completed",
  "transaction.failed",
  "transaction.refunded",
  "transaction.cancelled",
  "ping"
]);

function validSignature(rawBody: string, received: string, secret: string): boolean {
  if (!received.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  return expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: NextRequest) {
  const secret = process.env.SOGO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Sogo webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  if (rawBody.length > 65536) {
    return NextResponse.json({ error: "Webhook payload too large." }, { status: 413 });
  }

  const signature = request.headers.get("x-sogo-signature-256") ?? "";
  if (!validSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: SogoWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as SogoWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON." }, { status: 400 });
  }

  const eventType = payload.event ?? request.headers.get("x-sogo-event") ?? "";
  const eventId = payload.id ?? request.headers.get("x-sogo-delivery") ?? "";
  if (!eventId || !ALLOWED_EVENTS.has(eventType)) {
    return NextResponse.json({ error: "Unsupported or incomplete webhook event." }, { status: 400 });
  }

  let claimed = false;
  try {
    claimed = await claimSogoWebhookEvent(eventId);
    if (!claimed) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    if (eventType === "ping") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const transaction = payload.data;
    const reference = transaction?.reference;
    if (!reference || transaction?.object !== "transaction") {
      return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }

    // Keep a minimal audit record for sandbox diagnostics, including references
    // that are not yet linked to a customer order. Never store gift-card codes.
    await saveSogoWebhookObservation({
      eventId,
      event: eventType,
      reference,
      transactionId: transaction.id ?? null,
      status: transaction.status ?? null,
      failureReason: transaction.failure_reason ?? null,
      receivedAt: new Date().toISOString()
    });

    const orderId = await getOrderIdBySogoReference(reference);
    if (!orderId) {
      return NextResponse.json({ received: true, observed: true }, { status: 200 });
    }

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }

    const now = new Date().toISOString();
    order.sogoReference = reference;
    order.sogoTransactionId = transaction.id;
    order.sogoUpdatedAt = now;

    if (eventType === "transaction.completed") {
      order.sogoStatus = "completed";
      if (order.status !== "delivered" && order.status !== "failed") {
        order.status = "confirmed";
      }
      // Gift card codes are intentionally never read from webhook payloads.
      // A separate authenticated transaction lookup is required before delivery.
    } else if (eventType === "transaction.failed") {
      order.sogoStatus = "failed";
      order.status = "failed";
      order.sogoFailureReason = transaction.failure_reason ?? "Sogo transaction failed.";
      order.failureReason = order.sogoFailureReason;
    } else if (eventType === "transaction.refunded") {
      order.sogoStatus = "refunded";
      order.status = "failed";
      order.sogoFailureReason = transaction.failure_reason ?? "Sogo transaction was refunded.";
      order.failureReason = order.sogoFailureReason;
    } else if (eventType === "transaction.cancelled") {
      order.sogoStatus = "cancelled";
      order.status = "failed";
      order.sogoFailureReason = transaction.failure_reason ?? "Sogo transaction was cancelled.";
      order.failureReason = order.sogoFailureReason;
    }

    await saveOrder(order);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    if (claimed) {
      try { await releaseSogoWebhookEvent(eventId); } catch { /* Provider retry will reconcile. */ }
    }
    return NextResponse.json({ error: "Webhook processing failed. Please retry delivery." }, { status: 503 });
  }
}
