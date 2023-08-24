import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { MenuSubCategory } from "@prisma/client";

export interface CreateMenuSubCategoryParams {
  categoryId?: string | null;
  name: string;
}

export async function getAllMenuSubCategoriesByCategoryId(
  menuCategoryId: string | null | undefined
): Promise<MenuSubCategory[] | null> {
  if (!menuCategoryId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.menuSubCategory.findMany({
      where: {
        categoryId: menuCategoryId,
      },
      include: {
        menuItems: true,
      },
    }),
    "getAllMenuSubCategoriesByCategoryId"
  );
}

export async function getAllSubCategories(): Promise<MenuSubCategory[] | null> {
  return null;
}
