import prisma from "@/lib/server/prismadb";
import {
  createAccountByNewProvider,
  getAccount,
  getUserByEmail,
} from "@/utils/database";
import { createRestaurantAndTable } from "@/utils/database/transactions";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import sgMail from "@sendgrid/mail";
import NextAuth, { NextAuthOptions, TokenSet } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import LineProvider from "next-auth/providers/line";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Configure one or more authentication providers
  providers: [
    EmailProvider({
      name: "Email",
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USERx,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest({ identifier, url }) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
        const msg = {
          to: identifier,
          from: process.env.EMAIL_FROM,
          subject: "Please Verify Your Account",
          text: "and easy to do anywhere, even with Yoshi!",
          html: `<body><div><strong>and easy to do anywhere, even with Yoshi!!!!</strong></div>
          <span><a href="${url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #346df1; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid; display: inline-block; font-weight: bold;">Sign in</a></span></body>`,
        };

        sgMail
          .send(msg)
          .then(() => console.log("Email sent!"))
          .catch((err) => console.error(err));
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
    maxAge: 30 * 60 * 60 * 24, // 30 days
    // Note: This option is ignored if using JSON Web Tokens
    updateAge: 60 * 60 * 24, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }: any) {
      // first login
      if (account) {
        // If isNewUser, add a new record to the Restaurant and Restaurant Table.
        if (isNewUser) {
          try {
            // Create a new Restaurant and new RestaurantTable
            const result = await createRestaurantAndTable(user?.id);
            console.log(result);
          } catch (error) {
            console.error(
              "Error creating restaurant and restaurant table: ",
              error
            );
            // The error property will be used client-side to handle the refresh token error
            return { ...token, error: "CreateRestaurantInfoError" as const };
          }
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
              throw new Error("Unsupported provider");
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
      session.error = token.error;
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log(user);
      console.log(account);
      console.log(profile);
      console.log(email);
      try {
        if (email && !email.verificationRequest) {
          // TODO: Hash the URL to prevent direct access
          return "/errors/email-already-in-use?allowAccess=true";
        }

        const userByEmail = await getUserByEmail(user?.email);

        if (userByEmail) {
          if (email) {
            return "/errors/email-already-in-use?allowAccess=true";
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
  pages: {
    verifyRequest: "/auth/verify-request",
    signIn: "/auth/signin",
    error: "/auth/error",
    // newUser: "/auth/new-user",
  },
};

export default NextAuth(authOptions);
