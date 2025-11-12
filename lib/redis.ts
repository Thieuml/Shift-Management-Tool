import Redis from "ioredis";

const getRedisUrl = () => {
  return process.env.REDIS_URL || "redis://localhost:6379";
};

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });
  }

  return redis;
}

export async function acquireLock(
  key: string,
  ttl: number = 10
): Promise<string | null> {
  const redis = getRedis();
  const lockKey = `lock:${key}`;
  const lockValue = `${Date.now()}-${Math.random()}`;

  const result = await redis.set(lockKey, lockValue, "EX", ttl, "NX");

  if (result === "OK") {
    return lockValue;
  }

  return null;
}

export async function releaseLock(key: string, lockValue: string): Promise<boolean> {
  const redis = getRedis();
  const lockKey = `lock:${key}`;

  // Use Lua script to ensure we only delete our own lock
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  const result = await redis.eval(script, 1, lockKey, lockValue);
  return result === 1;
}
