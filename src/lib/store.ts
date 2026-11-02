import type { Order } from "@/lib/types";

const memory = new Map<string, string>();
const memoryOrders = new Set<string>();
const memoryReservations = new Set<string>();
let memorySold = 0;
let memoryReserved = 0;

async function redis<T>(command: string[]): Promise<T | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Database is not configured. Add Upstash Redis environment variables.");
    }
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
  if (payload.error) throw new Error("Database command failed");
  return payload.result as T;
}

export async function saveOrder(order: Order) {
  const key = `swipe:order:${order.id}`;
  const result = await redis<string>(["SET", key, JSON.stringify(order), "EX", "2592000"]);
  if (result === null) {
    memory.set(key, JSON.stringify(order));
    memoryOrders.add(order.id);
    return;
  }
  await redis<number>(["SADD", "swipe:orders", order.id]);
  await redis<number>(["EXPIRE", "swipe:orders", "2592000"]);
}

export async function getOrder(id: string): Promise<Order | null> {
  const key = `swipe:order:${id}`;
  const result = await redis<string>(["GET", key]);
  const raw = result === null ? memory.get(key) ?? null : result;
  return raw ? JSON.parse(raw) as Order : null;
}

export async function getWaitingOrders(): Promise<Order[]> {
  const ids = await redis<string[]>(["SMEMBERS", "swipe:orders"]);
  if (ids === null) {
    return Array.from(memoryOrders)
      .map(id => memory.get(`swipe:order:${id}`))
      .filter((value): value is string => Boolean(value))
      .map(value => JSON.parse(value) as Order)
      .filter(order => order.status === "waiting");
  }

  const orders = await Promise.all(ids.map(id => getOrder(id)));
  return orders.filter((order): order is Order => Boolean(order && order.status === "waiting"));
}

export async function reserveInventory(orderId: string, total: number, ttlSeconds: number): Promise<boolean> {
  const script = [
    "local sold = tonumber(redis.call('GET', KEYS[1]) or '0')",
    "local reserved = tonumber(redis.call('GET', KEYS[2]) or '0')",
    "if sold + reserved >= tonumber(ARGV[1]) then return 0 end",
    "redis.call('INCR', KEYS[2])",
    "redis.call('SET', KEYS[3], '1', 'EX', ARGV[2])",
    "return 1"
  ].join("\n");

  const result = await redis<number>([
    "EVAL", script, "3",
    "swipe:stock:sold", "swipe:stock:reserved",
    `swipe:reservation:${orderId}`,
    String(total), String(ttlSeconds)
  ]);
  if (result === null) {
    if (memorySold + memoryReserved >= total) return false;
    memoryReserved += 1;
    memoryReservations.add(orderId);
    return true;
  }
  return Number(result) === 1;
}

export async function releaseReservation(orderId: string): Promise<boolean> {
  const script = [
    "if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end",
    "redis.call('DECR', KEYS[2])",
    "redis.call('DEL', KEYS[1])",
    "return 1"
  ].join("\n");

  const result = await redis<number>([
    "EVAL", script, "2",
    `swipe:reservation:${orderId}`, "swipe:stock:reserved"
  ]);
  if (result === null) {
    if (!memoryReservations.has(orderId)) return false;
    memoryReservations.delete(orderId);
    memoryReserved = Math.max(0, memoryReserved - 1);
    return true;
  }
  return Number(result) === 1;
}

export async function completeReservation(orderId: string): Promise<boolean> {
  const script = [
    "if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end",
    "redis.call('DECR', KEYS[2])",
    "redis.call('INCR', KEYS[3])",
    "redis.call('DEL', KEYS[1])",
    "return 1"
  ].join("\n");

  const result = await redis<number>([
    "EVAL", script, "3",
    `swipe:reservation:${orderId}`,
    "swipe:stock:reserved",
    "swipe:stock:sold"
  ]);
  if (result === null) {
    if (!memoryReservations.has(orderId)) return false;
    memoryReservations.delete(orderId);
    memoryReserved = Math.max(0, memoryReserved - 1);
    memorySold += 1;
    return true;
  }
  return Number(result) === 1;
}

export async function getInventory() {
  const [soldValue, reservedValue] = await Promise.all([
    redis<string>(["GET", "swipe:stock:sold"]),
    redis<string>(["GET", "swipe:stock:reserved"])
  ]);

  if (!databaseConfigured()) {
    return { sold: memorySold, reserved: memoryReserved, source: "preview" as const };
  }

  return {
    sold: Math.max(0, Number(soldValue ?? 0)),
    reserved: Math.max(0, Number(reservedValue ?? 0)),
    source: "database" as const
  };
}

export function databaseConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

const memoryRateLimits = new Map<string, { count: number; resetAt: number }>();

export async function consumeOrderRateLimit(identifier: string): Promise<boolean> {
  const windowSeconds = 600;
  const limit = 10;
  const script = [
    "local count = redis.call('INCR', KEYS[1])",
    "if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
    "return count"
  ].join("\n");

  const result = await redis<number>([
    "EVAL", script, "1",
    `swipe:ratelimit:orders:${identifier}`,
    String(windowSeconds)
  ]);

  if (result === null) {
    const now = Date.now();
    const current = memoryRateLimits.get(identifier);
    if (!current || current.resetAt <= now) {
      memoryRateLimits.set(identifier, { count: 1, resetAt: now + windowSeconds * 1000 });
      return true;
    }
    current.count += 1;
    return current.count <= limit;
  }

  return Number(result) <= limit;
}
