import type { Order } from "@/lib/types";

const memory = new Map<string, string>();

async function redis<T>(command: string[]): Promise<T | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") throw new Error("Database is not configured. Add Upstash Redis environment variables.");
    return null;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Database request failed");
  const payload = await response.json();
  return payload.result as T;
}

export async function saveOrder(order: Order) {
  const key = `swipe:order:${order.id}`;
  const result = await redis<string>(["SET", key, JSON.stringify(order), "EX", "86400"]);
  if (result === null) memory.set(key, JSON.stringify(order));
}

export async function getOrder(id: string): Promise<Order | null> {
  const key = `swipe:order:${id}`;
  const result = await redis<string>(["GET", key]);
  const raw = result === null ? memory.get(key) ?? null : result;
  return raw ? JSON.parse(raw) as Order : null;
}

export async function increment(key: string) {
  const result = await redis<number>(["INCR", `swipe:${key}`]);
  if (result === null) return 0;
  return Number(result);
}

export async function decrement(key: string) {
  const result = await redis<number>(["DECR", `swipe:${key}`]);
  if (result === null) return 0;
  return Number(result);
}

export async function getCount(key: string) {
  const result = await redis<string>(["GET", `swipe:${key}`]);
  if (result === null) return 0;
  return Number(result ?? 0);
}

export function databaseConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
