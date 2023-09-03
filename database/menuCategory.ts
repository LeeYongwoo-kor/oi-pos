import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import { MenuCategory, MenuItem, MenuSubCategory } from "@prisma/client";
import { ValidationError } from "yup";

export interface IMenuCategory extends MenuCategory {
  menuItems: MenuItem[];
  subCategories: MenuSubCategory[];
}
export interface CreateMenuCategoryParams {
  restaurantId: string;
  name: string;
  imageUrl?: string;
  description?: string;
  displayOrder?: number;
}

export interface UpdateMenuCategoryParams {
  id: string;
  name: string;
  imageUrl?: string;
  imageVersion?: number;
  description?: string;
  displayOrder?: number;
}

export type UpsertMenuCategoryParams = CreateMenuCategoryParams &
  UpdateMenuCategoryParams;

export async function getAllCategoriesByRestaurantId(
  restaurantId: string | null | undefined
): Promise<MenuCategory[] | null> {
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
        menuItems: true,
      },
    }),
    "getAllCategoriesByRestaurantId"
  );
}

export async function createMenuCategory(
  menuCategryInfo: CreateMenuCategoryParams
): Promise<MenuCategory> {
  if (hasNullUndefined(menuCategryInfo)) {
    throw new ValidationError(
      "Failed to create menu category. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.menuCategory.create({
      data: {
        restaurantId: menuCategryInfo.restaurantId,
        name: menuCategryInfo.name,
        description: menuCategryInfo.description,
        imageUrl: menuCategryInfo.imageUrl,
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
  updateCategoryInfo: Partial<Omit<MenuCategory, "id" | "restaurantId">>
): Promise<MenuCategory> {
  if (!menuCategoryId || hasNullUndefined(updateCategoryInfo)) {
    throw new ValidationError(
      "Failed to update menu category. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.menuCategory.update({
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
