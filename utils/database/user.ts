import { User } from "@prisma/client";

export async function getUserByEmail(
  email: string | null | undefined
): Promise<User | null | undefined> {
  if (!email) {
    return null;
  }

  try {
    const userByEmail = await prisma?.user.findUnique({
      where: {
        email,
      },
    });

    return userByEmail;
  } catch (e) {
    console.error("Error fetching user by email: ", e);
    throw e;
  }
}

export async function getAllUsers(): Promise<User[] | null> {
  return null;
}
