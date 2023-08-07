import { ERROR_RETRY_COUNT, ERROR_RETRY_DELAY } from "@/constants/numeric";
import errorRetryProcess from "./errorRetryProcess";

export function withErrorRetry<T>(
  func: (...args: any[]) => Promise<T>,
  retryAttempts?: number,
  delay?: number
) {
  return async function (...args: any[]): Promise<T> {
    const process = () => func(...args);
    return errorRetryProcess(
      () => process(),
      retryAttempts || ERROR_RETRY_COUNT,
      delay || ERROR_RETRY_DELAY
    );
  };
}
