import { LOGIN_PATH } from "@/constants";
import { CustomError, CustomErrorType } from "./CustomError";

export interface ApiErrorType extends CustomErrorType {
  endpoint?: string;
}

class ApiError extends CustomError {
  endpoint?: string;

  constructor(
    message: string,
    statusCode?: number,
    originalError?: Error,
    redirectUrl?: string,
    endpoint?: string
  ) {
    super(message, statusCode, originalError, redirectUrl);
    this.name = this.constructor.name;
    this.endpoint = endpoint;
  }
}

class ValidationError extends ApiError {
  constructor(
    message: string,
    originalError?: Error,
    redirectUrl?: string,
    endpoint?: string
  ) {
    super(message, 400, originalError, redirectUrl, endpoint);
    this.name = "ValidationError";
  }
}

class NotFoundError extends ApiError {
  constructor(
    message: string,
    originalError?: Error,
    redirectUrl?: string,
    endpoint?: string
  ) {
    super(message, 404, originalError, redirectUrl, endpoint);
    this.name = "NotFoundError";
  }
}

class UnauthorizedError extends ApiError {
  constructor(
    message: string,
    originalError?: Error,
    redirectUrl?: string,
    endpoint?: string
  ) {
    super(message, 401, originalError, redirectUrl || LOGIN_PATH, endpoint);
    this.name = "UnauthorizedError";
  }
}

class MethodNotAllowedError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 405, originalError, endpoint);
    this.name = "MethodNotAllowedError";
  }
}

class UnexpectedError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 500, originalError, endpoint);
    this.name = "UnexpectedError";
  }
}

class BadGatewayError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 502, originalError, endpoint);
    this.name = "BadGatewayError";
  }
}

class ServiceUnavailableError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 503, originalError, endpoint);
    this.name = "ServiceUnavailableError";
  }
}

class PaymentRequiredError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 402, originalError, endpoint);
    this.name = "PaymentRequiredError";
  }
}

class ConflictError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 409, originalError, endpoint);
    this.name = "ConflictError";
  }
}

class ForbiddenError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 403, originalError, endpoint);
    this.name = "ForbiddenError";
  }
}

class GoneError extends ApiError {
  constructor(
    message: string,
    originalError?: Error,
    redirectUrl?: string,
    endpoint?: string
  ) {
    super(message, 410, originalError, redirectUrl, endpoint);
    this.name = "GoneError";
  }
}

export {
  ApiError,
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
  GoneError,
};
