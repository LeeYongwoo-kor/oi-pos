import { LOGIN_PATH } from "@/constants";

export type CustomErrorType = {
  name: string;
  message: string;
  originalError?: Error;
  statusCode?: number;
  redirectURL?: string;
};

class CustomError extends Error {
  originalError?: Error;
  statusCode?: number;
  redirectURL?: string;

  constructor(
    message: string,
    statusCode?: number,
    originalError?: Error,
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
  constructor(message: string, originalError?: Error) {
    super(message, 500, originalError);
    this.name = "DatabaseError";
  }
}

class ValidationError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, 400, originalError);
    this.name = "ValidationError";
  }
}

class NotFoundError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, 404, originalError);
    this.name = "NotFoundError";
  }
}

class UnauthorizedError extends CustomError {
  constructor(message: string, originalError?: Error, redirectURL?: string) {
    super(message, 401, originalError, redirectURL || LOGIN_PATH);
    this.name = "UnauthorizedError";
  }
}

class MethodNotAllowedError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, 405, originalError);
    this.name = "MethodNotAllowedError";
  }
}

class UnexpectedError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, originalError);
    this.name = "UnexpectedError";
  }
}

class BadGatewayError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, 502, originalError);
    this.name = "BadGatewayError";
  }
}

class ServiceUnavailableError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, 503, originalError);
    this.name = "ServiceUnavailableError";
  }
}

class PaymentRequiredError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, 402, originalError);
    this.name = "PaymentRequiredError";
  }
}

class ConflictError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, 409, originalError);
    this.name = "ConflictError";
  }
}

class ForbiddenError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, 403, originalError);
    this.name = "ForbiddenError";
  }
}

export {
  CustomError,
  DatabaseError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  MethodNotAllowedError,
  UnexpectedError,
  BadGatewayError,
  ServiceUnavailableError,
  PaymentRequiredError,
  ConflictError,
  ForbiddenError,
};
