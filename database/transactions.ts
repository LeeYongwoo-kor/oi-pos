import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import {
  IMenuCategoryDemo,
  menuCategoriesDemo,
  menuItemsDemo,
  menuSubCategoriesDrinkDemo,
  menuSubCategoriesLunchDemo,
} from "@/sample/menus";
import {
  MenuItemOptionForm,
  MenuOptionForm,
} from "@/utils/menu/validateMenuOptions";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import isEmpty from "@/utils/validation/isEmpty";
import {
  MenuCategory,
  MenuItem,
  Order,
  OrderStatus,
  Plan,
  Prisma,
  TableStatus,
} from "@prisma/client";
import {
  CreateMenuCategoryParams,
  UpdateMenuCategoryParams,
  createMenuCategory,
  createMenuCategoryWithSub,
  updateMenuCategory,
} from "./menuCategory";
import {
  createMenuCategoryOption,
  deleteMenuCategoryOption,
  getMenuCategoryOptionByCategoryId,
  updateMenuCategoryOption,
} from "./menuCategoryOption";
import {
  CreateMenuItemParams,
  UpdateMenuItemParams,
  createManyMenuItems,
  createMenuItem,
  updateMenuItem,
} from "./menuItem";
import {
  createMenuItemOption,
  deleteMenuItemOption,
  getMenuItemOptionByMenuItemId,
  updateMenuItemOption,
} from "./menuItemOption";
import { CreatePlanParams, upsertPlan } from "./plan";

export async function upsertPlans(plans: CreatePlanParams[]): Promise<Plan[]> {
  const result = await prismaRequestHandler(
    prisma.$transaction(async () => {
      const planPromises = plans.map((plan) => upsertPlan(plan));
      const planResult = await Promise.all(planPromises);
      return planResult;
    }),
    "upsertPlans"
  );

  return result;
}

export async function createAndActivateOrder(
  restaurantTableId: string
): Promise<Order> {
  if (!restaurantTableId) {
    throw new ValidationError(
      "Failed to activate order for restaurant table. Please try again"
    );
  }

  return await prismaRequestHandler(
    prisma.$transaction(async (tx) => {
      // Create a new order
      const order = await tx.order.create({
        data: {
          tableId: restaurantTableId,
          status: OrderStatus.ORDERED,
        },
      });

      // Update the restaurant table to be occupied
      await tx.restaurantTable.update({
        where: {
          id: restaurantTableId,
        },
        data: {
          status: TableStatus.OCCUPIED,
        },
      });

      // Return the order
      return order;
    }),
    "activateOrder"
  );
}

export async function createAndReserveOrder(
  restaurantTableId: string,
  customerName: string
): Promise<Order> {
  if (!restaurantTableId) {
    throw new ValidationError(
      "Failed to reserve order for restaurant table. Please try again"
    );
  }

  if (!customerName) {
    throw new ValidationError("Customer name is required. Please try again");
  }

  return await prismaRequestHandler(
    prisma.$transaction(async (tx) => {
      // Create a new order
      const order = await tx.order.create({
        data: {
          tableId: restaurantTableId,
          customerName,
          status: OrderStatus.ORDERED,
        },
      });

      // Update the restaurant table to be reserved
      await tx.restaurantTable.update({
        where: {
          id: restaurantTableId,
        },
        data: {
          status: TableStatus.RESERVED,
        },
      });

      // Return the order
      return order;
    }),
    "createAndReserveOrder"
  );
}

export async function createDemoMenus(
  restaurantId: string | null | undefined
): Promise<Prisma.BatchPayload> {
  if (!restaurantId) {
    throw new ValidationError(
      "Failed to create demo menu. Please try again later"
    );
  }

  return await prisma.$transaction(async (tx) => {
    const [lunchCategory, lunchSubCategory] = await createMenuCategoryWithSub(
      menuCategoriesDemo(restaurantId)[0],
      menuSubCategoriesLunchDemo,
      tx
    );

    const [drinkCategory, drinkSubCategory] = await createMenuCategoryWithSub(
      menuCategoriesDemo(restaurantId)[1],
      menuSubCategoriesDrinkDemo,
      tx
    );

    const [dessertCategory] = await createMenuCategoryWithSub(
      menuCategoriesDemo(restaurantId)[2],
      undefined,
      tx
    );

    const demoData: IMenuCategoryDemo = {
      lunchCategoryId: lunchCategory.id,
      burgerSubCategoryId: lunchSubCategory! && lunchSubCategory[0].id,
      pastaSubCategoryId: lunchSubCategory! && lunchSubCategory[1].id,
      drinkCategoryId: drinkCategory.id,
      coffeeSubCategoryId: drinkSubCategory! && drinkSubCategory[0].id,
      softDrinkSubCategoryId: drinkSubCategory! && drinkSubCategory[1].id,
      dessertCategoryId: dessertCategory.id,
    };

    const demoMenuItems = menuItemsDemo(restaurantId, demoData);
    const createMenuItemResult = await createManyMenuItems(demoMenuItems, tx);

    if (!createMenuItemResult || createMenuItemResult.count < 1) {
      throw new ValidationError(
        "Failed to create demo menu. Please try again later"
      );
    }

    return createMenuItemResult;
  });
}

