import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const total = Math.max(0, Number(process.env.STOCK_TOTAL ?? 500));
  const sold = Math.min(total, Math.max(0, Number(process.env.STOCK_SOLD ?? 0)));
  const remaining = Math.max(0, total - sold);

  return NextResponse.json(
    {
      total,
      sold,
      remaining,
      source: "preview"
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
