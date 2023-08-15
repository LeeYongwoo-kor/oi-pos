import { CustomError } from "./CustomError";

class RedisError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, originalError);
    this.name = "RedisError";
  }
}

export { RedisError };
