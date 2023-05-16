import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { RestaurantTable } from "@prisma/client";

export async function getRestaurantTable(
  restaurantId: string
): Promise<RestaurantTable | null> {
  if (!restaurantId) {
    return null;
  }

  const [restaurantTable, error] = await prismaRequestHandler(
    prisma.restaurantTable.findFirst({
      where: {
        restaurantId,
      },
    }),
    "getRestaurantTable"
  );

  if (error) {
    throw new Error(error.message);
  }

  return restaurantTable;
}

export async function getAllRestaurantTables(): Promise<
  RestaurantTable[] | null
> {
  return null;
}

export async function createRestaurantTable(
  restaurantId: string
): Promise<RestaurantTable> {
  if (!restaurantId) {
    throw new Error("failed to create restaurant table");
  }

  const [newRestaurantTable, error] = await prismaRequestHandler(
    prisma.restaurantTable.create({
      data: {
        restaurantId,
      },
    }),
    "createRestaurantTable"
  );

  if (error) {
    throw new Error(error.message);
  }

  return newRestaurantTable;
}
