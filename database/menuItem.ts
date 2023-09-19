import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { CartItem } from "@/recoil/state/cartItemState";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import isEmpty from "@/utils/validation/isEmpty";
import {
  MenuItem,
  MenuItemOption,
  MenuItemStatus,
  Prisma,
} from "@prisma/client";

export interface IMenuItem extends MenuItem {
  menuItemOptions: MenuItemOption[];
}

export interface CreateMenuItemParams {
  categoryId: string;
  subCategoryId?: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  imageVersion?: number;
  maxDailyOrders?: number;
  displayOrder?: number;
  status?: MenuItemStatus;
}
export interface UpdateMenuItemParams extends CreateMenuItemParams {
  id?: string;
}

export async function getAllMenuItemsByCategoryId(
  menuCategoryId: string | null | undefined
): Promise<MenuItem[] | null> {
  if (!menuCategoryId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.menuItem.findMany({
      where: {
        categoryId: menuCategoryId,
      },
    }),
    "getAllMenuItemsByCategoryId"
  );
}

export async function getAllMenuItemsByCategoryIdAndSub(
  menuCategoryId: string | null | undefined,
  menuSubCategoryId?: string | null
): Promise<MenuItem[] | null> {
  if (!menuCategoryId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.menuItem.findMany({
      where: {
        categoryId: menuCategoryId,
        subCategoryId: menuSubCategoryId,
      },
    }),
    "getAllMenuItemsByCategoryIdAndSub"
  );
}

export async function getMenuItemsByCartItems(
  cartItems: CartItem[] | null | undefined
): Promise<(MenuItem | null)[] | null> {
  if (!cartItems || isEmpty(cartItems)) {
    return null;
  }

  const promises = cartItems.map((cartItem) => {
    const queryCondition: Prisma.MenuItemWhereInput = {
      id: cartItem.menuId,
      categoryId: cartItem.categoryId,
    };

    const findFirstOptions: any = {
      where: queryCondition,
    };

    if (cartItem.selectedOptions.length > 0) {
      queryCondition.menuItemOptions = {
        some: {
          id: {
            in: cartItem.selectedOptions,
          },
        },
      };
      findFirstOptions.include = {
        menuItemOptions: true,
      };
    }

    return prisma.menuItem.findFirst(findFirstOptions);
  });

  const result = await prismaRequestHandler(
    Promise.all(promises),
    "getMenuItemsByCartItems"
  );

  return isEmpty(result) ? null : result;
}

export async function createMenuItem(
  menuItemInfo: CreateMenuItemParams,
  tx?: Prisma.TransactionClient
): Promise<MenuItem> {
  const prismaIns = tx || prisma;

  if (hasNullUndefined(menuItemInfo)) {
    throw new ValidationError(
      "Failed to create menu item. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuItem.create({
      data: {
        categoryId: menuItemInfo.categoryId,
        subCategoryId: menuItemInfo.subCategoryId,
        name: menuItemInfo.name,
        description: menuItemInfo.description,
        price: menuItemInfo.price,
        imageUrl: menuItemInfo.imageUrl,
        imageVersion: menuItemInfo.imageVersion,
        maxDailyOrders: menuItemInfo.maxDailyOrders,
        displayOrder: menuItemInfo.displayOrder,
        status: menuItemInfo.status,
      },
    }),
    "createMenuItem"
  );
}

export async function createManyMenuItems(
  menuItemsInfo: CreateMenuItemParams[],
  tx?: Prisma.TransactionClient
): Promise<Prisma.BatchPayload> {
  const prismaIns = tx || prisma;

  if (hasNullUndefined(menuItemsInfo)) {
    throw new ValidationError(
      "Failed to create menu items. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuItem.createMany({
      data: menuItemsInfo,
    }),
    "createManyMenuItems"
  );
}

export async function updateMenuItem(
  menuItemId: string | null | undefined,
  updateMenuItemInfo: UpdateMenuItemParams,
  tx?: Prisma.TransactionClient
): Promise<MenuItem> {
  const prismaIns = tx || prisma;

  if (!menuItemId || hasNullUndefined(updateMenuItemInfo)) {
    throw new ValidationError(
      "Failed to update menu item. Please try again later"
    );
  }

  return prismaRequestHandler(
    prismaIns.menuItem.update({
      where: {
        id: menuItemId,
      },
      data: updateMenuItemInfo,
    }),
    "updateMenuCategory"
  );
}

export async function deleteMenuItem(
  menuItemId: string | null | undefined
): Promise<MenuItem> {
  if (!menuItemId) {
    throw new ValidationError(
      "Failed to delete menu item. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.menuItem.delete({
      where: {
        id: menuItemId,
      },
    }),
    "deleteMenuItem"
  );
}

export async function getAllMenuItems(): Promise<MenuItem[] | null> {
  return null;
}