export async function createMenuCategoryAndCategoryOptions(
  menuCategoryInfo: CreateMenuCategoryParams,
  menuCategoryOptions: Omit<MenuOptionForm, "id">[]
): Promise<MenuCategory> {
  if (
    hasNullUndefined(menuCategoryInfo) ||
    hasNullUndefined(menuCategoryOptions)
  ) {
    throw new ValidationError(
      "Failed to create menu category and upsert category options"
    );
  }

  return await prisma.$transaction(async (tx) => {
    const newMenuCategory = await createMenuCategory(menuCategoryInfo, tx);

    if (!isEmpty(menuCategoryOptions)) {
      const promises = menuCategoryOptions.map((option) => {
        const { error, ...data } = option;
        return createMenuCategoryOption(
          { ...data, categoryId: newMenuCategory.id },
          tx
        );
      });
      await Promise.all(promises);
    }

    return newMenuCategory;
  });
}

export async function updateMenuCategoryAndUpsertCategoryOptions(
  menuCategoryInfo: UpdateMenuCategoryParams,
  menuCategoryOptions: MenuOptionForm[]
): Promise<MenuCategory> {
  if (
    hasNullUndefined(menuCategoryInfo) ||
    hasNullUndefined(menuCategoryOptions)
  ) {
    throw new ValidationError(
      "Failed to update menu category and upsert category options"
    );
  }

  return await prisma.$transaction(async (tx) => {
    const newMenuCategory = await updateMenuCategory(
      menuCategoryInfo.id,
      menuCategoryInfo,
      tx
    );

    const existingOptions = await getMenuCategoryOptionByCategoryId(
      menuCategoryInfo.id
    );

    const allOperations: Promise<unknown>[] = [];

    if (existingOptions !== null) {
      const existingOptionIds = existingOptions.map((option) => option.id);
      const updatedOptionIds = menuCategoryOptions
        .map((option) => option.id)
        .filter(Boolean);
      const optionsToDelete = existingOptionIds.filter(
        (id) => !updatedOptionIds.includes(id)
      );

      const deletePromises = optionsToDelete.map((id) =>
        deleteMenuCategoryOption(id, tx)
      );
      allOperations.push(...deletePromises);
    }

    const upsertPromises = menuCategoryOptions.map((option) => {
      const { id, error, ...data } = option;

      if (id) {
        const existingOption = existingOptions?.find((opt) => opt.id === id);
        if (
          existingOption &&
          (existingOption.name !== data.name ||
            existingOption.price !== data.price)
        ) {
          return updateMenuCategoryOption(id, data, tx);
        }
        return Promise.resolve(null);
      } else {
        return createMenuCategoryOption(
          { ...data, categoryId: menuCategoryInfo.id },
          tx
        );
      }
    });
    allOperations.push(...upsertPromises);

    await Promise.all(allOperations);

    return newMenuCategory;
  });
}

export async function createMenuItemAndMenuOptions(
  menuItemInfo: CreateMenuItemParams,
  menuItemOptions: Omit<MenuItemOptionForm, "id">[]
): Promise<MenuItem> {
  if (hasNullUndefined(menuItemInfo) || hasNullUndefined(menuItemOptions)) {
    throw new ValidationError("Failed to create menu and upsert menu options");
  }

  return await prisma.$transaction(async (tx) => {
    const newMenuItem = await createMenuItem(menuItemInfo, tx);

    if (!isEmpty(menuItemOptions)) {
      const promises = menuItemOptions.map((option) => {
        const { error, categoryOptionId, ...data } = option;
        return createMenuItemOption(
          {
            ...data,
            menuItemId: newMenuItem.id,
            menuCategoryOptionId: categoryOptionId,
          },
          tx
        );
      });
      await Promise.all(promises);
    }

    return newMenuItem;
  });
}

export async function updateMenuItemAndUpsertItemOptions(
  menuItemInfo: UpdateMenuItemParams,
  menuItemOptions: MenuItemOptionForm[]
): Promise<MenuItem> {
  if (hasNullUndefined(menuItemInfo) || hasNullUndefined(menuItemOptions)) {
    throw new ValidationError("Failed to update menu and upsert menu options");
  }

  return await prisma.$transaction(async (tx) => {
    const newMenuItem = await updateMenuItem(menuItemInfo.id, menuItemInfo, tx);

    const existingOptions = await getMenuItemOptionByMenuItemId(
      menuItemInfo.id
    );

    const allOperations: Promise<unknown>[] = [];

    if (existingOptions !== null) {
      const existingOptionIds = existingOptions.map((option) => option.id);
      const updatedOptionIds = menuItemOptions
        .map((option) => option.id)
        .filter(Boolean);
      const optionsToDelete = existingOptionIds.filter(
        (id) => !updatedOptionIds.includes(id)
      );

      const deletePromises = optionsToDelete.map((id) =>
        deleteMenuItemOption(id, tx)
      );
      allOperations.push(...deletePromises);
    }

    const upsertPromises = menuItemOptions.map((option) => {
      const { id, error, categoryOptionId, ...data } = option;

      if (id) {
        const existingOption = existingOptions?.find((opt) => opt.id === id);
        if (
          existingOption &&
          (existingOption.name !== data.name ||
            existingOption.price !== data.price)
        ) {
          return updateMenuItemOption(id, data, tx);
        }
        return Promise.resolve(null);
      } else {
        return createMenuItemOption(
          {
            ...data,
            menuItemId: menuItemInfo.id,
            menuCategoryOptionId: categoryOptionId,
          },
          tx
        );
      }
    });
    allOperations.push(...upsertPromises);

    await Promise.all(allOperations);

    return newMenuItem;
  });
}
