import {
  NextauthError,
  RefreshAccessTokenError,
  UnsupportedProviderError,
} from "@/lib/shared/NextauthError";
import { TokenSet } from "next-auth";
import { JWT } from "next-auth/jwt";

export async function assignRefreshToken(token: JWT): Promise<JWT> {
  try {
    let response: Response;
    if (!token.refresh_token) {
      throw new RefreshAccessTokenError();
    }

    switch (token.provider) {
      case "google":
        // Refresh Google access token
        response = await fetch("https://oauth2.googleapis.com/token", {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refresh_token,
          }),
          method: "POST",
        });
        break;
      case "line":
        // Refresh Line access token
        response = await fetch("https://api.line.me/oauth2/v2.1/token", {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.LINE_CLIENT_ID!,
            client_secret: process.env.LINE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refresh_token,
          }),
          method: "POST",
        });
        break;
      default:
        throw new UnsupportedProviderError(token.provider as string);
    }

    const providerToken: TokenSet = await response.json();
    if (!response.ok) throw new RefreshAccessTokenError();

    return {
      ...token, // Keep the previous token properties
      access_token: providerToken.access_token,
      expires_at: Math.floor(
        Date.now() / 1000 + (providerToken.expires_in || 3599)
      ),
      // Fall back to old refresh token, but note that
      // many providers may only allow using a refresh token once.
      refresh_token: providerToken.refresh_token ?? token.refresh_token,
    };
  } catch (err) {
    //TODO: send error to sentry
    console.error("Error refreshing access token", err);

    let errorName = "UnknownError";
    let message = "Unknown error refreshing access token";

    if (err instanceof NextauthError) {
      errorName = err.name;
      message = err.message;
    }
    // The error property will be used client-side to handle the refresh token error
    return {
      ...token,
      errorName,
      message,
    };
  }
}
