import { RestaurantTable } from "@prisma/client";

export async function getRestaurantTable(
  restaurantId: string
): Promise<RestaurantTable | null | undefined> {
  if (!restaurantId) {
    return null;
  }

  try {
    const restaurantTableResult = await prisma?.restaurantTable.findFirst({
      where: {
        restaurantId,
      },
    });

    return restaurantTableResult;
  } catch (e) {
    console.error("Error fetching restaurant table by ID: ", e);
    throw e;
  }
}

export async function getAllRestaurantTables(): Promise<
  RestaurantTable[] | null
> {
  return null;
}

export async function createRestaurantTable(
  restaurantId: string
): Promise<RestaurantTable | null | undefined> {
  if (!restaurantId) {
    return null;
  }

  try {
    const newRestaurantTable = await prisma?.restaurantTable.create({
      data: {
        restaurantId,
      },
    });

    if (!newRestaurantTable) {
      throw new Error("failed to create restaurant table");
    }

    return newRestaurantTable;
  } catch (e) {
    console.error("Error creating restaurant table: ", e);
    throw e;
  }
}
