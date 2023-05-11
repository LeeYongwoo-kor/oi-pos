import { generateVerifyLoginEmail } from "@/email/generateVerifyLoginEmail";
import prisma from "@/lib/server/prismadb";
import { sendEmail } from "@/lib/server/sendEmail";
import CustomError from "@/utils/CustomError";
import {
  createAccountByNewProvider,
  getAccount,
  getUserByEmail,
  updateUserRole,
} from "@/utils/database";
import { createRestaurantAndTable } from "@/utils/database/transactions";
import { deleteVerificationTokens } from "@/utils/database/verificationToken";
import retryAsyncProcess from "@/utils/retryAsyncProcess";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Restaurant, RestaurantTable, User } from "@prisma/client";
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
          user: process.env.EMAIL_SERVER_USERx,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        try {
          await deleteVerificationTokens(identifier);
        } catch (e) {
          //TODO: send log to sentry
          console.error(e);
        }

        try {
          const emailContent = generateVerifyLoginEmail(url);

          await sendEmail({
            to: identifier,
            from: process.env.EMAIL_FROM!,
            subject: "Hello, I'm Yoshi! Please Verify Your Account",
            html: emailContent,
          });
        } catch (e) {
          console.error(e);
          throw new CustomError("Error sending email", e);
        }
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
    async jwt({ token, user, account, profile, isNewUser }: any) {
      console.log("this is jwt");
      // first login
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
      } else if (Date.now() < token.expires_at * 1000) {
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
              // Refresh Google access token
              response = await fetch("https://oauth2.googleapis.com/token", {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  client_id: process.env.GOOGLE_CLIENT_ID,
                  client_secret: process.env.GOOGLE_CLIENT_SECRET,
                  grant_type: "refresh_token",
                  refresh_token: token.refresh_token,
                } as any),
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
                  client_id: process.env.LINE_CLIENT_ID,
                  client_secret: process.env.LINE_CLIENT_SECRET,
                  grant_type: "refresh_token",
                  refresh_token: token.refresh_token,
                } as any),
                method: "POST",
              });
              break;
            default:
              return { ...token, error: "UnsupportedProviderError" as const };
          }

          const tokens: TokenSet = await response.json();
          if (!response.ok) throw tokens;

          return {
            ...token, // Keep the previous token properties
            access_token: tokens.access_token,
            expires_at: Math.floor(
              Date.now() / 1000 + (tokens.expires_in || 3599)
            ),
            // Fall back to old refresh token, but note that
            // many providers may only allow using a refresh token once.
            refresh_token: tokens.refresh_token ?? token.refresh_token,
          };
        } catch (error) {
          console.error("Error refreshing access token", error);
          // The error property will be used client-side to handle the refresh token error
          return { ...token, error: "RefreshAccessTokenError" as const };
        }
      }
    },
    async session({ session, user, token }: any) {
      console.log("this is session");
      const { error } = token;
      if (token) {
        if (error) {
          session.error = error;
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
            const createAccount = await createAccountByNewProvider(
              userByEmail.id,
              account
            );

            if (!createAccount) {
              return "/errors/prisma-error?name=CreateAccountError";
            }
          }
        }

        return true;
      } catch (error) {
        console.error("An error occurred while checking the account: ", error);
        return `/errors/prisma-error?name=PrismaFetchError`;
      }
    },
  },
  events: {
    async signIn(message) {
      const { user } = message;
      try {
        const deleteVerificationTokensResult = await deleteVerificationTokens(
          user?.email
        );
        console.log(
          "deleted verification tokens: ",
          deleteVerificationTokensResult
        );
      } catch (e) {
        console.error("Error deleting verification tokens: ", e);
      }
    },
    async createUser(message) {
      const { user } = message;
      try {
        const maxRetries = 3;
        await Promise.all([
          retryAsyncProcess<(Restaurant | RestaurantTable)[]>(
            () => createRestaurantAndTable(user?.id),
            maxRetries
          ),
          retryAsyncProcess<User>(() => updateUserRole(user?.id), maxRetries),
        ]);
      } catch (e) {
        console.error("An error occurred in one of the processes:", e);
      }
    },
  },
  pages: {
    verifyRequest: "/auth/verify-request",
    signIn: "/auth/signin",
    error: "/auth/error",
    // newUser: "/auth/new-user",
  },
};

export default NextAuth(authOptions);
