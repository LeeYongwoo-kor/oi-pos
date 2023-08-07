export type AuthCallbackErrorType =
  (typeof AUTH_CALLBACK_ERROR)[keyof typeof AUTH_CALLBACK_ERROR];
export type AuthCallbackErrorMessageType = {
  [K in AuthCallbackErrorType]: string;
};
export type AuthExpectedErrorType =
  (typeof AUTH_EXPECTED_ERROR)[keyof typeof AUTH_EXPECTED_ERROR];
export type AuthExpectedErrorMessageType = {
  [K in AuthExpectedErrorType]: string;
};

export const AUTH_QUERY_PARAMS = {
  ERROR: "error",
  ERROR_MESSAGE: "errorMessage",
  ALLOW_ACCESS: "allowAccess",
} as const;

export const AUTH_CALLBACK_ERROR = {
  SIGN_IN: "Signin",
  OAUTH_SIGN_IN: "OAuthSignin",
  OAUTH_CALLBACK: "OAuthCallback",
  OAUTH_CREATE_ACCOUNT: "OAuthCreateAccount",
  EMAIL_CREATE_ACCOUNT: "EmailCreateAccount",
  CALLBACK: "Callback",
  OAUTH_ACCOUNT_NOT_LINKED: "OAuthAccountNotLinked",
  EMAIL_SIGN_IN: "EmailSignin",
  CREDENTIALS_SIGN_IN: "CredentialsSignin",
  SESSION_REQUIRED: "SessionRequired",
  DEFAULT: "DEFAULT",
} as const;

export const AUTH_EXPECTED_ERROR = {
  EMAIL_ALREADY_IN_USE: "EmailAlreadyInUse",
  PRISMA_ERROR: "PrismaError",
  REFRESH_ACCESS_TOKEN_ERROR: "RefreshAccessTokenError",
  UNAUTHORIZED: "Unauthorized",
  UNSUPPORTED_PROVIDER_ERROR: "UnsupportedProviderError",
  UPDATE_USER_ERROR: "UpdateUserError",
  NOT_ALLOWED_ACCESS: "NotAllowedAccess",
  INVALID_ERROR: "InvalidError",
  NOT_ACTIVE_USER: "NotActiveUser",
  DEFAULT: "DEFAULT",
} as const;

export const AUTH_CALLBACK_ERROR_MESSAGE: AuthCallbackErrorMessageType = {
  Signin: "Try signing with a different account.",
  OAuthSignin: "Try signing with a different account.",
  OAuthCallback: "Try signing with a different account.",
  OAuthCreateAccount: "Try signing with a different account.",
  EmailCreateAccount: "Try signing with a different account.",
  Callback: "Try signing with a different account.",
  OAuthAccountNotLinked:
    "To confirm your identity, sign in with the same account you used originally.",
  EmailSignin: "Check your email address.",
  CredentialsSignin:
    "Sign in failed. Check the details you provided are correct.",
  SessionRequired: "Please sign in to access this page.",
  DEFAULT: "Unable to sign in.",
} as const;

export const AUTH_EXPECTED_ERROR_MESSAGE: AuthExpectedErrorMessageType = {
  EmailAlreadyInUse:
    "The email is already in use. Please use a different email.",
  PrismaError: "The signin process failed. Please try again later.",
  RefreshAccessTokenError:
    "Unable to refresh access token, Please sign in again.",
  Unauthorized: "Unauthorized access, Please sign in again.",
  UnsupportedProviderError: "Unsupported provider, Please sign in again.",
  UpdateUserError: "Unable to update your account, Please try again.",
  NotAllowedAccess: "You are not allowed to access that page. Please sign in.",
  InvalidError: "Invalid Error Occured, Please try again.",
  NotActiveUser: "You are not active user. Please contact support team.",
  DEFAULT: "An unexpected error occured, Please try again.",
} as const;
