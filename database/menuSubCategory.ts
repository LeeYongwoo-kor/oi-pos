import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import { MenuSubCategory, Prisma } from "@prisma/client";

export interface CreateMenuSubCategoryParams {
  categoryId: string | null | undefined;
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

export async function createMenuSubCategory(
  menuSubCategoryInfo: CreateMenuSubCategoryParams,
  tx?: Prisma.TransactionClient
): Promise<MenuSubCategory> {
  const prismaIns = tx || prisma;

  if (
    !menuSubCategoryInfo.categoryId ||
    hasNullUndefined(menuSubCategoryInfo)
  ) {
    throw new ValidationError(
      "Failed to create sub menu category. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuSubCategory.create({
      data: {
        categoryId: menuSubCategoryInfo.categoryId,
        name: menuSubCategoryInfo.name,
      },
    }),
    "createMenuSubCategory"
  );
}

export async function getAllSubCategories(): Promise<MenuSubCategory[] | null> {
  return null;
}
