import { Account } from "@prisma/client";
import { Account as NextAuthAccount } from "next-auth/core/types";

export async function getAccount(
  userId: string,
  providerAccountId: string | null | undefined
): Promise<Account | null | undefined> {
  if (!providerAccountId) {
    return null;
  }

  try {
    const accountResult = await prisma?.account.findFirst({
      where: {
        userId,
        providerAccountId,
      },
    });

    return accountResult;
  } catch (e) {
    console.error("Error fetching account by ID: ", e);
    throw e;
  }
}

export async function getAllAccounts(): Promise<Account[] | null> {
  return null;
}

export async function createAccountByNewProvider(
  userId: string,
  account: NextAuthAccount | null
): Promise<Account | null | undefined> {
  if (!account) {
    return null;
  }

  try {
    const newAccount = await prisma?.account.create({
      data: {
        userId,
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
    });

    if (!newAccount) {
      throw new Error("failed to create account");
    }

    return newAccount;
  } catch (e) {
    console.error("Error creating account by new provider: ", e);
    throw e;
  }
}
