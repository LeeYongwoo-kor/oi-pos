import { UserRoleType } from "@/constants/type";
import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { SubscriptionStatus, User } from "@prisma/client";

export interface IUserForVerify extends Pick<User, "status"> {
  subscription: {
    status: SubscriptionStatus;
    currentPeriodEnd: Date;
  } | null;
  restaurant: {
    id: string;
    startTime: string | null;
    endTime: string | null;
    menuCategories: {
      id: string;
    }[];
    restaurantTables: {
      id: string;
    }[];
  } | null;
}

export async function getUserById(
  userId: string | null | undefined
): Promise<User | null> {
  if (!userId) {
    return null;
  }

  const userById = await prismaRequestHandler(
    prisma.user.findUnique({
      where: {
        id: userId,
      },
    }),
    "getUserById"
  );

  return userById;
}

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

export async function getUserInfoForVerify(
  userId: string | undefined | null
): Promise<IUserForVerify | null> {
  if (!userId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        status: true,
        subscription: {
          select: {
            status: true,
            currentPeriodEnd: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            menuCategories: {
              take: 1,
              select: {
                id: true,
              },
            },
            restaurantTables: {
              take: 1,
              select: {
                id: true,
              },
            },
          },
        },
      },
    }),
    "getUserInfoForVerify"
  );
}

export async function getAllUsers(): Promise<User[] | null> {
  return null;
}

export async function updateUserRole(
  userId: string | null | undefined,
  userRole?: UserRoleType
): Promise<User> {
  if (!userId) {
    throw new ValidationError("Not found user id");
  }

  const updateUser = await prismaRequestHandler(
    prisma.user.update({
      where: { id: userId },
      data: { role: userRole || UserRoleType.OWNER },
    }),
    "updateUserRole"
  );

  return updateUser;
}

export async function updateUserStatus(
  userId: string | null | undefined,
  userStatus: UserStatusType
): Promise<User> {
  if (!userId) {
    throw new ValidationError("Not found user id");
  }

  const updateUser = await prismaRequestHandler(
    prisma.user.update({
      where: { id: userId },
      data: { status: userStatus },
    }),
    "updateUserStatus"
  );

  return updateUser;
}
