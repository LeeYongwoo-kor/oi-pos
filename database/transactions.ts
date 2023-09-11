import { MenuCategoryOptionForm } from "@/components/menu/CategoryEdit";
import { TableType } from "@/constants/type";
import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import {
  IPutRestaurantTableBody,
  ISeatingConfig,
} from "@/pages/api/v1/restaurants/tables";
import {
  IMenuCategoryDemo,
  menuCategoriesDemo,
  menuItemsDemo,
  menuSubCategoriesDrinkDemo,
  menuSubCategoriesLunchDemo,
} from "@/sample/menus";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import isEmpty from "@/utils/validation/isEmpty";
import isPositiveInteger from "@/utils/validation/isPositiveInteger";
import {
  MenuCategory,
  Order,
  OrderStatus,
  Plan,
  Prisma,
  Restaurant,
  RestaurantTable,
  TableStatus,
  TableTypeAssignment,
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
import { createManyMenuItems } from "./menuItem";
import { CreatePlanParams, upsertPlan } from "./plan";
import { createRestaurantTable } from "./restaurantTable";
import {
  createTableTypeAssignment,
  upsertTableTypeAssignment,
} from "./tableTypeAssignment";

/**
 * @deprecated
 * This function is no longer used and will be removed in a future release
 */
export async function createRestaurantAndTable(
  userId: string
): Promise<Restaurant> {
  if (!userId) {
    throw new ValidationError(
      "Failed to create restaurant and restaurant table"
    );
  }

  return await prismaRequestHandler(
    prisma.$transaction(async (tx) => {
      // Create a new restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          userId,
          restaurantTables: {
            create: {
              qrCodeId: "test",
              tableType: TableType.TABLE,
              number: 1,
            },
          },
        },
        include: {
          restaurantTables: true,
        },
      });

      // Create a new restaurant table using the ID of the new restaurant
      // const restaurantTable = await tx.restaurantTable.create({
      //   data: {
      //     restaurantId: restaurant.id,
      //     qrCodeId: nanoid(),
      //     tableType: TableType.TABLE,
      //     number: 1,
      //   },
      // });

      // Return the new restaurant and the new restaurant table
      return restaurant;
    }),
    "createRestaurantAndTable"
  );
}

/**
 * @deprecated
 * This function is no longer used and will be removed in a future release
 */
export async function createRestaurantTableAndAssignment(
  restaurantId: string,
  seatingConfig: ISeatingConfig
): Promise<(RestaurantTable | (TableTypeAssignment | null)[])[]> {
  const result = await prismaRequestHandler(
    prisma.$transaction(async () => {
      if (!seatingConfig) {
        throw new ValidationError(
          "failed to create restaurant table and assignment"
        );
      }

      const tableNumber = Number(seatingConfig.tableNumber);
      const counterNumber = Number(seatingConfig.counterNumber);
      let table = null;
      let counter = null;

      if (!tableNumber && !counterNumber) {
        throw new ValidationError(
          "TableNumber and CounterNumber are not set values"
        );
      }

      const restaurantTable = await createRestaurantTable(
        restaurantId,
        "test",
        TableType.TABLE,
        1
      );
      if (tableNumber) {
        if (!isPositiveInteger(tableNumber)) {
          throw new ValidationError("TableNumber is not a positive number");
        }

        table = await createTableTypeAssignment(
          restaurantTable.id,
          TableType.TABLE,
          tableNumber
        );
      }
      if (counterNumber) {
        if (!isPositiveInteger(counterNumber)) {
          throw new ValidationError("CounterNumber is not a positive number");
        }

        counter = await createTableTypeAssignment(
          restaurantTable.id,
          TableType.COUNTER,
          counterNumber
        );
      }

      return [restaurantTable, [table, counter]];
    }),
    "createRestaurantTableAndAssignment"
  );

  return result;
}

/**
 * @deprecated
 * This function is no longer used and will be removed in a future release
 */
export async function upsertTableTypeAssignments(
  assignments: IPutRestaurantTableBody[]
): Promise<TableTypeAssignment[]> {
  const result = await prismaRequestHandler(
    prisma.$transaction(async () => {
      const assignmentPromises = assignments.map((assignment) =>
        upsertTableTypeAssignment(assignment)
      );

      const assignmentResult = await Promise.allSettled(assignmentPromises);
      const fullfilledResult = assignmentResult
        .filter(
          (result): result is PromiseFulfilledResult<TableTypeAssignment> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);

      if (fullfilledResult.length === 0) {
        throw new ValidationError("Failed to upsert table type assignments");
      }

      return fullfilledResult;
    }),
    "upsertTableTypeAssignments"
  );

  return result;
}

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

export async function activateOrder(restaurantTableId: string): Promise<Order> {
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

export async function reserveOrder(
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
          status: OrderStatus.PENDING,
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
    "reserveOrder"
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
  menuCategoryOptions: Omit<MenuCategoryOptionForm, "id">[]
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
  menuCategoryOptions: MenuCategoryOptionForm[]
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
