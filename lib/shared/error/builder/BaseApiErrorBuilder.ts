import { ApiError } from "../ApiError";

export default abstract class BaseApiErrorBuilder {
  protected message!: string;
  protected statusCode?: number;
  protected originalError?: Error;
  protected redirectUrl?: string;
  protected endpoint?: string;

  setMessage(message: string) {
    this.message = message;
    return this;
  }

  setStatusCode(statusCode: number) {
    this.statusCode = statusCode;
    return this;
  }

  setOriginalError(originalError: Error) {
    this.originalError = originalError;
    return this;
  }

  setRedirectUrl(redirectUrl: string) {
    this.redirectUrl = redirectUrl;
    return this;
  }

  setEndpoint(endpoint: string) {
    this.endpoint = endpoint;
    return this;
  }

  abstract build(): ApiError;
}
