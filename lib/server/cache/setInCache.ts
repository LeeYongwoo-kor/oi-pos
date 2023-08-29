import { REDIS_DEFAULT_TTL_SEC } from "@/constants/service";
import redis from "@/lib/services/redis";
import { UnauthorizedError } from "@/lib/shared/error/ApiError";
import { RedisError } from "@/lib/shared/error/RedisError";

export default async function setInCache<T>(
  key: string,
  value: T,
  sessionId: string | undefined | null,
  ttl?: number
): Promise<void> {
  // If session is null, throw an unauthorized error
  if (!sessionId) {
    throw new UnauthorizedError("Unauthorized. You must be signed in");
  }

  try {
    // Store the computed value in Redis with optional TTL
    await redis
      .set(
        `user:${sessionId}:${key}`,
        JSON.stringify(value),
        "EX",
        ttl ? ttl : REDIS_DEFAULT_TTL_SEC
      )
      .catch(() => {
        throw new RedisError("Error setting value in cache");
      });
  } catch (err) {
    // Send the error to Sentry
    console.error(err);
  }
}
