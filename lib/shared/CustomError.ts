class CustomError extends Error {
  originalError: Error;
  statusCode?: number;
  redirectURL?: string;

  constructor(
    message: string,
    originalError: Error,
    statusCode?: number,
    redirectURL?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.originalError = originalError;
    this.statusCode = statusCode;
    this.redirectURL = redirectURL;
  }
}

class DatabaseError extends CustomError {
  constructor(message: string, originalError: Error) {
    super(message, originalError, 500);
    this.name = "DatabaseError";
  }
}

class ValidationError extends CustomError {
  constructor(message: string, originalError: Error) {
    super(message, originalError, 400);
    this.name = "ValidationError";
  }
}

class NotFoundError extends CustomError {
  constructor(message: string, originalError: Error) {
    super(message, originalError, 404);
    this.name = "NotFoundError";
  }
}

class UnauthorizedError extends CustomError {
  constructor(message: string, originalError: Error, redirectURL: string) {
    super(message, originalError, 401, redirectURL);
    this.name = "UnauthorizedError";
  }
}

export {
  CustomError,
  DatabaseError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
};
