import { TableType } from "@/constants/type";
import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/ApiError";
import { ISeatingConfig } from "@/pages/api/v1/restaurant/table";
import isPositiveInteger from "@/utils/validation/isPositiveInteger";
import {
  Plan,
  Restaurant,
  RestaurantTable,
  TableTypeAssignment,
} from "@prisma/client";
import { CreatePlanParams, upsertPlan } from "./plan";
import { createRestaurant } from "./restaurant";
import { createRestaurantTable } from "./restaurantTable";
import { createTableTypeAssignment } from "./tableTypeAssignment";

export async function createRestaurantAndTable(
  userId: string
): Promise<(Restaurant | RestaurantTable)[]> {
  const result = await prismaRequestHandler(
    prisma.$transaction(async () => {
      const restaurant = await createRestaurant(userId);
      const restaurantTable = await createRestaurantTable(restaurant.id);
      return [restaurant, restaurantTable];
    }),
    "createRestaurantAndTable"
  );

  return result;
}

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

      const { tableNumber, counterNumber } = seatingConfig;
      let table = null;
      let counter = null;

      if (!tableNumber && !counterNumber) {
        throw new ValidationError(
          "TableNumber and CounterNumber are not set values"
        );
      }

      const restaurantTable = await createRestaurantTable(restaurantId);
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
          TableType.TABLE,
          counterNumber
        );
      }

      return [restaurantTable, [table, counter]];
    }),
    "createRestaurantTableAndAssignment"
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
