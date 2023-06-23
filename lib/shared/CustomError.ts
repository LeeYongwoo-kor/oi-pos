export type CustomErrorType = {
  name: string;
  message: string;
  originalError?: Error;
  statusCode?: number;
  redirectUrl?: string;
};

class CustomError extends Error {
  originalError?: Error;
  statusCode?: number;
  redirectUrl?: string;

  constructor(
    message: string,
    statusCode?: number,
    originalError?: Error,
    redirectUrl?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.originalError = originalError;
    this.statusCode = statusCode;
    this.redirectUrl = redirectUrl;
  }
}

export { CustomError };
