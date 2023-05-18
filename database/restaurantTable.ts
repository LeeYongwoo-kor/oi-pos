import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/CustomError";
import { RestaurantTable } from "@prisma/client";

export async function getRestaurantTable(
  restaurantId: string
): Promise<RestaurantTable | null> {
  if (!restaurantId) {
    return null;
  }

  const restaurantTable = await prismaRequestHandler(
    prisma.restaurantTable.findFirst({
      where: {
        restaurantId,
      },
    }),
    "getRestaurantTable"
  );

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
    throw new ValidationError("failed to create restaurant table");
  }

  const newRestaurantTable = await prismaRequestHandler(
    prisma.restaurantTable.create({
      data: {
        restaurantId,
      },
    }),
    "createRestaurantTable"
  );

  return newRestaurantTable;
}
