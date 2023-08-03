import { ValidationError } from "yup";
import {
  ApiError,
  BadGatewayError,
  ConflictError,
  ForbiddenError,
  GoneError,
  MethodNotAllowedError,
  NotFoundError,
  PaymentRequiredError,
  ServiceUnavailableError,
  UnauthorizedError,
  UnexpectedError,
} from "../ApiError";
import BaseApiErrorBuilder from "./BaseApiErrorBuilder";

class ApiErrorBuilder extends BaseApiErrorBuilder {
  build(): ApiError {
    if (!this.message) {
      // Send error to sentry
      console.error("Message must be set before building an ApiError");
    }
    return new ApiError(
      this.message,
      this.statusCode,
      this.originalError,
      this.redirectUrl,
      this.endpoint
    );
  }
}

class ValidationErrorBuilder extends BaseApiErrorBuilder {
  constructor() {
    super();
    this.statusCode = 400;
  }

  build(): ValidationError {
    if (!this.message) {
      // Send error to sentry
      console.error("Message must be set before building an ValidationError");
    }
    return new ValidationError(
      this.message,
      this.originalError,
      this.redirectUrl,
      this.endpoint
    );
  }
}

class NotFoundErrorBuilder extends BaseApiErrorBuilder {
  constructor() {
    super();
    this.statusCode = 404;
  }

  build(): NotFoundError {
    if (!this.message) {
      // Send error to sentry
      console.error("Message must be set before building an NotFoundError");
    }
    return new NotFoundError(
      this.message,
      this.originalError,
      this.redirectUrl,
      this.endpoint
    );
  }
}

class UnauthorizedErrorBuilder extends BaseApiErrorBuilder {
  constructor() {
    super();
    this.statusCode = 401;
  }

  build(): UnauthorizedError {
    if (!this.message) {
      // Send error to sentry
      console.error("Message must be set before building an UnauthorizedError");
    }
    return new UnauthorizedError(
      this.message,
      this.originalError,
      this.redirectUrl,
      this.endpoint
    );
  }
}

class MethodNotAllowedErrorBuilder extends BaseApiErrorBuilder {
  constructor() {
    super();
    this.statusCode = 405;
  }

  build(): MethodNotAllowedError {
    if (!this.message) {
      // Send error to sentry
      console.error(
        "Message must be set before building an MethodNotAllowedError"
      );
    }
    return new MethodNotAllowedError(
      this.message,
      this.originalError,
      this.endpoint
    );
  }
}

class UnexpectedErrorBuilder extends BaseApiErrorBuilder {
  constructor() {
    super();
    this.statusCode = 500;
  }

  build(): UnexpectedError {
    if (!this.message) {
      // Send error to sentry
      console.error("Message must be set before building an UnexpectedError");
    }
    return new UnexpectedError(this.message, this.originalError, this.endpoint);
  }
}

class BadGatewayErrorBuilder extends BaseApiErrorBuilder {
  constructor() {
    super();
    this.statusCode = 502;
  }

  build(): BadGatewayError {
    if (!this.message) {
      // Send error to sentry
      console.error("Message must be set before building an BadGatewayError");
    }
    return new BadGatewayError(this.message, this.originalError, this.endpoint);
  }
}

class ServiceUnavailableErrorBuilder extends BaseApiErrorBuilder {
  constructor() {
    super();
    this.statusCode = 503;
  }

  build(): ServiceUnavailableError {
    if (!this.message) {
      // Send error to sentry
      console.error(
        "Message must be set before building an ServiceUnavailableError"
      );
    }
    return new ServiceUnavailableError(
      this.message,
      this.originalError,
      this.endpoint
    );
  }
}

class PaymentRequiredErrorBuilder extends BaseApiErrorBuilder {
  constructor() {
    super();
    this.statusCode = 402;
  }

  build(): PaymentRequiredError {
    if (!this.message) {
      // Send error to sentry
      console.error(
        "Message must be set before building an PaymentRequiredError"
      );
    }
    return new PaymentRequiredError(
      this.message,
      this.originalError,
      this.endpoint
    );
  }
}

class ConflictErrorBuilder extends BaseApiErrorBuilder {
  constructor() {
    super();
    this.statusCode = 409;
  }

  build(): ConflictError {
    if (!this.message) {
      // Send error to sentry
      console.error("Message must be set before building an ConflictError");
    }
    return new ConflictError(this.message, this.originalError, this.endpoint);
  }
}

class ForbiddenErrorBuilder extends BaseApiErrorBuilder {
  constructor() {
    super();
    this.statusCode = 409;
  }

  build(): ForbiddenError {
    if (!this.message) {
      // Send error to sentry
      console.error("Message must be set before building an ForbiddenError");
    }
    return new ForbiddenError(this.message, this.originalError, this.endpoint);
  }
}

class GoneErrorBuilder extends BaseApiErrorBuilder {
  constructor() {
    super();
    this.statusCode = 409;
  }

  build(): GoneError {
    if (!this.message) {
      // Send error to sentry
      console.error("Message must be set before building an GoneError");
    }
    return new GoneError(this.message, this.originalError, this.endpoint);
  }
}

export {
  ApiErrorBuilder,
  NotFoundErrorBuilder,
  ValidationErrorBuilder,
  UnauthorizedErrorBuilder,
  MethodNotAllowedErrorBuilder,
  UnexpectedErrorBuilder,
  BadGatewayErrorBuilder,
  ServiceUnavailableErrorBuilder,
  PaymentRequiredErrorBuilder,
  ConflictErrorBuilder,
  ForbiddenErrorBuilder,
  GoneErrorBuilder,
};
