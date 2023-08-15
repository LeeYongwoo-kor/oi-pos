import redis from "@/lib/services/redis";
import { UnauthorizedError } from "@/lib/shared/error/ApiError";
import { RedisError } from "@/lib/shared/error/RedisError";

export default async function getFromCache<T>(
  key: string,
  sessionId: string | undefined | null,
  compute: () => Promise<T>
): Promise<T> {
  // If session is null, throw an unauthorized error
  if (!sessionId) {
    throw new UnauthorizedError("Unauthorized. You must be signed in");
  }

  try {
    // Try to get the value from Redis
    const cachedValue = await redis
      .get(`user:${sessionId}:${key}`)
      .catch(() => {
        throw new RedisError("Error getting value from cache");
      });
    if (cachedValue) {
      return JSON.parse(cachedValue);
    }

    // If not in cache, compute the value
    return await compute();
  } catch (err) {
    // Send the error to Sentry
    console.error(err);
    // If an error occurs, skip the cache and compute the value
    return await compute();
  }
}
