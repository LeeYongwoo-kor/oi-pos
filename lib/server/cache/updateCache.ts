import { DEFAULT_REDIS_TTL_SEC } from "@/constants/numeric";
import redis from "@/lib/services/redis";
import { UnauthorizedError } from "@/lib/shared/error/ApiError";

export async function updateCache<T>(
  key: string,
  newData: T,
  sessionId: string | undefined | null,
  ttl?: number
): Promise<void> {
  // If session is null, throw an unauthorized error
  if (!sessionId) {
    throw new UnauthorizedError("Unauthorized. You must be signed in");
  }

  try {
    // Try to get the existing cached value from Redis
    const cacheKey = `user:${sessionId}:${key}`;
    const cachedValue = await redis.get(cacheKey);

    // Merge the cached data with the new data (works even if cachedValue is null)
    const updatedData = { ...JSON.parse(cachedValue || "{}"), ...newData };

    // Store the updated data back in Redis with optional TTL
    await redis.set(
      cacheKey,
      JSON.stringify(updatedData),
      "EX",
      ttl ? ttl : DEFAULT_REDIS_TTL_SEC
    );
  } catch (err) {
    // Send the error to Sentry
    console.error(err);
  }
}
