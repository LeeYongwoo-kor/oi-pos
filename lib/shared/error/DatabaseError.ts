import { CustomError } from "./CustomError";

class DatabaseError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, originalError);
    this.name = "DatabaseError";
  }
}

export { DatabaseError };
