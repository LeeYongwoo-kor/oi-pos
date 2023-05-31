import prisma from "@/lib/services/prismadb";
import { Restaurant, RestaurantTable } from "@prisma/client";
import { createRestaurant } from "./restaurant";
import { createRestaurantTable } from "./restaurantTable";
import prismaRequestHandler from "@/lib/server/prismaRequestHandler";

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
