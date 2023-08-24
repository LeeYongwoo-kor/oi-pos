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
  imageUrl: string;
  imageVersion?: number;
  description?: string;
  displayOrder?: number;
}

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
        imageVersion: menuCategryInfo.imageVersion,
        displayOrder: menuCategryInfo.displayOrder,
      },
    }),
    "createMenuCategory"
  );
}
