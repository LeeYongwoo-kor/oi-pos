import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import { MenuCategoryOption, Prisma } from "@prisma/client";

export interface UpsertMenuCategoryOptionParams {
  id?: string | null;
  categoryId: string | null | undefined;
  name: string;
  price: number | "";
  description?: string;
}
export interface UpdateMenuCategoryOptionParams {
  name: string;
  price: number | "";
  description?: string;
}

export async function getMenuCategoryOptionByCategoryId(
  categoryId: string | null | undefined
): Promise<MenuCategoryOption[] | null> {
  if (!categoryId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.menuCategoryOption.findMany({
      where: {
        categoryId,
      },
    }),
    "getMenuCategoryOptionByCategoryId"
  );
}

export async function createMenuCategoryOption(
  menuCategoryOptionInfo: UpsertMenuCategoryOptionParams,
  tx?: Prisma.TransactionClient
): Promise<MenuCategoryOption> {
  const prismaIns = tx || prisma;

  if (
    !menuCategoryOptionInfo.categoryId ||
    !menuCategoryOptionInfo.price ||
    hasNullUndefined(menuCategoryOptionInfo)
  ) {
    throw new ValidationError(
      "Failed to create menu category option. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuCategoryOption.create({
      data: {
        categoryId: menuCategoryOptionInfo.categoryId,
        name: menuCategoryOptionInfo.name,
        price: menuCategoryOptionInfo.price,
        description: menuCategoryOptionInfo.description,
      },
    }),
    "createMenuCategoryOption"
  );
}

export async function createManyMenuCategoryOptions(
  menuCategoryOptionInfo: UpsertMenuCategoryOptionParams,
  tx?: Prisma.TransactionClient
): Promise<Prisma.BatchPayload> {
  const prismaIns = tx || prisma;

  if (
    !menuCategoryOptionInfo.categoryId ||
    !menuCategoryOptionInfo.price ||
    hasNullUndefined(menuCategoryOptionInfo)
  ) {
    throw new ValidationError(
      "Failed to create menu category option. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuCategoryOption.createMany({
      data: {
        categoryId: menuCategoryOptionInfo.categoryId,
        name: menuCategoryOptionInfo.name,
        price: menuCategoryOptionInfo.price,
        description: menuCategoryOptionInfo.description,
      },
    }),
    "createManyMenuCategoryOptions"
  );
}

export async function updateMenuCategoryOption(
  menuCategoryOptionId: string | null | undefined,
  menuCategoryOptionInfo: UpdateMenuCategoryOptionParams,
  tx?: Prisma.TransactionClient
): Promise<MenuCategoryOption> {
  const prismaIns = tx || prisma;

  if (
    !menuCategoryOptionId ||
    !menuCategoryOptionInfo.price ||
    hasNullUndefined(menuCategoryOptionInfo)
  ) {
    throw new ValidationError(
      "Failed to update menu category option. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuCategoryOption.update({
      where: {
        id: menuCategoryOptionId,
      },
      data: menuCategoryOptionInfo as Prisma.MenuCategoryOptionUpdateInput,
    }),
    "updateMenuCategoryOption"
  );
}

export async function updateManyMenuCategoryOptions(
  categoryId: string | null | undefined,
  menuCategoryOptionInfo: UpdateMenuCategoryOptionParams[]
): Promise<Prisma.BatchPayload> {
  if (!categoryId || hasNullUndefined(menuCategoryOptionInfo)) {
    throw new ValidationError(
      "Failed to update menu category option. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.menuCategoryOption.updateMany({
      where: {
        categoryId,
      },
      data: menuCategoryOptionInfo,
    }),
    "updateManyMenuCategoryOptions"
  );
}

export async function deleteMenuCategoryOption(
  id: string | null | undefined,
  tx?: Prisma.TransactionClient
): Promise<MenuCategoryOption> {
  const prismaIns = tx || prisma;

  if (!id) {
    throw new ValidationError(
      "Failed to delete menu category option. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuCategoryOption.delete({
      where: {
        id,
      },
    }),
    "deleteMenuCategoryOption"
  );
}

export async function deleteManyMenuCategoryOptions(
  categoryId: string | null | undefined
): Promise<Prisma.BatchPayload> {
  if (!categoryId) {
    throw new ValidationError(
      "Failed to delete menu category option. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.menuCategoryOption.deleteMany({
      where: {
        categoryId,
      },
    }),
    "deleteManyMenuCategoryOptions"
  );
}

export async function getAllCategoryOptions(): Promise<
  MenuCategoryOption[] | null
> {
  return null;
}
