import prisma from "@/lib/prismadb";
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
      console.log("token");
      console.log(token);
      console.log("user");
      console.log(user);
      console.log("account");
      console.log(account);
      console.log("profile");
      console.log(profile);
      console.log("isNewUser");
      console.log(isNewUser);
      if (account) {
        // If isNewUser, add a new record to the Restaurant and Restaurant Table.
        if (isNewUser) {
          // Create a new Restaurant for the new user
          const restaurant = await prisma.restaurant.create({
            data: {
              userId: user.id,
            },
          });

          // Create a new RestaurantTable for the new Restaurant
          await prisma.restaurantTable.create({
            data: {
              restaurantId: restaurant.id,
            },
          });
        }
        // Save the access token and refresh token in the JWT on the initial login
        return {
          ...token,
          access_token: account.access_token,
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
          // https://accounts.google.com/.well-known/openid-configuration
          // We need the `token_endpoint`.
          const response = await fetch("https://oauth2.googleapis.com/token", {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID,
              client_secret: process.env.GOOGLE_CLIENT_SECRET,
              grant_type: "refresh_token",
              refresh_token: token.refresh_token,
            } as any),
            method: "POST",
          });

          const tokens: TokenSet = await response.json();
          console.log(tokens);

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
      console.log("session session");
      console.log(session);
      console.log("user user");
      console.log(user);
      console.log("token token");
      console.log(token);
      session.error = token.error;
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      try {
        // Oauth only
        if (!email) {
          return true;
        }

        if (!email.verificationRequest) {
          // TODO: Hash the URL to prevent direct access
          return "/errors/email-already-in-use?allowAccess=true";
        }

        const response = await fetch(
          `${process.env.NEXTAUTH_URL}/api/v1/users/me`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: user?.email }),
          }
        );

        const userEmail = await response.json();

        if (userEmail.exists) {
          // TODO: Hash the URL to prevent direct access
          return "/errors/email-already-in-use?allowAccess=true";
        }

        return true;
      } catch (error) {
        console.error("An error occurred while checking the account.", error);
      }

      return true;
    },
  },
  pages: {
    verifyRequest: "/auth/verify-request",
    // signIn: "/auth/signin",
    newUser: "/auth/new-user",
  },
};

export default NextAuth(authOptions);
