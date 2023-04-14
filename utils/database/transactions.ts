import { Restaurant, RestaurantTable } from "@prisma/client";
import { createRestaurant } from "./restaurant";
import { createRestaurantTable } from "./restaurantTable";

export async function createRestaurantAndTable(
  userId: string
): Promise<(Restaurant | RestaurantTable)[] | null | undefined> {
  try {
    const result = await prisma?.$transaction(async () => {
      // Create a new Restaurant for the new user
      const restaurant = await createRestaurant(userId);

      if (!restaurant) {
        throw new Error("failed to create restaurant");
      }

      // Create a new RestaurantTable for the new Restaurant
      const restaurantTable = await createRestaurantTable(restaurant.id);

      if (!restaurantTable) {
        throw new Error("failed to create restaurant table");
      }

      // Return the created Restaurant and RestaurantTable
      return [restaurant, restaurantTable];
    });

    return result;
  } catch (e) {
    console.error("Error creating restaurant and table: ", e);
    throw e;
  }
}
