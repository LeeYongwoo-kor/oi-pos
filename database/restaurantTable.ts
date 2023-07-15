import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/ApiError";
import convertDatesToISOString from "@/utils/convertDatesToISOString";
import { RestaurantTable } from "@prisma/client";

export async function getRestaurantTable(
  restaurantId: string | undefined | null
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

  return restaurantTable ? convertDatesToISOString(restaurantTable) : null;
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

  return convertDatesToISOString(newRestaurantTable);
}
