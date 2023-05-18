import { DefaultSession } from "next-auth";

export interface Session extends DefaultSession {
  id?: string | null;
}
