import { CustomError, CustomErrorType } from "./CustomError";
import {
  ApiErrorBuilder,
  BadGatewayErrorBuilder,
  ConflictErrorBuilder,
  ForbiddenErrorBuilder,
  GoneErrorBuilder,
  MethodNotAllowedErrorBuilder,
  NotFoundErrorBuilder,
  PaymentRequiredErrorBuilder,
  ServiceUnavailableErrorBuilder,
  UnauthorizedErrorBuilder,
  UnexpectedErrorBuilder,
  ValidationErrorBuilder,
} from "./builder/ApiErrorBuilder";
import { AUTH_URL } from "@/constants/url";

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

  static builder() {
    return new ApiErrorBuilder();
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

  static builder() {
    return new ValidationErrorBuilder();
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

  static builder() {
    return new NotFoundErrorBuilder();
  }
}

class UnauthorizedError extends ApiError {
  constructor(
    message: string,
    originalError?: Error,
    redirectUrl?: string,
    endpoint?: string
  ) {
    super(message, 401, originalError, redirectUrl || AUTH_URL.LOGIN, endpoint);
    this.name = "UnauthorizedError";
  }

  static builder() {
    return new UnauthorizedErrorBuilder();
  }
}

class MethodNotAllowedError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 405, originalError, endpoint);
    this.name = "MethodNotAllowedError";
  }

  static builder() {
    return new MethodNotAllowedErrorBuilder();
  }
}

class UnexpectedError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 500, originalError, endpoint);
    this.name = "UnexpectedError";
  }

  static builder() {
    return new UnexpectedErrorBuilder();
  }
}

class BadGatewayError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 502, originalError, endpoint);
    this.name = "BadGatewayError";
  }

  static builder() {
    return new BadGatewayErrorBuilder();
  }
}

class ServiceUnavailableError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 503, originalError, endpoint);
    this.name = "ServiceUnavailableError";
  }

  static builder() {
    return new ServiceUnavailableErrorBuilder();
  }
}

class PaymentRequiredError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 402, originalError, endpoint);
    this.name = "PaymentRequiredError";
  }

  static builder() {
    return new PaymentRequiredErrorBuilder();
  }
}

class ConflictError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 409, originalError, endpoint);
    this.name = "ConflictError";
  }

  static builder() {
    return new ConflictErrorBuilder();
  }
}

class ForbiddenError extends ApiError {
  constructor(message: string, originalError?: Error, endpoint?: string) {
    super(message, 403, originalError, endpoint);
    this.name = "ForbiddenError";
  }

  static builder() {
    return new ForbiddenErrorBuilder();
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

  static builder() {
    return new GoneErrorBuilder();
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
