import "server-only";

export class SogoApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown
  ) {
    super(message);
    this.name = "SogoApiError";
  }
}

export async function sogoGet<T>(
  path: string,
  query: Record<string, string> = {}
): Promise<{ status: number; data: T }> {
  const baseUrl = process.env.SOGO_BASE_URL;
  const apiKey = process.env.SOGO_GIFT_READ_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Sogo is not configured. Missing SOGO_BASE_URL or SOGO_GIFT_READ_KEY.");
  }

  const base = new URL(baseUrl);
  if (
    base.protocol !== "https:" ||
    base.hostname !== "sandbox.sogo.africa" ||
    !base.pathname.replace(/\/+$/, "").endsWith("/v1")
  ) {
    throw new Error("Sogo read integration is restricted to the sandbox until production approval.");
  }

  const url = new URL(path.replace(/^\/+/, ""), `${base.toString().replace(/\/+$/, "")}/`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000)
  });

  const raw = await response.text();
  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = { message: raw.slice(0, 1000) };
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `Sogo API request failed with HTTP ${response.status}.`;
    throw new SogoApiError(message, response.status, payload);
  }

  return { status: response.status, data: payload as T };
}


export async function sogoPost<T>(
  path: string,
  body: Record<string, unknown>,
  idempotencyKey?: string
): Promise<{ status: number; data: T }> {
  const baseUrl = process.env.SOGO_BASE_URL;
  const apiKey = process.env.SOGO_SECRET_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Sogo write integration is not configured. Missing SOGO_BASE_URL or SOGO_SECRET_KEY.");
  }

  const base = new URL(baseUrl);
  if (
    base.protocol !== "https:" ||
    base.hostname !== "sandbox.sogo.africa" ||
    !base.pathname.replace(/\\/+$/, "").endsWith("/v1")
  ) {
    throw new Error("Sogo write integration is restricted to the sandbox until production approval.");
  }

  const url = new URL(path.replace(/^\\/+/, ""), `${base.toString().replace(/\\/+$/, "")}/`);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15000)
  });

  const raw = await response.text();
  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = { message: raw.slice(0, 1000) };
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `Sogo API request failed with HTTP ${response.status}.`;
    throw new SogoApiError(message, response.status, payload);
  }

  return { status: response.status, data: payload as T };
}
