import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import {
  MenuCategory,
  MenuCategoryOption,
  MenuCategoryStatus,
  MenuSubCategory,
  Prisma,
} from "@prisma/client";
import { IMenuItem } from "./menuItem";
import { createMenuSubCategory } from "./menuSubCategory";

export interface IMenuCategory extends MenuCategory {
  menuItems: IMenuItem[];
  subCategories: MenuSubCategory[];
  defaultOptions: MenuCategoryOption[];
}
export interface CreateMenuCategoryParams {
  restaurantId: string;
  name: string;
  imageUrl?: string;
  imageVersion?: number;
  status?: MenuCategoryStatus;
  description?: string;
  displayOrder?: number;
}

export interface UpdateMenuCategoryParams extends CreateMenuCategoryParams {
  id?: string;
}

export type UpsertMenuCategoryParams = CreateMenuCategoryParams &
  UpdateMenuCategoryParams;

export async function getOneMenuCategory(
  restaurantId: string | null | undefined
): Promise<MenuCategory | null> {
  if (!restaurantId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.menuCategory.findFirst({
      where: {
        restaurantId,
      },
    }),
    "getOneMenuCategory"
  );
}

export async function getAllCategoriesByRestaurantId(
  restaurantId: string | null | undefined
): Promise<IMenuCategory[] | null> {
  if (!restaurantId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.menuCategory.findMany({
      where: {
        restaurantId,
      },
      include: {
        subCategories: true,
        menuItems: {
          include: {
            menuItemOptions: true,
          },
        },
        defaultOptions: true,
      },
    }),
    "getAllCategoriesByRestaurantId"
  );
}

export async function createMenuCategory(
  menuCategryInfo: CreateMenuCategoryParams,
  tx?: Prisma.TransactionClient
): Promise<MenuCategory> {
  const prismaIns = tx || prisma;

  if (hasNullUndefined(menuCategryInfo)) {
    throw new ValidationError(
      "Failed to create menu category. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuCategory.create({
      data: {
        restaurantId: menuCategryInfo.restaurantId,
        name: menuCategryInfo.name,
        description: menuCategryInfo.description,
        imageUrl: menuCategryInfo.imageUrl,
        status: menuCategryInfo.status,
        displayOrder: menuCategryInfo.displayOrder,
      },
    }),
    "createMenuCategory"
  );
}

export async function upsertMenuCategory(
  menuCategryInfo: UpsertMenuCategoryParams
): Promise<MenuCategory> {
  if (hasNullUndefined(menuCategryInfo)) {
    throw new ValidationError(
      "Failed to create menu category. Please try again later"
    );
  }

  const upsertMenuCategoryData = {
    id: menuCategryInfo.id,
    restaurantId: menuCategryInfo.restaurantId,
    name: menuCategryInfo.name,
    description: menuCategryInfo.description,
    imageUrl: menuCategryInfo.imageUrl,
    imageVersion: menuCategryInfo.imageVersion,
    status: menuCategryInfo.status,
    displayOrder: menuCategryInfo.displayOrder,
  };

  return prismaRequestHandler(
    prisma.menuCategory.upsert({
      where: {
        id: menuCategryInfo.id,
      },
      create: upsertMenuCategoryData,
      update: upsertMenuCategoryData,
    }),
    "createMenuCategory"
  );
}

export async function updateMenuCategory(
  menuCategoryId: string | null | undefined,
  updateCategoryInfo: Partial<Omit<MenuCategory, "id" | "restaurantId">>,
  tx?: Prisma.TransactionClient
): Promise<MenuCategory> {
  const prismaIns = tx || prisma;

  if (!menuCategoryId || hasNullUndefined(updateCategoryInfo)) {
    throw new ValidationError(
      "Failed to update menu category. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuCategory.update({
      where: {
        id: menuCategoryId,
      },
      data: updateCategoryInfo,
    }),
    "updateMenuCategory"
  );
}

export async function deleteMenuCategory(
  menuCategoryId: string | null | undefined
): Promise<MenuCategory> {
  if (!menuCategoryId) {
    throw new ValidationError(
      "Failed to delete menu category. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.menuCategory.delete({
      where: {
        id: menuCategoryId,
      },
    }),
    "deleteMenuCategory"
  );
}

export async function deleteManyMenuCategory(
  restaurantId: string | null | undefined
): Promise<Prisma.BatchPayload> {
  if (!restaurantId) {
    throw new ValidationError(
      "Failed to delete menu category. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.menuCategory.deleteMany({
      where: {
        restaurantId,
      },
    }),
    "deleteManyMenuCategory"
  );
}

export async function createMenuCategoryWithSub(
  menuCategryInfo: CreateMenuCategoryParams,
  subCategoryInfo?: { name: string }[],
  tx?: Prisma.TransactionClient
): Promise<[MenuCategory, MenuSubCategory[] | undefined]> {
  let subMenuCategory: MenuSubCategory[] | undefined;

  if (hasNullUndefined(menuCategryInfo)) {
    throw new ValidationError(
      "Failed to create menu category. Please try again later"
    );
  }

  if (subCategoryInfo) {
    subCategoryInfo.forEach((subCategory) => {
      if (hasNullUndefined(subCategory)) {
        throw new ValidationError(
          "Failed to create menu category with subCategories. Please try again later"
        );
      }
    });
  }

  // Create a new menu category
  const menuCategory = await createMenuCategory(menuCategryInfo, tx);

  // If SubCategoryInfo exists, create a new sub menu category
  if (subCategoryInfo) {
    subMenuCategory = await Promise.all(
      subCategoryInfo.map((subCategory) => {
        return createMenuSubCategory(
          {
            categoryId: menuCategory.id,
            name: subCategory.name,
          },
          tx
        );
      })
    );
  }

  return [menuCategory, subMenuCategory];
}
