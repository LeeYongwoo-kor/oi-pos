import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import { MenuItemOption, Prisma } from "@prisma/client";

export interface UpsertMenuItemOptionParams {
  id?: string | null;
  menuItemId: string | null | undefined;
  menuCategoryOptionId?: string | null | undefined;
  name: string;
  price: number | "";
  description?: string;
}
export interface UpdateMenuItemOptionParams {
  name: string;
  price: number | "";
  description?: string;
}

export async function getMenuItemOptionByMenuItemId(
  menuItemId: string | null | undefined
): Promise<MenuItemOption[] | null> {
  if (!menuItemId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.menuItemOption.findMany({
      where: {
        menuItemId,
      },
    }),
    "getMenuItemOptionByMenuItemId"
  );
}

export async function createMenuItemOption(
  menuItemOptionInfo: UpsertMenuItemOptionParams,
  tx?: Prisma.TransactionClient
): Promise<MenuItemOption> {
  const prismaIns = tx || prisma;

  if (
    !menuItemOptionInfo.menuItemId ||
    !menuItemOptionInfo.name ||
    !menuItemOptionInfo.price
  ) {
    throw new ValidationError(
      "Failed to create menu category option. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuItemOption.create({
      data: {
        menuItemId: menuItemOptionInfo.menuItemId,
        menuCategoryOptionId: menuItemOptionInfo?.menuCategoryOptionId,
        name: menuItemOptionInfo.name,
        price: menuItemOptionInfo.price,
        description: menuItemOptionInfo.description,
      },
    }),
    "createMenuItemOption"
  );
}

export async function createManyMenuItemOptions(
  menuItemOptionInfo: UpsertMenuItemOptionParams,
  tx?: Prisma.TransactionClient
): Promise<Prisma.BatchPayload> {
  const prismaIns = tx || prisma;

  if (
    !menuItemOptionInfo.menuItemId ||
    !menuItemOptionInfo.price ||
    hasNullUndefined(menuItemOptionInfo)
  ) {
    throw new ValidationError(
      "Failed to create menu category option. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuItemOption.createMany({
      data: {
        menuItemId: menuItemOptionInfo.menuItemId,
        name: menuItemOptionInfo.name,
        price: menuItemOptionInfo.price,
        description: menuItemOptionInfo.description,
      },
    }),
    "createManyMenuItemOptions"
  );
}

export async function updateMenuItemOption(
  menuItemOptionId: string | null | undefined,
  menuItemOptionInfo: UpdateMenuItemOptionParams,
  tx?: Prisma.TransactionClient
): Promise<MenuItemOption> {
  const prismaIns = tx || prisma;

  if (
    !menuItemOptionId ||
    !menuItemOptionInfo.price ||
    hasNullUndefined(menuItemOptionInfo)
  ) {
    throw new ValidationError(
      "Failed to update menu category option. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuItemOption.update({
      where: {
        id: menuItemOptionId,
      },
      data: menuItemOptionInfo as Prisma.MenuItemOptionUpdateInput,
    }),
    "updateMenuItemOption"
  );
}

export async function updateManyMenuItemOptions(
  menuItemId: string | null | undefined,
  menuItemOptionInfo: UpdateMenuItemOptionParams[]
): Promise<Prisma.BatchPayload> {
  if (!menuItemId || hasNullUndefined(menuItemOptionInfo)) {
    throw new ValidationError(
      "Failed to update menu category option. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.menuItemOption.updateMany({
      where: {
        menuItemId,
      },
      data: menuItemOptionInfo,
    }),
    "updateManyMenuItemOptions"
  );
}

export async function deleteMenuItemOption(
  id: string | null | undefined,
  tx?: Prisma.TransactionClient
): Promise<MenuItemOption> {
  const prismaIns = tx || prisma;

  if (!id) {
    throw new ValidationError(
      "Failed to delete menu category option. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuItemOption.delete({
      where: {
        id,
      },
    }),
    "deleteMenuItemOption"
  );
}

export async function deleteManyMenuItemOptions(
  menuItemId: string | null | undefined
): Promise<Prisma.BatchPayload> {
  if (!menuItemId) {
    throw new ValidationError(
      "Failed to delete menu option. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.menuItemOption.deleteMany({
      where: {
        menuItemId,
      },
    }),
    "deleteManyMenuItemOptions"
  );
}

export async function getAllItemOptions(): Promise<MenuItemOption[] | null> {
  return null;
}
