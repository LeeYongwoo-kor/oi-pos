import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { User } from "@prisma/client";

export async function getUserByEmail(
  email: string | null | undefined
): Promise<User | null> {
  if (!email) {
    return null;
  }

  const [userByEmail, error] = await prismaRequestHandler(
    prisma.user.findUnique({
      where: {
        email,
      },
    }),
    "getUserByEmail"
  );

  if (error) {
    throw new Error(error.message);
  }

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

  const [updateUser, error] = await prismaRequestHandler(
    prisma.user.update({
      where: { id: userId },
      data: { role: "OWNER" },
    }),
    "updateUserRole"
  );

  if (error) {
    throw new Error(error.message);
  }

  return updateUser;
}
