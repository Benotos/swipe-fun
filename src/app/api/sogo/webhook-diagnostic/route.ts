import { NextResponse } from "next/server";
import { getSogoWebhookObservation } from "@/lib/store";

export const dynamic = "force-dynamic";

// This diagnostic intentionally exposes only the status of one known sandbox
// reference; it never returns webhook signatures, secrets, or gift-card codes.
const SANDBOX_REFERENCE = "SBXI5RCKTLNGVVF";

export async function GET() {
  try {
    const observation = await getSogoWebhookObservation(SANDBOX_REFERENCE);
    return NextResponse.json({
      provider: "sogo",
      environment: "sandbox",
      reference: SANDBOX_REFERENCE,
      webhookReceived: Boolean(observation),
      observation: observation ?? null,
      note: observation
        ? "A signed Sogo transaction event was received by SWIPE.FUN."
        : "No transaction event has been recorded for this reference by the current webhook observer. The earlier transaction may have completed before this observer was deployed."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({
      error: "Unable to read the Sogo webhook diagnostic.",
      environment: "sandbox"
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
