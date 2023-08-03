class NextauthError extends Error {
  originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.originalError = originalError;
  }
}

class RefreshAccessTokenError extends NextauthError {
  constructor(message?: string, originalError?: Error) {
    super(message ?? "Failed to refresh access token", originalError);
    this.name = "RefreshAccessTokenError";
  }
}

class UnsupportedProviderError extends NextauthError {
  constructor(provider: string) {
    super(`Provider ${provider} is not supported`);
    this.name = "UnsupportedProviderError";
  }
}

export { NextauthError, RefreshAccessTokenError, UnsupportedProviderError };
