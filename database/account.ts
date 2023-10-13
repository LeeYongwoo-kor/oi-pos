import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { Account } from "@prisma/client";
import { Account as NextAuthAccount } from "next-auth/core/types";

export async function getAccount(
  userId: string,
  providerAccountId: string | null | undefined
): Promise<Account | null> {
  if (!providerAccountId) {
    return null;
  }

  const account = await prismaRequestHandler(
    prisma.account.findFirst({
      where: {
        userId,
        providerAccountId,
      },
    }),
    "getAccount"
  );

  return account;
}

export async function getAllAccounts(): Promise<Account[] | null> {
  return null;
}

export async function createAccountByNewProvider(
  userId: string,
  account: NextAuthAccount | null
): Promise<Account> {
  if (!account) {
    throw new ValidationError("failed to create account");
  }

  const newAccount = await prismaRequestHandler(
    prisma.account.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
      },
    }),
    "createAccountByNewProvider"
  );

  return newAccount;
}
