import { UserRole, UserStatus } from "@prisma/client";
import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    id?: string | null;
    errorName?: string;
    message?: string;
    redirectUrl?: string;
    isAllInfoRegistered?: boolean;
    user: {
      // The OAuth account ID
    } & DefaultSession["user"];
  }

  interface Profile {
    picture?: string;
  }
  interface User {
    status?: UserStatus;
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    status?: UserStatus;
    role?: UserRole;
    provider?: string;
    access_token?: string;
    expires_at?: number;
    refresh_token?: string;
    errorName?: string;
    message?: string;
    redirectUrl?: string;
    isAllInfoRegistered?: boolean;
  }
}
