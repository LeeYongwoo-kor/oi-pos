import { TableType } from "@/constants/type";
import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import {
  IPutRestaurantTableBody,
  ISeatingConfig,
} from "@/pages/api/v1/restaurants/tables";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import isPositiveInteger from "@/utils/validation/isPositiveInteger";
import {
  MenuCategory,
  MenuSubCategory,
  Order,
  OrderStatus,
  Plan,
  Restaurant,
  RestaurantTable,
  TableStatus,
  TableTypeAssignment,
} from "@prisma/client";
import { CreateMenuCategoryParams } from "./menuCategory";
import { CreateMenuSubCategoryParams } from "./menuSubCategory";
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

export async function createMenuCategoryWithSub(
  menuCategryInfo: CreateMenuCategoryParams,
  subCategoryInfo?: CreateMenuSubCategoryParams[]
): Promise<[MenuCategory, MenuSubCategory[] | undefined]> {
  return await prismaRequestHandler(
    prisma.$transaction(async (tx) => {
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

      const menuCategory = await tx.menuCategory.create({
        data: {
          restaurantId: menuCategryInfo.restaurantId,
          name: menuCategryInfo.name,
          description: menuCategryInfo.description,
          imageUrl: menuCategryInfo.imageUrl,
          displayOrder: menuCategryInfo.displayOrder,
        },
      });

      if (subCategoryInfo) {
        subMenuCategory = await Promise.all(
          subCategoryInfo.map((subCategory) =>
            tx.menuSubCategory.create({
              data: {
                categoryId: menuCategory.id,
                name: subCategory.name,
              },
            })
          )
        );
      }

      return [menuCategory, subMenuCategory];
    }),
    "createMenuCategoryWithSub"
  );
}
