import { createHash } from "node:crypto";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 12;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type Hit = { count: number; resetAt: number };

const hits = new Map<string, Hit>();
const cache = new Map<string, { value: unknown; expiresAt: number }>();

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "gamma-default-salt";
  return createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

export function rateLimit(key: string): {
  allowed: boolean;
  retryAfter: number;
} {
  const now = Date.now();
  const hit = hits.get(key);

  if (!hit || now > hit.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (hit.count >= MAX_PER_WINDOW) {
    return {
      allowed: false,
      retryAfter: Math.ceil((hit.resetAt - now) / 1000),
    };
  }

  hit.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function cacheKey(description: string): string {
  return description.toLowerCase().replace(/\s+/g, " ").trim();
}

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached(key: string, value: unknown): void {
  if (cache.size > 500) cache.clear();
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}
