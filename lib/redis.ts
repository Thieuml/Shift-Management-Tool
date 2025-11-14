import { Redis } from '@upstash/redis'

const getRedisClient = (): Redis | null => {
  // Support Upstash REST API
  const restUrl = process.env.UPSTASH_REDIS_REST_URL
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (restUrl && restToken) {
    try {
      return new Redis({
        url: restUrl,
        token: restToken,
      })
    } catch (error) {
      console.error('Failed to create Upstash Redis client:', error)
      return null
    }
  }

  console.warn('Redis not configured - Redis features will be disabled')
  return null
}

// Singleton pattern for Redis client
let redis: Redis | null = null

export function getRedis(): Redis | null {
  if (!redis) {
    redis = getRedisClient()
  }
  return redis
}

export async function acquireLock(
  key: string,
  ttl: number = 10, // seconds
  retryDelay: number = 100, // milliseconds
  maxRetries: number = 10
): Promise<string | null> {
  const client = getRedis()
  
  // If Redis is not available, return a mock lock value (for development)
  // In production, Redis should always be available
  if (!client) {
    console.warn('Redis not available - lock acquisition skipped')
    return 'mock-lock'
  }

  const lockValue = `${Date.now()}-${Math.random()}`
  const lockKey = `lock:${key}`

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Upstash Redis uses set with options object
      const result = await client.set(lockKey, lockValue, {
        ex: ttl,
        nx: true,
      })
      
      if (result === 'OK') {
        return lockValue
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    } catch (error) {
      console.error('Error acquiring lock:', error)
      return null
    }
  }

  return null
}

export async function releaseLock(key: string, lockValue: string): Promise<boolean> {
  const client = getRedis()
  
  // If Redis is not available, just return true (for development)
  if (!client) {
    return true
  }

  const lockKey = `lock:${key}`
  
  try {
    // Lua script to ensure we only delete the lock if we own it
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `
    
    const result = await client.eval(script, [lockKey], [lockValue])
    return result === 1
  } catch (error) {
    console.error('Error releasing lock:', error)
    return false
  }
}
