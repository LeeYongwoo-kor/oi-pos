import {
  createAccountByNewProvider,
  getAccount,
  getMenuItem,
  getRestaurant,
  getRestaurantTable,
  getSubscription,
  getUserByEmail,
  getUserById,
  updateSubscriptionStatus,
  updateUserRole,
} from "@/database";
import { deleteVerificationTokens } from "@/database/verificationToken";
import { generateVerifyLoginEmail } from "@/email/generateVerifyLoginEmail";
import { withErrorRetry } from "@/lib/server/withErrorRetry";
import prisma from "@/lib/services/prismadb";
import { sendEmail } from "@/lib/services/sendEmail";
import { CustomError, ForbiddenError } from "@/lib/shared/CustomError";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {
  Account,
  MenuItem,
  Restaurant,
  RestaurantTable,
  Subscription,
  SubscriptionStatus,
  User,
  UserStatus,
} from "@prisma/client";
import NextAuth, { NextAuthOptions, Session, TokenSet } from "next-auth";
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
    maxAge: 60 * 15, // 15 minutes
  },
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
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
        const { message, redirectUrl, ...restToken } = token;
        token = restToken;
        try {
          // user validation check from second token rotation
          // 1. check user status
          const userInfo = await withErrorRetry<User | null>(() =>
            getUserById(token.sub)
          )();
          if (!userInfo || userInfo.status !== UserStatus.ACTIVE) {
            throw new ForbiddenError(
              "You are not active user. Please contact support team."
            );
          }

          // 2. check subscription status and check subscription info -> redirect plan register page
          const subscriptionInfo = await withErrorRetry<Subscription | null>(
            () => getSubscription(token.sub)
          )();
          if (!subscriptionInfo) {
            return {
              ...token,
              message:
                "You don't have subscription. Please register your subscription first.",
              redirectUrl: "/plans/register",
            };
          }

          if (
            subscriptionInfo.status === SubscriptionStatus.CANCELLED ||
            subscriptionInfo.status === SubscriptionStatus.PENDING
          ) {
            return {
              ...token,
              message:
                "Your subscription is cancelled or pending. Please register your subscription first.",
              redirectUrl: "/plans/register",
            };
          }

          if (subscriptionInfo.status === SubscriptionStatus.EXPIRED) {
            return {
              ...token,
              message:
                "Your subscription has expired. Please renew your subscription.",
              redirectUrl: "/plans/register",
            };
          }

          // 3. check subscription expiration date -> redirect plan register page
          const currentDate = new Date();
          const subscriptionEndDate = new Date(
            subscriptionInfo.currentPeriodEnd
          );
          if (subscriptionEndDate < currentDate) {
            await withErrorRetry<Subscription | null>(() =>
              updateSubscriptionStatus(token.sub, SubscriptionStatus.EXPIRED)
            )();
            return {
              ...token,
              message:
                "Your subscription has expired. Please renew your subscription.",
              redirectUrl: "/plans/register",
            };
          }

          // 4. check restraurant info -> redirect restaurant register page(step 1)
          const restaurantInfo = await withErrorRetry<Restaurant | null>(() =>
            getRestaurant(token.sub)
          )();
          if (!restaurantInfo) {
            return {
              ...token,
              message:
                "You don't register restaurant information yet. Please register restaurant information.",
              redirectUrl: "/restaurants/info",
            };
          }

          // 5. check restraurant info of startTime, endTime -> redirect hours register page(step 2)
          if (!restaurantInfo.startTime || !restaurantInfo.endTime) {
            return {
              ...token,
              message:
                "You don't register restaurant hours. Please register restaurant hours.",
              redirectUrl: "/restaurants/hours",
            };
          }

          // 6. check restraurantTable info -> redirect table register page(step 3)
          const restaurantTableInfo =
            await withErrorRetry<RestaurantTable | null>(() =>
              getRestaurantTable(restaurantInfo.id)
            )();
          if (!restaurantTableInfo) {
            return {
              ...token,
              message:
                "You don't register restaurant table. Please register restaurant table.",
              redirectUrl: "/restaurants/table",
            };
          }

          // 7. check menu info -> redirect menu register page(step 4)
          const menuInfo = await withErrorRetry<MenuItem | null>(() =>
            getMenuItem(restaurantInfo.id)
          )();
          if (!menuInfo) {
            return {
              ...token,
              message: "You don't register menu. Please register menu.",
              redirectUrl: "/menus",
            };
          }

          return token;
        } catch (err) {
          const errMessage =
            err instanceof CustomError ? err.message : String(err);
          //TODO: send error to sentry
          console.error("Error occurred in token validation: ", errMessage);
          if (err instanceof CustomError) {
            if (err instanceof ForbiddenError) {
              return {
                ...token,
                errorName: "NotActiveUser",
                message: errMessage,
              };
            }
            return { ...token, errorName: err.name, message: errMessage };
          }
        }
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
        } else {
          // If the access token has expired, try to refresh it
          try {
            let response: Response;
            if (!token.refresh_token) {
              throw token;
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
                response = await fetch(
                  "https://api.line.me/oauth2/v2.1/token",
                  {
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
                  }
                );
                break;
              default:
                return {
                  ...token,
                  errorName: "UnsupportedProviderError",
                  message: `Provider ${token.provider} is not supported`,
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
              message: "Error refreshing access token",
            };
          }
        }
      }

      return token;
    },
    async session({ session, user, token }) {
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
      }

      return newSession as Session;
    },
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
