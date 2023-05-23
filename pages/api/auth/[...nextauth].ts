import {
  createAccountByNewProvider,
  getAccount,
  getUserByEmail,
  getUserById,
  updateUserRole,
} from "@/database";
import { deleteVerificationTokens } from "@/database/verificationToken";
import { generateVerifyLoginEmail } from "@/email/generateVerifyLoginEmail";
import { withErrorRetry } from "@/lib/server/withErrorRetry";
import prisma from "@/lib/services/prismadb";
import { sendEmail } from "@/lib/services/sendEmail";
import { CustomError, ForbiddenError } from "@/lib/shared/CustomError";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Account, User, UserStatus } from "@prisma/client";
import NextAuth, { NextAuthOptions, TokenSet } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import LineProvider from "next-auth/providers/line";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Configure one or more authentication providers
  providers: [
    EmailProvider({
      type: "email",
      name: "Email",
      maxAge: 60 * 60, // 1 hour
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        // delete existing tokens
        await deleteVerificationTokens(identifier);

        // send verification email
        await sendEmail({
          to: identifier,
          from: process.env.EMAIL_FROM ?? "",
          subject: "Hello, I'm Yoshi! Please Verify Your Account",
          html: generateVerifyLoginEmail(url),
        });
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // use refresh token
      authorization: { params: { access_type: "offline", prompt: "consent" } },
    }),
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "profile openid email",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // strategy: "database",
    maxAge: 60 * 60 * 24 * 28, // 28 days
    // Note: This option is ignored if using JSON Web Tokens
    // updateAge: 60 * 60 * 24, // 24 hours
  },
  jwt: {
    maxAge: 60 * 60, // 1 hour
  },
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      console.log("this is jwt");
      // initial login success sign up
      if (user) {
        try {
          const userInfo = await getUserById(user.id);
          if (!userInfo || userInfo.status !== UserStatus.ACTIVE) {
            throw new ForbiddenError(
              "You are not active user. Please contact support team."
            );
          }
          token = { ...token, status: userInfo.status, role: userInfo.role };
        } catch (err) {
          const errMessage =
            err instanceof CustomError ? err.message : String(err);
          //TODO: send error to sentry
          console.error("Get user info failed: ", errMessage);
          if (err instanceof CustomError) {
            if (err instanceof ForbiddenError) {
              return {
                ...token,
                errorName: "NotActiveUser",
                errorMessage: errMessage,
              };
            }
            return { ...token, errorName: err.name, errorMessage: errMessage };
          }
        }
      }
      // new user registration
      if (isNewUser) {
        try {
          withErrorRetry<User>(() => updateUserRole(user?.id));
        } catch (err) {
          const errMessage =
            err instanceof CustomError ? err.message : String(err);
          //TODO: send error to sentry
          console.error("Update user role failed: ", errMessage);
          return {
            ...token,
            errorName: "UpdateUserError",
            messageMessage: errMessage,
          };
        }
      }
      // initial login with OAuth provider
      if (account) {
        if (profile && account.provider === "line") {
          token.name = profile.name;
          token.picture = profile.picture;
        }
        // Save the access token and refresh token in the JWT on the initial login
        return {
          ...token,
          access_token: account.access_token,
          provider: account.provider,
          expires_at: Math.floor(
            Date.now() / 1000 + (account.expires_in || 3599)
          ),
          refresh_token: account.refresh_token,
        };
      } else if (Date.now() < (token.expires_at || 0) * 1000) {
        // If the access token has not expired yet, return it
        return token;
      } else {
        // If the access token has expired, try to refresh it
        try {
          let response: Response;

          switch (token.provider) {
            case "email":
              // Email provider does not support refresh token
              return token;
            case "google":
              if (!token.refresh_token) {
                throw token;
              }
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
              if (!token.refresh_token) {
                throw token;
              }
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
              return {
                ...token,
                errorName: "UnsupportedProviderError",
                errorMessage: `Provider ${token.provider} is not supported`,
              };
          }

          const providerToken: TokenSet = await response.json();
          if (!response.ok) throw providerToken;

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
          // The error property will be used client-side to handle the refresh token error
          return {
            ...token,
            errorName: "RefreshAccessTokenError",
            errorMessage: "Error refreshing access token",
          };
        }
      }
    },
    async session({ session, user, token }) {
      console.log("this is session");
      const { errorName, errorMessage } = token;
      if (token) {
        if (errorName) {
          session.errorName = errorName;
          session.errorMessage = errorMessage;
        }
        session.id = token.sub;
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      try {
        if (email && !email.verificationRequest) {
          // TODO: Hash the URL to prevent direct access
          return "/errors/email-already-in-use?allowAccess=true";
        }

        const userByEmail = await getUserByEmail(user?.email);
        if (userByEmail) {
          if (email) {
            // not email user
            if (!userByEmail.emailVerified) {
              return "/errors/email-already-in-use?allowAccess=true";
            }

            return true;
          }

          const oauthAccount = await getAccount(
            userByEmail.id,
            account?.providerAccountId
          );

          if (!oauthAccount) {
            withErrorRetry<Account>(() =>
              createAccountByNewProvider(userByEmail.id, account)
            );
          }
        }

        return true;
      } catch (err) {
        //TODO: send error to sentry
        console.error("An error occurred while checking the account: ", err);
        return `/errors/prisma-error?allowAccess=true`;
      }
    },
  },
  events: {
    async signIn(message) {
      const { user } = message;
      try {
        await deleteVerificationTokens(user?.email);
      } catch (err) {
        //TODO: send error to sentry
        console.error("Error deleting verification tokens: ", err);
      }
    },
  },
  pages: {
    verifyRequest: "/auth/verify-request",
    signIn: "/auth/signin",
  },
};

export default NextAuth(authOptions);
