import prisma from "@/lib/services/prismadb";
import { Plan, Restaurant, RestaurantTable } from "@prisma/client";
import { createRestaurant } from "./restaurant";
import { createRestaurantTable } from "./restaurantTable";
import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import { CreatePlanParams, upsertPlan } from "./plan";

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
