import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { User } from "@prisma/client";

export async function getUserByEmail(
  email: string | null | undefined
): Promise<User | null> {
  if (!email) {
    return null;
  }

  const userByEmail = await prismaRequestHandler(
    prisma.user.findUnique({
      where: {
        email,
      },
    }),
    "getUserByEmail"
  );

  return userByEmail;
}

export async function getAllUsers(): Promise<User[] | null> {
  return null;
}

export async function updateUserRole(
  userId: string | null | undefined
): Promise<User> {
  if (!userId) {
    throw new Error("not found user id");
  }

  const updateUser = await prismaRequestHandler(
    prisma.user.update({
      where: { id: userId },
      data: { role: "OWNER" },
    }),
    "updateUserRole"
  );

  return updateUser;
}
