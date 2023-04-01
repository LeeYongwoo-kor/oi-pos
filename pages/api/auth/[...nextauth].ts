import prisma from "@/lib/prismadb";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import sgMail from "@sendgrid/mail";
import NextAuth, { NextAuthOptions } from "next-auth";
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
      // checks: "both",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
  secret: process.env.SECRET,
  session: {
    strategy: "jwt",
    // strategy: "database",
    maxAge: 30 * 60 * 60 * 24,
    // Note: This option is ignored if using JSON Web Tokens
    updateAge: 60 * 60 * 24,
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        if (email && !email.verificationRequest) {
          // TODO: Hash the URL to prevent direct access
          return "/errors/email-already-in-use?allowAccess=true";
        }

        const response = await fetch(
          `${process.env.NEXTAUTH_URL}/api/users/me`,
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
          // TODO: Remove this code after development is complete.
          if (!email) {
            return true;
          }
          // TODO: Hash the URL to prevent direct access
          return "/errors/email-already-in-use?allowAccess=true";
        }

        return "/unauthorized";
      } catch (error) {
        console.error("An error occurred while checking the account.", error);
      }

      return "/unauthorized";
    },
  },
  pages: {
    verifyRequest: "/auth/verify-request",
    signIn: "/auth/signin",
  },
};

export default NextAuth(authOptions);
