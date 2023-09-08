import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import { MenuSubCategory, Prisma } from "@prisma/client";

export interface CreateMenuSubCategoryParams {
  categoryId: string | null | undefined;
  name: string;
}
export interface UpdateMenuSubCategoryParams {
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

export async function updateMenuSubCategory(
  menuSubCategoryId: string | null | undefined,
  menuSubCategoryInfo: UpdateMenuSubCategoryParams
): Promise<MenuSubCategory> {
  if (!menuSubCategoryId || hasNullUndefined(menuSubCategoryInfo)) {
    throw new ValidationError(
      "Failed to update sub menu category. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.menuSubCategory.update({
      where: {
        id: menuSubCategoryId,
      },
      data: {
        name: menuSubCategoryInfo.name,
      },
    }),
    "updateMenuSubCategory"
  );
}

export async function deleteMenuSubCategory(
  menuSubCategoryId: string | null | undefined
): Promise<MenuSubCategory> {
  if (!menuSubCategoryId) {
    throw new ValidationError(
      "Failed to delete sub menu category. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.menuSubCategory.delete({
      where: {
        id: menuSubCategoryId,
      },
    }),
    "deleteMenuSubCategory"
  );
}

export async function getAllSubCategories(): Promise<MenuSubCategory[] | null> {
  return null;
}
