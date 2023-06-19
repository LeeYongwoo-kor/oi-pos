import {
  createAccountByNewProvider,
  getAccount,
  getUserByEmail,
  updateUserRole,
} from "@/database";
import { deleteVerificationTokens } from "@/database/verificationToken";
import { generateVerifyLoginEmail } from "@/email/generateVerifyLoginEmail";
import { withErrorRetry } from "@/lib/server/withErrorRetry";
import prisma from "@/lib/services/prismadb";
import { sendEmail } from "@/lib/services/sendEmail";
import { CustomError } from "@/lib/shared/CustomError";
import { assignRefreshToken } from "@/utils/nextauth/assignRefreshToken";
import { verifyUserInformation } from "@/utils/nextauth/verifyUserInformation";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Account, User, UserStatus } from "@prisma/client";
import NextAuth, { NextAuthOptions, Session } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import LineProvider from "next-auth/providers/line";

// This is the configuration for NextAuth
export const authOptions: NextAuthOptions = {
  // The Prisma adapter allows NextAuth to connect to the Prisma database
  adapter: PrismaAdapter(prisma),
  // We configure three providers: Email, Google, and Line
  providers: [
    // The email provider allows authentication via email
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
    // The Google provider allows authentication via Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // use refresh token
      authorization: { params: { access_type: "offline", prompt: "consent" } },
    }),
    // The Line provider allows authentication via Line OAuth
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
    maxAge: 60 * 15, // 15 minutes
  },
  // The callbacks allow us to hook into various stages of the authentication process
  callbacks: {
    // The jwt callback is called whenever a JSON Web Token is created or updated
    async jwt({ token, user, account, profile, isNewUser }) {
      console.log("called next-auth jwt callback");
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
            message: errMessage,
          };
        }
      }
      // initial login success sign up
      if (user) {
        if (user.status !== UserStatus.ACTIVE) {
          return {
            ...token,
            errorName: "NotActiveUser",
            message: "You are not active user. Please contact support team.",
          };
        }
        token = { ...token, status: user.status, role: user.role };
      }
      // initial login success sign up
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
      } else {
        // Initialize token
        const { message, redirectUrl, isAllInfoRegistered, ...restToken } =
          token;
        // user validation check from second token rotation
        token = await verifyUserInformation(restToken);
      }

      if (token?.provider === "email") {
        // Email provider does not support refresh token
        return token;
      }

      // for OAuth provider refresh token
      if (token.refresh_token) {
        if (Date.now() < (token.expires_at || 0) * 1000) {
          // If the access token has not expired yet, return it
          return token;
        }

        // If the access token has expired, try to refresh it
        token = await assignRefreshToken(token);
      }

      return token;
    },
    // The session callback is called whenever a Session is accessed
    async session({ session, user, token }) {
      console.log("called next-auth session callback");
      const newSession: Partial<Session> = {
        ...session,
        user: {
          ...session.user,
          name: token?.name,
          image: token?.picture,
        },
      };

      if (token) {
        newSession.id = token.sub;
        if (token.errorName) {
          newSession.errorName = token.errorName;
        }
        if (token.message) {
          newSession.message = token.message;
        }
        if (token.redirectUrl) {
          newSession.redirectUrl = token.redirectUrl;
        }
        if (token.isAllInfoRegistered) {
          newSession.isAllInfoRegistered = token.isAllInfoRegistered;
        }
      }

      return newSession as Session;
    },
    // The signIn callback is called when a user signs in
    async signIn({ user, account, profile, email, credentials }) {
      try {
        if (email && !email.verificationRequest) {
          // not verified email
          return "/errors/EmailAlreadyInUse?allowAccess=true";
        }

        const userByEmail = await withErrorRetry<User | null>(() =>
          getUserByEmail(user?.email)
        )();

        if (userByEmail) {
          if (email) {
            // not verified email
            if (!userByEmail.emailVerified) {
              return "/errors/EmailAlreadyInUse?allowAccess=true";
            }

            return true;
          }

          const oauthAccount = await withErrorRetry<Account | null>(() =>
            getAccount(userByEmail.id, account?.providerAccountId)
          )();

          if (!oauthAccount) {
            await withErrorRetry<Account>(() =>
              createAccountByNewProvider(userByEmail.id, account)
            )();
          }
        }

        return true;
      } catch (err) {
        const errMessage =
          err instanceof CustomError ? err.message : String(err);
        //TODO: send error to sentry
        console.error(
          "An error occurred while checking the account: ",
          errMessage
        );
        return `/errors/PrismaError?allowAccess=true`;
      }
    },
  },
  events: {
    async signIn(message) {
      const { user } = message;
      try {
        await deleteVerificationTokens(user?.email);
      } catch (err) {
        //TODO: send error to sentry only
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
